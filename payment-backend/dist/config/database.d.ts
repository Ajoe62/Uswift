import { PoolClient, QueryResult, QueryResultRow } from 'pg';
declare class Database {
    private static instance;
    private pool;
    private constructor();
    static getInstance(): Database;
    query<T extends QueryResultRow = QueryResultRow>(text: string, params?: any[]): Promise<QueryResult<T>>;
    getClient(): Promise<PoolClient>;
    transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
    testConnection(): Promise<boolean>;
    close(): Promise<void>;
}
export declare const db: Database;
export {};
//# sourceMappingURL=database.d.ts.map