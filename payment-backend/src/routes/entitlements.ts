import { Router } from 'express';
import { authenticateJWT, authenticateExtension, AuthRequest } from '../middleware/auth';
import { validate, validateLicenseSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { entitlementService } from '../services/EntitlementService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/entitlements
 * Get current user's entitlements
 * Used by web app and extension to check feature access
 */
router.get(
  '/',
  authenticateJWT,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.userId;

    try {
      const entitlement = await entitlementService.getEntitlementResponse(userId);

      logger.info('Entitlement retrieved', { userId, plan: entitlement.plan });

      res.json(entitlement);
    } catch (error: any) {
      logger.error('Failed to get entitlement', { error: error.message, userId });
      res.status(500).json({
        error: 'EntitlementFetchFailed',
        message: error.message,
      });
    }
  })
);

/**
 * POST /api/licenses/validate
 * Validate license for extension
 * Uses separate extension token authentication
 * Extension calls this on startup and periodically
 */
router.post(
  '/licenses/validate',
  authenticateExtension,
  validate(validateLicenseSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { userId } = req.body;

    // Verify the authenticated user matches the requested userId
    if (req.user!.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Token user ID does not match requested user ID',
      });
    }

    try {
      const validation = await entitlementService.validateEntitlement(userId);

      logger.info('License validated', { userId, valid: validation.valid, plan: validation.plan });

      res.json(validation);
    } catch (error: any) {
      logger.error('License validation failed', { error: error.message, userId });
      res.status(500).json({
        error: 'LicenseValidationFailed',
        message: error.message,
      });
    }
  })
);

/**
 * GET /api/entitlements/features/:feature
 * Check if user has access to a specific feature
 */
router.get(
  '/features/:feature',
  authenticateJWT,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const { feature } = req.params;

    try {
      const hasAccess = await entitlementService.hasFeature(userId, feature);

      res.json({
        feature,
        hasAccess,
      });
    } catch (error: any) {
      logger.error('Feature check failed', { error: error.message, userId, feature });
      res.status(500).json({
        error: 'FeatureCheckFailed',
        message: error.message,
      });
    }
  })
);

/**
 * GET /api/entitlements/history
 * Get user's entitlement history
 */
router.get(
  '/history',
  authenticateJWT,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.userId;

    try {
      const entitlements = await entitlementService.getUserEntitlements(userId);

      res.json({
        entitlements,
        count: entitlements.length,
      });
    } catch (error: any) {
      logger.error('Failed to get entitlement history', { error: error.message, userId });
      res.status(500).json({
        error: 'EntitlementHistoryFailed',
        message: error.message,
      });
    }
  })
);

export default router;
