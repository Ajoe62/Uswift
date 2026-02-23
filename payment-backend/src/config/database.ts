import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { logger } from '../utils/logger';

class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    const useSsl = process.env.DB_SSL === 'true';
    const databaseUrl = process.env.DATABASE_URL?.trim();

    const poolConfig =
      databaseUrl
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

    this.pool = new Pool({
      ...poolConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      logger.error('Unexpected database error', { error: err });
    });

    this.pool.on('connect', () => {
      logger.info('Database connection established');
    });
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async query<T extends QueryResultRow = QueryResultRow>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      logger.error('Database query error', { text, error });
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.pool.query('SELECT NOW()');
      logger.info('Database connection test successful');
      return true;
    } catch (error) {
      logger.error('Database connection test failed', { error });

      const err = error as any;
      if (
        err?.code === 'ENOTFOUND' &&
        typeof err?.hostname === 'string' &&
        err.hostname.includes('.supabase.co')
      ) {
        logger.error(
          'Supabase DB hostname could not be resolved by Node. This commonly happens with IPv6-only direct DB hosts on local Windows networks. Use the exact Session/Transaction Pooler connection string from Supabase Database settings in DATABASE_URL.',
          { hostnameTried: err.hostname }
        );
      }
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database pool closed');
  }
}

export const db = Database.getInstance();
