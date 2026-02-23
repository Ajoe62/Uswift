import Redis from 'ioredis';
/**
 * Redis Configuration for BullMQ
 * Used for job queue management
 */
export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
    maxRetriesPerRequest: number | null;
    enableReadyCheck: boolean;
    retryStrategy?: (times: number) => number | void;
}
export declare const getRedisConfig: () => RedisConfig;
export declare const getRedisClient: () => Redis;
export declare const closeRedisClient: () => Promise<void>;
export declare const testRedisConnection: () => Promise<boolean>;
//# sourceMappingURL=redis.d.ts.map