// ==========================================
// Конфигурация приложения
// ==========================================
import dotenv from 'dotenv';
dotenv.config();
export function loadConfig() {
    return {
        port: parseInt(process.env.PORT || '3001'),
        db: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            user: process.env.DB_USER || 'fileshare',
            password: process.env.DB_PASSWORD || 'fileshare_secret',
            database: process.env.DB_NAME || 'fileshare',
        },
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        },
        storage: {
            localPath: process.env.STORAGE_PATH || '/app/uploads',
        },
    };
}
//# sourceMappingURL=index.js.map