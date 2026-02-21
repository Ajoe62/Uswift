import { db } from '../config/database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface Entitlement {
  id: string;
  userId: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'expired';
  features: string[];
  validFrom: Date;
  validTo: Date | null;
  source: 'subscription' | 'one_time' | 'manual' | 'trial';
  sourceId: string | null;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEntitlementInput {
  userId: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'expired';
  features: string[];
  validFrom?: Date;
  validTo?: Date | null;
  source: 'subscription' | 'one_time' | 'manual' | 'trial';
  sourceId?: string | null;
  metadata?: Record<string, any>;
}

export interface EntitlementResponse {
  plan: 'free' | 'pro';
  status: 'active' | 'past_due' | 'canceled' | 'expired' | 'none';
  currentPeriodEnd?: string;
  features: string[];
}

/**
 * EntitlementService - Source of truth for feature access
 * Manages user entitlements based on payments and subscriptions
 */
export class EntitlementService {
  private static instance: EntitlementService;

  private constructor() {}

  static getInstance(): EntitlementService {
    if (!EntitlementService.instance) {
      EntitlementService.instance = new EntitlementService();
    }
    return EntitlementService.instance;
  }

  /**
   * Get feature definitions for each plan
   */
  private getPlanFeatures(plan: 'free' | 'pro' | 'enterprise'): string[] {
    const features: Record<string, string[]> = {
      free: ['basic_apply', 'profile_storage'],
      pro: [
        'basic_apply',
        'profile_storage',
        'auto_apply',
        'ai_resume_optimization',
        'ai_cover_letter',
        'priority_support',
        'application_tracking',
        'job_queue',
        'unlimited_applies',
      ],
      enterprise: [
        'basic_apply',
        'profile_storage',
        'auto_apply',
        'ai_resume_optimization',
        'ai_cover_letter',
        'priority_support',
        'application_tracking',
        'job_queue',
        'unlimited_applies',
        'team_features',
        'analytics',
        'api_access',
      ],
    };

    return features[plan] || features.free;
  }

  /**
   * Create a new entitlement
   */
  async createEntitlement(input: CreateEntitlementInput): Promise<Entitlement> {
    const id = uuidv4();
    const features = input.features.length > 0 ? input.features : this.getPlanFeatures(input.plan);

    const query = `
      INSERT INTO entitlements (
        id, user_id, plan, status, features, valid_from, valid_to, source, source_id, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      id,
      input.userId,
      input.plan,
      input.status,
      JSON.stringify(features),
      input.validFrom || new Date(),
      input.validTo || null,
      input.source,
      input.sourceId || null,
      JSON.stringify(input.metadata || {}),
    ];

    try {
      const result = await db.query<Entitlement>(query, values);
      const entitlement = this.mapRowToEntitlement(result.rows[0]);

      logger.info('Entitlement created', {
        entitlementId: id,
        userId: input.userId,
        plan: input.plan,
        source: input.source,
      });

      return entitlement;
    } catch (error: any) {
      logger.error('Failed to create entitlement', { error, input });
      throw new Error(`Failed to create entitlement: ${error.message}`);
    }
  }

  /**
   * Get active entitlement for a user
   */
  async getActiveEntitlement(userId: string): Promise<Entitlement | null> {
    const query = `
      SELECT * FROM entitlements
      WHERE user_id = $1
        AND status = 'active'
        AND (valid_to IS NULL OR valid_to > NOW())
      ORDER BY created_at DESC
      LIMIT 1
    `;

    try {
      const result = await db.query<any>(query, [userId]);
      if (result.rows.length === 0) {
        return null;
      }
      return this.mapRowToEntitlement(result.rows[0]);
    } catch (error: any) {
      logger.error('Failed to get active entitlement', { error, userId });
      throw new Error(`Failed to get active entitlement: ${error.message}`);
    }
  }

  /**
   * Get all entitlements for a user
   */
  async getUserEntitlements(userId: string): Promise<Entitlement[]> {
    const query = `
      SELECT * FROM entitlements
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    try {
      const result = await db.query<any>(query, [userId]);
      return result.rows.map((row) => this.mapRowToEntitlement(row));
    } catch (error: any) {
      logger.error('Failed to get user entitlements', { error, userId });
      throw new Error(`Failed to get user entitlements: ${error.message}`);
    }
  }

  /**
   * Update entitlement status
   */
  async updateEntitlementStatus(
    entitlementId: string,
    status: 'active' | 'past_due' | 'canceled' | 'expired'
  ): Promise<Entitlement> {
    const query = `
      UPDATE entitlements
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    try {
      const result = await db.query<any>(query, [status, entitlementId]);
      if (result.rows.length === 0) {
        throw new Error('Entitlement not found');
      }

      const entitlement = this.mapRowToEntitlement(result.rows[0]);

      logger.info('Entitlement status updated', {
        entitlementId,
        newStatus: status,
      });

      return entitlement;
    } catch (error: any) {
      logger.error('Failed to update entitlement status', { error, entitlementId, status });
      throw new Error(`Failed to update entitlement status: ${error.message}`);
    }
  }

  /**
   * Revoke entitlement (set to expired)
   */
  async revokeEntitlement(entitlementId: string): Promise<void> {
    const query = `
      UPDATE entitlements
      SET status = 'expired', valid_to = NOW(), updated_at = NOW()
      WHERE id = $1
    `;

    try {
      await db.query(query, [entitlementId]);
      logger.info('Entitlement revoked', { entitlementId });
    } catch (error: any) {
      logger.error('Failed to revoke entitlement', { error, entitlementId });
      throw new Error(`Failed to revoke entitlement: ${error.message}`);
    }
  }

  /**
   * Grant entitlement from subscription
   */
  async grantSubscriptionEntitlement(
    userId: string,
    subscriptionId: string,
    plan: 'pro' | 'enterprise',
    currentPeriodEnd: Date
  ): Promise<Entitlement> {
    // Revoke any existing active entitlements
    await this.revokeAllActiveEntitlements(userId);

    return await this.createEntitlement({
      userId,
      plan,
      status: 'active',
      features: this.getPlanFeatures(plan),
      validFrom: new Date(),
      validTo: currentPeriodEnd,
      source: 'subscription',
      sourceId: subscriptionId,
      metadata: {
        subscriptionId,
        grantedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Grant entitlement from one-time payment
   */
  async grantOneTimeEntitlement(
    userId: string,
    paymentId: string,
    plan: 'pro',
    durationDays: number = 30
  ): Promise<Entitlement> {
    const validTo = new Date();
    validTo.setDate(validTo.getDate() + durationDays);

    return await this.createEntitlement({
      userId,
      plan,
      status: 'active',
      features: this.getPlanFeatures(plan),
      validFrom: new Date(),
      validTo,
      source: 'one_time',
      sourceId: paymentId,
      metadata: {
        paymentId,
        durationDays,
        grantedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Grant trial entitlement
   */
  async grantTrialEntitlement(userId: string, trialDays: number = 14): Promise<Entitlement> {
    const validTo = new Date();
    validTo.setDate(validTo.getDate() + trialDays);

    return await this.createEntitlement({
      userId,
      plan: 'pro',
      status: 'active',
      features: this.getPlanFeatures('pro'),
      validFrom: new Date(),
      validTo,
      source: 'trial',
      metadata: {
        trialDays,
        grantedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Revoke all active entitlements for a user
   */
  private async revokeAllActiveEntitlements(userId: string): Promise<void> {
    const query = `
      UPDATE entitlements
      SET status = 'expired', valid_to = NOW(), updated_at = NOW()
      WHERE user_id = $1 AND status = 'active'
    `;

    try {
      await db.query(query, [userId]);
      logger.info('All active entitlements revoked for user', { userId });
    } catch (error: any) {
      logger.error('Failed to revoke active entitlements', { error, userId });
      throw new Error(`Failed to revoke active entitlements: ${error.message}`);
    }
  }

  /**
   * Validate entitlement (for license API)
   */
  async validateEntitlement(userId: string): Promise<{
    valid: boolean;
    plan: 'free' | 'pro';
    expiresAt?: string;
  }> {
    const entitlement = await this.getActiveEntitlement(userId);

    if (!entitlement) {
      return {
        valid: false,
        plan: 'free',
      };
    }

    return {
      valid: true,
      plan: entitlement.plan === 'enterprise' ? 'pro' : entitlement.plan,
      expiresAt: entitlement.validTo?.toISOString(),
    };
  }

  /**
   * Get entitlement response for API
   */
  async getEntitlementResponse(userId: string): Promise<EntitlementResponse> {
    const entitlement = await this.getActiveEntitlement(userId);

    if (!entitlement) {
      return {
        plan: 'free',
        status: 'none',
        features: this.getPlanFeatures('free'),
      };
    }

    return {
      plan: entitlement.plan === 'enterprise' ? 'pro' : entitlement.plan,
      status: entitlement.status,
      currentPeriodEnd: entitlement.validTo?.toISOString(),
      features: entitlement.features,
    };
  }

  /**
   * Check if user has feature access
   */
  async hasFeature(userId: string, feature: string): Promise<boolean> {
    const entitlement = await this.getActiveEntitlement(userId);
    if (!entitlement) {
      return false;
    }
    return entitlement.features.includes(feature);
  }

  /**
   * Map database row to Entitlement object
   */
  private mapRowToEntitlement(row: any): Entitlement {
    return {
      id: row.id,
      userId: row.user_id,
      plan: row.plan,
      status: row.status,
      features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features,
      validFrom: new Date(row.valid_from),
      validTo: row.valid_to ? new Date(row.valid_to) : null,
      source: row.source,
      sourceId: row.source_id,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export const entitlementService = EntitlementService.getInstance();
