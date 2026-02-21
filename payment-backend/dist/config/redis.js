"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testRedisConnection = exports.closeRedisClient = exports.getRedisClient = exports.getRedisConfig = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
const getRedisConfig = () => {
    return {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0'),
        maxRetriesPerRequest: null, // Required for BullMQ
        enableReadyCheck: false, // Required for BullMQ
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            logger_1.logger.warn(`Redis retry attempt ${times}, waiting ${delay}ms`);
            return delay;
        },
    };
};
exports.getRedisConfig = getRedisConfig;
// Create Redis connection for general use
let redisClient = null;
const getRedisClient = () => {
    if (!redisClient) {
        redisClient = new ioredis_1.default((0, exports.getRedisConfig)());
        redisClient.on('connect', () => {
            logger_1.logger.info('Redis client connected');
        });
        redisClient.on('error', (err) => {
            logger_1.logger.error('Redis client error', { error: err });
        });
        redisClient.on('ready', () => {
            logger_1.logger.info('Redis client ready');
        });
        redisClient.on('close', () => {
            logger_1.logger.warn('Redis client connection closed');
        });
    }
    return redisClient;
};
exports.getRedisClient = getRedisClient;
const closeRedisClient = async () => {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        logger_1.logger.info('Redis client closed');
    }
};
exports.closeRedisClient = closeRedisClient;
// Test Redis connection
const testRedisConnection = async () => {
    try {
        const client = (0, exports.getRedisClient)();
        await client.ping();
        logger_1.logger.info('Redis connection test successful');
        return true;
    }
    catch (error) {
        logger_1.logger.error('Redis connection test failed', { error });
        return false;
    }
};
exports.testRedisConnection = testRedisConnection;
//# sourceMappingURL=redis.js.map