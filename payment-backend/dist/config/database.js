"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const pg_1 = require("pg");
const logger_1 = require("../utils/logger");
class Database {
    static instance;
    pool;
    constructor() {
        const useSsl = process.env.DB_SSL === 'true';
        const databaseUrl = process.env.DATABASE_URL?.trim();
        const poolConfig = databaseUrl
            ? {
                connectionString: databaseUrl,
                ssl: useSsl ? { rejectUnauthorized: false } : false,
            }
            : {
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5432'),
                database: process.env.DB_NAME || 'uswift_payments',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'password',
                ssl: useSsl ? { rejectUnauthorized: false } : false,
            };
        this.pool = new pg_1.Pool({
            ...poolConfig,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });
        // Handle pool errors
        this.pool.on('error', (err) => {
            logger_1.logger.error('Unexpected database error', { error: err });
        });
        this.pool.on('connect', () => {
            logger_1.logger.info('Database connection established');
        });
    }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    async query(text, params) {
        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            logger_1.logger.debug('Executed query', { text, duration, rows: result.rowCount });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Database query error', { text, error });
            throw error;
        }
    }
    async getClient() {
        return await this.pool.connect();
    }
    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async testConnection() {
        try {
            await this.pool.query('SELECT NOW()');
            logger_1.logger.info('Database connection test successful');
            return true;
        }
        catch (error) {
            logger_1.logger.error('Database connection test failed', { error });
            const err = error;
            if (err?.code === 'ENOTFOUND' &&
                typeof err?.hostname === 'string' &&
                err.hostname.includes('.supabase.co')) {
                logger_1.logger.error('Supabase DB hostname could not be resolved by Node. This commonly happens with IPv6-only direct DB hosts on local Windows networks. Use the exact Session/Transaction Pooler connection string from Supabase Database settings in DATABASE_URL.', { hostnameTried: err.hostname });
            }
            return false;
        }
    }
    async close() {
        await this.pool.end();
        logger_1.logger.info('Database pool closed');
    }
}
exports.db = Database.getInstance();
//# sourceMappingURL=database.js.map