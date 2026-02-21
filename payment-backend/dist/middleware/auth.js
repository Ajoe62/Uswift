"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = authenticateJWT;
exports.authenticateExtension = authenticateExtension;
exports.authenticateAdmin = authenticateAdmin;
exports.optionalAuth = optionalAuth;
exports.generateToken = generateToken;
exports.generateExtensionToken = generateExtensionToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
/**
 * Verify JWT token from Authorization header
 */
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Missing authorization header' });
    }
    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) {
        return res.status(401).json({ error: 'Missing token' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.auth.jwtSecret);
        req.user = {
            userId: decoded.userId || decoded.sub,
            email: decoded.email,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        logger_1.logger.warn('JWT verification failed', { error: error.message });
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}
/**
 * Verify extension token (for license validation)
 * Uses a separate secret for extension-to-backend communication
 */
function authenticateExtension(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Missing authorization header' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Missing token' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.auth.extensionTokenSecret);
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
        };
        next();
    }
    catch (error) {
        logger_1.logger.warn('Extension token verification failed', { error: error.message });
        return res.status(403).json({ error: 'Invalid or expired extension token' });
    }
}
/**
 * Verify admin API key
 */
function authenticateAdmin(req, res, next) {
    const apiKey = req.headers['x-admin-api-key'];
    if (!apiKey) {
        return res.status(401).json({ error: 'Missing admin API key' });
    }
    if (apiKey !== config_1.config.admin.apiKey) {
        logger_1.logger.warn('Invalid admin API key attempt', { ip: req.ip });
        return res.status(403).json({ error: 'Invalid admin API key' });
    }
    next();
}
/**
 * Optional authentication - doesn't fail if token is missing
 * Useful for endpoints that work with or without auth
 */
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next();
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return next();
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.auth.jwtSecret);
        req.user = {
            userId: decoded.userId || decoded.sub,
            email: decoded.email,
            role: decoded.role,
        };
    }
    catch (error) {
        // Ignore token errors for optional auth
    }
    next();
}
/**
 * Generate JWT token for user
 */
function generateToken(userId, email, role) {
    const expiresIn = config_1.config.auth.jwtExpiresIn;
    return jsonwebtoken_1.default.sign({
        userId,
        email,
        role,
    }, config_1.config.auth.jwtSecret, {
        expiresIn,
    });
}
/**
 * Generate extension token (shorter TTL, used for license checks)
 */
function generateExtensionToken(userId, email) {
    return jsonwebtoken_1.default.sign({
        userId,
        email,
    }, config_1.config.auth.extensionTokenSecret, {
        expiresIn: '24h', // Extension tokens expire faster
    });
}
//# sourceMappingURL=auth.js.map