"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.validateConfig = validateConfig;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Load environment variables from common local-dev locations (first one found wins per key)
const envCandidates = [
    path_1.default.resolve(__dirname, '../../.env'),
    path_1.default.resolve(__dirname, '../../.env.local'),
    path_1.default.resolve(__dirname, '../../../.env'),
    path_1.default.resolve(__dirname, '../../../.env.local'),
];
for (const envPath of envCandidates) {
    if (fs_1.default.existsSync(envPath)) {
        dotenv_1.default.config({ path: envPath, override: false });
    }
}
const isDev = (process.env.NODE_ENV || 'development') !== 'production';
// Provide safe local defaults so dev server can start without auth secrets configured.
if (isDev) {
    if (!process.env.JWT_SECRET) {
        process.env.JWT_SECRET = 'dev-jwt-secret-change-me';
    }
    if (!process.env.EXTENSION_TOKEN_SECRET) {
        process.env.EXTENSION_TOKEN_SECRET = 'dev-extension-token-secret-change-me';
    }
}
exports.config = {
    // Server
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000'),
    appDomain: process.env.APP_DOMAIN || 'https://pay.uswift.app',
    corsOrigins: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
    // Stripe
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    },
    // Database
    database: {
        url: process.env.DATABASE_URL || '',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        name: process.env.DB_NAME || 'uswift_payments',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        ssl: process.env.DB_SSL === 'true',
    },
    // Redis
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0'),
    },
    // Queue settings
    queue: {
        workerConcurrency: parseInt(process.env.QUEUE_WORKER_CONCURRENCY || '5'),
        rateLimitMax: parseInt(process.env.QUEUE_RATE_LIMIT_MAX || '10'),
        rateLimitDuration: parseInt(process.env.QUEUE_RATE_LIMIT_DURATION || '60000'),
    },
    // Authentication
    auth: {
        jwtSecret: process.env.JWT_SECRET || '',
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
        extensionTokenSecret: process.env.EXTENSION_TOKEN_SECRET || '',
    },
    // Payment settings
    payment: {
        primaryCurrency: process.env.PRIMARY_CURRENCY || 'USD',
        supportedCurrencies: (process.env.SUPPORTED_CURRENCIES || 'USD,EUR,GBP').split(','),
        successUrl: process.env.SUCCESS_URL || 'https://pay.uswift.app/success',
        cancelUrl: process.env.CANCEL_URL || 'https://pay.uswift.app/cancel',
    },
    // Feature flags
    features: {
        secondaryGateway: process.env.FEATURE_SECONDARY_GATEWAY === 'true',
        freeTrial: process.env.FEATURE_FREE_TRIAL === 'true',
        promoCodes: process.env.FEATURE_PROMO_CODES === 'true',
        stripeTax: process.env.FEATURE_STRIPE_TAX === 'true',
    },
    // Products & Prices
    prices: {
        proMonthly: process.env.PRICE_PRO_MONTHLY || '',
        proAnnual: process.env.PRICE_PRO_ANNUAL || '',
        tokens1000: process.env.PRICE_TOKENS_1000 || '',
    },
    // Observability
    observability: {
        logLevel: process.env.LOG_LEVEL || 'info',
        sentryDsn: process.env.SENTRY_DSN || '',
        metricsEnabled: process.env.METRICS_ENABLED === 'true',
    },
    // Admin
    admin: {
        apiKey: process.env.ADMIN_API_KEY || '',
    },
};
// Validate required configuration
function validateConfig() {
    const required = ['JWT_SECRET', 'EXTENSION_TOKEN_SECRET'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    const stripeMissing = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'].filter((key) => !process.env[key]);
    if (stripeMissing.length > 0) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error(`Missing required Stripe environment variables in production: ${stripeMissing.join(', ')}`);
        }
        console.warn(`Stripe is not fully configured for local development. Payment routes/webhooks will be disabled: ${stripeMissing.join(', ')}`);
    }
    // Warn about missing optional but recommended variables
    const recommended = ['PRICE_PRO_MONTHLY', 'PRICE_PRO_ANNUAL', 'ADMIN_API_KEY'];
    const missingRecommended = recommended.filter((key) => !process.env[key]);
    if (missingRecommended.length > 0) {
        console.warn(`⚠️  Missing recommended environment variables: ${missingRecommended.join(', ')}`);
    }
}
//# sourceMappingURL=index.js.map