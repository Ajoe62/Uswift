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
export declare class EntitlementService {
    private static instance;
    private constructor();
    static getInstance(): EntitlementService;
    /**
     * Get feature definitions for each plan
     */
    private getPlanFeatures;
    /**
     * Create a new entitlement
     */
    createEntitlement(input: CreateEntitlementInput): Promise<Entitlement>;
    /**
     * Get active entitlement for a user
     */
    getActiveEntitlement(userId: string): Promise<Entitlement | null>;
    /**
     * Get all entitlements for a user
     */
    getUserEntitlements(userId: string): Promise<Entitlement[]>;
    /**
     * Update entitlement status
     */
    updateEntitlementStatus(entitlementId: string, status: 'active' | 'past_due' | 'canceled' | 'expired'): Promise<Entitlement>;
    /**
     * Revoke entitlement (set to expired)
     */
    revokeEntitlement(entitlementId: string): Promise<void>;
    /**
     * Grant entitlement from subscription
     */
    grantSubscriptionEntitlement(userId: string, subscriptionId: string, plan: 'pro' | 'enterprise', currentPeriodEnd: Date): Promise<Entitlement>;
    /**
     * Grant entitlement from one-time payment
     */
    grantOneTimeEntitlement(userId: string, paymentId: string, plan: 'pro', durationDays?: number): Promise<Entitlement>;
    /**
     * Grant trial entitlement
     */
    grantTrialEntitlement(userId: string, trialDays?: number): Promise<Entitlement>;
    /**
     * Revoke all active entitlements for a user
     */
    private revokeAllActiveEntitlements;
    /**
     * Validate entitlement (for license API)
     */
    validateEntitlement(userId: string): Promise<{
        valid: boolean;
        plan: 'free' | 'pro';
        expiresAt?: string;
    }>;
    /**
     * Get entitlement response for API
     */
    getEntitlementResponse(userId: string): Promise<EntitlementResponse>;
    /**
     * Check if user has feature access
     */
    hasFeature(userId: string, feature: string): Promise<boolean>;
    /**
     * Map database row to Entitlement object
     */
    private mapRowToEntitlement;
}
export declare const entitlementService: EntitlementService;
//# sourceMappingURL=EntitlementService.d.ts.map