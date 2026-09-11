export interface Config {
    port: number;
    db: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
    };
    cors: {
        origin: string;
    };
    storage: {
        localPath: string;
    };
}
export declare function loadConfig(): Config;
//# sourceMappingURL=index.d.ts.map