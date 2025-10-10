import { EntitlementService } from '../services/EntitlementService';

describe('EntitlementService', () => {
  let service: EntitlementService;

  beforeEach(() => {
    service = EntitlementService.getInstance();
  });

  describe('getPlanFeatures', () => {
    it('should return correct features for free plan', () => {
      const features = (service as any).getPlanFeatures('free');
      expect(features).toContain('basic_apply');
      expect(features).toContain('profile_storage');
      expect(features).not.toContain('auto_apply');
    });

    it('should return correct features for pro plan', () => {
      const features = (service as any).getPlanFeatures('pro');
      expect(features).toContain('auto_apply');
      expect(features).toContain('ai_resume_optimization');
      expect(features).toContain('unlimited_applies');
    });
  });

  describe('createEntitlement', () => {
    it('should create entitlement with default features', async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        rows: [
          {
            id: 'test-id',
            user_id: 'user-123',
            plan: 'pro',
            status: 'active',
            features: JSON.stringify(['auto_apply', 'ai_resume']),
            valid_from: new Date(),
            valid_to: null,
            source: 'subscription',
            source_id: 'sub-123',
            metadata: '{}',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });

      // Mock db.query
      jest.spyOn(require('../config/database').db, 'query').mockImplementation(mockQuery);

      const entitlement = await service.createEntitlement({
        userId: 'user-123',
        plan: 'pro',
        status: 'active',
        features: [],
        source: 'subscription',
        sourceId: 'sub-123',
      });

      expect(entitlement.userId).toBe('user-123');
      expect(entitlement.plan).toBe('pro');
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('validateEntitlement', () => {
    it('should return valid for active entitlement', async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        rows: [
          {
            id: 'test-id',
            user_id: 'user-123',
            plan: 'pro',
            status: 'active',
            features: '["auto_apply"]',
            valid_from: new Date(),
            valid_to: new Date(Date.now() + 86400000),
            source: 'subscription',
            source_id: null,
            metadata: '{}',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });

      jest.spyOn(require('../config/database').db, 'query').mockImplementation(mockQuery);

      const validation = await service.validateEntitlement('user-123');

      expect(validation.valid).toBe(true);
      expect(validation.plan).toBe('pro');
      expect(validation.expiresAt).toBeDefined();
    });

    it('should return invalid for no entitlement', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ rows: [] });
      jest.spyOn(require('../config/database').db, 'query').mockImplementation(mockQuery);

      const validation = await service.validateEntitlement('user-123');

      expect(validation.valid).toBe(false);
      expect(validation.plan).toBe('free');
    });
  });

  describe('hasFeature', () => {
    it('should return true for owned feature', async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        rows: [
          {
            id: 'test-id',
            user_id: 'user-123',
            plan: 'pro',
            status: 'active',
            features: '["auto_apply", "ai_resume"]',
            valid_from: new Date(),
            valid_to: null,
            source: 'subscription',
            source_id: null,
            metadata: '{}',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });

      jest.spyOn(require('../config/database').db, 'query').mockImplementation(mockQuery);

      const hasFeature = await service.hasFeature('user-123', 'auto_apply');
      expect(hasFeature).toBe(true);
    });

    it('should return false for non-owned feature', async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        rows: [
          {
            id: 'test-id',
            user_id: 'user-123',
            plan: 'free',
            status: 'active',
            features: '["basic_apply"]',
            valid_from: new Date(),
            valid_to: null,
            source: 'manual',
            source_id: null,
            metadata: '{}',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });

      jest.spyOn(require('../config/database').db, 'query').mockImplementation(mockQuery);

      const hasFeature = await service.hasFeature('user-123', 'auto_apply');
      expect(hasFeature).toBe(false);
    });
  });
});
