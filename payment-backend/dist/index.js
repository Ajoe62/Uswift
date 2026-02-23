"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("./config");
const database_1 = require("./config/database");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimit_1 = require("./middleware/rateLimit");
// Import gateways
const StripeGateway_1 = require("./gateways/StripeGateway");
const PaymentGateway_1 = require("./gateways/PaymentGateway");
// Import routes
const checkout_1 = __importDefault(require("./routes/checkout"));
const entitlements_1 = __importDefault(require("./routes/entitlements"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
const admin_1 = __importDefault(require("./routes/admin"));
/**
 * Uswift Payment Backend
 * MV3-compliant, PCI SAQ A friendly payment system
 */
// Validate environment variables
try {
    (0, config_1.validateConfig)();
}
catch (error) {
    logger_1.logger.error('Configuration validation failed', { error: error.message });
    process.exit(1);
}
const app = (0, express_1.default)();
// ============================================================================
// Security & Middleware
// ============================================================================
// Helmet for security headers
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
}));
// CORS
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin)
            return callback(null, true);
        // Check if origin is allowed
        const allowedOrigins = config_1.config.corsOrigins;
        // Allow chrome-extension:// origins
        if (origin.startsWith('chrome-extension://')) {
            return callback(null, true);
        }
        // Check configured origins
        if (allowedOrigins.some((allowed) => origin.includes(allowed))) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-API-Key', 'X-Correlation-ID'],
};
app.use((0, cors_1.default)(corsOptions));
// ============================================================================
// Body Parsing
// ============================================================================
// RAW body for webhooks (Stripe signature verification requires raw body)
app.use('/webhooks', express_1.default.raw({ type: 'application/json', limit: '1mb' }));
// JSON body for all other routes
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
// ============================================================================
// Rate Limiting
// ============================================================================
app.use('/api', rateLimit_1.apiRateLimiter);
// ============================================================================
// Gateway Initialization
// ============================================================================
// Register Stripe gateway
const stripeConfigured = Boolean(config_1.config.stripe.secretKey && config_1.config.stripe.webhookSecret);
if (stripeConfigured) {
    const stripeGateway = new StripeGateway_1.StripeGateway(config_1.config.stripe.secretKey, config_1.config.stripe.webhookSecret);
    PaymentGateway_1.PaymentGatewayFactory.register('stripe', stripeGateway);
    logger_1.logger.info('Payment gateways initialized', {
        primary: 'stripe',
        secondary: config_1.config.features.secondaryGateway,
    });
}
else {
    logger_1.logger.warn('Stripe gateway not initialized (missing Stripe env vars). Payment routes will be disabled.');
}
// ============================================================================
// Routes
// ============================================================================
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config_1.config.nodeEnv,
    });
});
// API routes
if (stripeConfigured) {
    app.use('/api/checkout', checkout_1.default);
}
else {
    app.use('/api/checkout', (_req, res) => {
        res.status(503).json({
            error: 'PaymentsDisabled',
            message: 'Stripe is not configured on this server instance.',
        });
    });
}
app.use('/api', entitlements_1.default);
app.use('/api/admin', admin_1.default);
// Webhook routes
if (stripeConfigured) {
    app.use('/webhooks', webhooks_1.default);
}
// ============================================================================
// Error Handling
// ============================================================================
// 404 handler
app.use(errorHandler_1.notFoundHandler);
// Global error handler
app.use(errorHandler_1.errorHandler);
// ============================================================================
// Server Startup
// ============================================================================
async function startServer() {
    try {
        // Test database connection
        const dbConnected = await database_1.db.testConnection();
        if (!dbConnected) {
            throw new Error('Database connection failed');
        }
        // Test Redis connection and initialize queue/worker
        const { testRedisConnection } = await Promise.resolve().then(() => __importStar(require('./config/redis')));
        const redisConnected = await testRedisConnection();
        if (!redisConnected) {
            logger_1.logger.warn('Redis connection failed - queue features will be unavailable');
            app.use('/api/jobs', (_req, res) => {
                res.status(503).json({
                    error: 'QueueUnavailable',
                    message: 'Redis is not available. Job queue routes are disabled.',
                });
            });
        }
        else {
            // Register job routes only after Redis is confirmed available to avoid eager queue initialization noise.
            const { default: jobsRoutes } = await Promise.resolve().then(() => __importStar(require('./routes/jobs')));
            app.use('/api/jobs', jobsRoutes);
            // Initialize job worker
            const { jobWorker } = await Promise.resolve().then(() => __importStar(require('./workers/JobWorker')));
            logger_1.logger.info('Job worker initialized and ready');
        }
        // Start server
        const server = app.listen(config_1.config.port, () => {
            logger_1.logger.info('Uswift Payment Backend started', {
                port: config_1.config.port,
                environment: config_1.config.nodeEnv,
                domain: config_1.config.appDomain,
            });
            logger_1.logger.info('🚀 Ready to accept payments', {
                primaryGateway: 'Stripe',
                features: config_1.config.features,
            });
        });
        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            logger_1.logger.info(`${signal} received, shutting down gracefully...`);
            server.close(async () => {
                logger_1.logger.info('HTTP server closed');
                try {
                    // Close queue and worker
                    if (redisConnected) {
                        const { jobWorker } = await Promise.resolve().then(() => __importStar(require('./workers/JobWorker')));
                        const { jobQueue } = await Promise.resolve().then(() => __importStar(require('./queues/JobQueue')));
                        const { closeRedisClient } = await Promise.resolve().then(() => __importStar(require('./config/redis')));
                        await jobWorker.close();
                        await jobQueue.close();
                        await closeRedisClient();
                        logger_1.logger.info('Queue and worker closed');
                    }
                    await database_1.db.close();
                    logger_1.logger.info('Database connections closed');
                    process.exit(0);
                }
                catch (error) {
                    logger_1.logger.error('Error during shutdown', { error });
                    process.exit(1);
                }
            });
            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger_1.logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
        logger_1.logger.error('Failed to start server', { error: error.message });
        process.exit(1);
    }
}
// Start the server
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map