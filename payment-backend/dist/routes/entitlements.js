"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const errorHandler_1 = require("../middleware/errorHandler");
const EntitlementService_1 = require("../services/EntitlementService");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
/**
 * GET /api/entitlements
 * Get current user's entitlements
 * Used by web app and extension to check feature access
 */
router.get('/', auth_1.authenticateJWT, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    try {
        const entitlement = await EntitlementService_1.entitlementService.getEntitlementResponse(userId);
        logger_1.logger.info('Entitlement retrieved', { userId, plan: entitlement.plan });
        res.json(entitlement);
    }
    catch (error) {
        logger_1.logger.error('Failed to get entitlement', { error: error.message, userId });
        res.status(500).json({
            error: 'EntitlementFetchFailed',
            message: error.message,
        });
    }
}));
/**
 * POST /api/licenses/validate
 * Validate license for extension
 * Uses separate extension token authentication
 * Extension calls this on startup and periodically
 */
router.post('/licenses/validate', auth_1.authenticateExtension, (0, validation_1.validate)(validation_1.validateLicenseSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.body;
    // Verify the authenticated user matches the requested userId
    if (req.user.userId !== userId) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Token user ID does not match requested user ID',
        });
    }
    try {
        const validation = await EntitlementService_1.entitlementService.validateEntitlement(userId);
        logger_1.logger.info('License validated', { userId, valid: validation.valid, plan: validation.plan });
        res.json(validation);
    }
    catch (error) {
        logger_1.logger.error('License validation failed', { error: error.message, userId });
        res.status(500).json({
            error: 'LicenseValidationFailed',
            message: error.message,
        });
    }
}));
/**
 * GET /api/entitlements/features/:feature
 * Check if user has access to a specific feature
 */
router.get('/features/:feature', auth_1.authenticateJWT, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const { feature } = req.params;
    try {
        const hasAccess = await EntitlementService_1.entitlementService.hasFeature(userId, feature);
        res.json({
            feature,
            hasAccess,
        });
    }
    catch (error) {
        logger_1.logger.error('Feature check failed', { error: error.message, userId, feature });
        res.status(500).json({
            error: 'FeatureCheckFailed',
            message: error.message,
        });
    }
}));
/**
 * GET /api/entitlements/history
 * Get user's entitlement history
 */
router.get('/history', auth_1.authenticateJWT, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    try {
        const entitlements = await EntitlementService_1.entitlementService.getUserEntitlements(userId);
        res.json({
            entitlements,
            count: entitlements.length,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get entitlement history', { error: error.message, userId });
        res.status(500).json({
            error: 'EntitlementHistoryFailed',
            message: error.message,
        });
    }
}));
exports.default = router;
//# sourceMappingURL=entitlements.js.map