export declare const config: {
    nodeEnv: string;
    port: number;
    appDomain: string;
    corsOrigins: string[];
    stripe: {
        secretKey: string;
        webhookSecret: string;
        publishableKey: string;
    };
    database: {
        url: string;
        host: string;
        port: number;
        name: string;
        user: string;
        password: string;
        ssl: boolean;
    };
    redis: {
        host: string;
        port: number;
        password: string | undefined;
        db: number;
    };
    queue: {
        workerConcurrency: number;
        rateLimitMax: number;
        rateLimitDuration: number;
    };
    auth: {
        jwtSecret: string;
        jwtExpiresIn: string;
        extensionTokenSecret: string;
    };
    payment: {
        primaryCurrency: string;
        supportedCurrencies: string[];
        successUrl: string;
        cancelUrl: string;
    };
    features: {
        secondaryGateway: boolean;
        freeTrial: boolean;
        promoCodes: boolean;
        stripeTax: boolean;
    };
    prices: {
        proMonthly: string;
        proAnnual: string;
        tokens1000: string;
    };
    observability: {
        logLevel: string;
        sentryDsn: string;
        metricsEnabled: boolean;
    };
    admin: {
        apiKey: string;
    };
};
export declare function validateConfig(): void;
//# sourceMappingURL=index.d.ts.map