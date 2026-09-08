// ==========================================
// Application Configuration
// ==========================================

import dotenv from 'dotenv';
dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  storage: {
    provider: 'local' | 's3';
    localPath: string;
  };
  cors: {
    origin: string;
  };
  maxFileSize: number; // bytes
  maxExpirationDays: number;
}

export function loadConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT || '3001'),
    nodeEnv: process.env.NODE_ENV || 'development',
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'fileshare',
      password: process.env.DB_PASSWORD || 'fileshare_secret',
      database: process.env.DB_NAME || 'fileshare',
    },
    storage: {
      provider: (process.env.STORAGE_PROVIDER as 'local' | 's3') || 'local',
      localPath: process.env.STORAGE_PATH || './uploads',
    },
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    },
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || String(100 * 1024 * 1024)),
    maxExpirationDays: parseInt(process.env.MAX_EXPIRATION_DAYS || '30'),
  };
}
