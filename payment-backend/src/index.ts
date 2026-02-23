import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { URL } from 'url';
import { config, validateConfig } from './config';
import { db } from './config/database';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimit';

// Import gateways
import { StripeGateway } from './gateways/StripeGateway';
import { PaymentGatewayFactory } from './gateways/PaymentGateway';

// Import routes
import checkoutRoutes from './routes/checkout';
import entitlementsRoutes from './routes/entitlements';
import webhookRoutes from './routes/webhooks';
import adminRoutes from './routes/admin';

/**
 * Uswift Payment Backend
 * MV3-compliant, PCI SAQ A friendly payment system
 */

// Validate environment variables
try {
  validateConfig();
} catch (error: any) {
  logger.error('Configuration validation failed', { error: error.message });
  process.exit(1);
}

const app: Express = express();

// ============================================================================
// Security & Middleware
// ============================================================================

// Helmet for security headers
app.use(
  helmet({
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
  })
);

// CORS
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    let normalizedOrigin: string;
    if (origin.startsWith('chrome-extension://')) {
      normalizedOrigin = origin.replace(/\/$/, '');
    } else {
      try {
        normalizedOrigin = new URL(origin).origin;
      } catch {
        return callback(new Error('Invalid Origin header'));
      }
    }

    const allowedOrigins = new Set(
      config.corsOrigins.map((value) => value.trim()).filter(Boolean)
    );

    if (allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-API-Key', 'X-Correlation-ID'],
};

app.use(cors(corsOptions));

// ============================================================================
// Body Parsing
// ============================================================================

// RAW body for webhooks (Stripe signature verification requires raw body)
app.use(
  '/webhooks',
  express.raw({ type: 'application/json', limit: '1mb' })
);

// JSON body for all other routes
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ============================================================================
// Rate Limiting
// ============================================================================

app.use('/api', apiRateLimiter);

// ============================================================================
// Gateway Initialization
// ============================================================================

// Register Stripe gateway
const stripeConfigured = Boolean(
  config.stripe.secretKey && config.stripe.webhookSecret
);

if (stripeConfigured) {
  const stripeGateway = new StripeGateway(
    config.stripe.secretKey,
    config.stripe.webhookSecret
  );
  PaymentGatewayFactory.register('stripe', stripeGateway);

  logger.info('Payment gateways initialized', {
    primary: 'stripe',
    secondary: config.features.secondaryGateway,
  });
} else {
  logger.warn('Stripe gateway not initialized (missing Stripe env vars). Payment routes will be disabled.');
}

// ============================================================================
// Routes
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API routes
if (stripeConfigured) {
  app.use('/api/checkout', checkoutRoutes);
} else {
  app.use('/api/checkout', (_req, res) => {
    res.status(503).json({
      error: 'PaymentsDisabled',
      message: 'Stripe is not configured on this server instance.',
    });
  });
}
app.use('/api', entitlementsRoutes);
app.use('/api/admin', adminRoutes);
// Webhook routes
if (stripeConfigured) {
  app.use('/webhooks', webhookRoutes);
}

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================================================
// Server Startup
// ============================================================================

async function startServer() {
  try {
    // Test database connection
    const dbConnected = await db.testConnection();

    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Test Redis connection and initialize queue/worker
    const { testRedisConnection } = await import('./config/redis');
    const redisConnected = await testRedisConnection();

    if (!redisConnected) {
      logger.warn('Redis connection failed - queue features will be unavailable');
      app.use('/api/jobs', (_req, res) => {
        res.status(503).json({
          error: 'QueueUnavailable',
          message: 'Redis is not available. Job queue routes are disabled.',
        });
      });
    } else {
      // Register job routes only after Redis is confirmed available to avoid eager queue initialization noise.
      const { default: jobsRoutes } = await import('./routes/jobs');
      app.use('/api/jobs', jobsRoutes);

      // Initialize job worker
      const { jobWorker } = await import('./workers/JobWorker');
      logger.info('Job worker initialized and ready');
    }

    // Start server
    const server = app.listen(config.port, () => {
      logger.info('Uswift Payment Backend started', {
        port: config.port,
        environment: config.nodeEnv,
        domain: config.appDomain,
      });

      logger.info('🚀 Ready to accept payments', {
        primaryGateway: 'Stripe',
        features: config.features,
      });
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close queue and worker
          if (redisConnected) {
            const { jobWorker } = await import('./workers/JobWorker');
            const { jobQueue } = await import('./queues/JobQueue');
            const { closeRedisClient } = await import('./config/redis');

            await jobWorker.close();
            await jobQueue.close();
            await closeRedisClient();
            logger.info('Queue and worker closed');
          }

          await db.close();
          logger.info('Database connections closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error });
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error: any) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
