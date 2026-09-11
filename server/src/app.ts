// ==========================================
// Главный файл Express приложения
// ==========================================

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { loadConfig } from './config/index.js';
import { createContainer } from './container.js';
import { createRoutes } from './routes/index.js';

async function main() {
  const config = loadConfig();
  const container = createContainer(config);

  const app = express();

  // Middleware
  app.use(cors({
    origin: config.cors.origin,
    credentials: true,
  }));
  app.use(express.json());
  app.use(cookieParser());

  // Routes
  const routes = createRoutes(container.sessionHistoryController);
  app.use('/api', routes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Start server
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await container.dbPool.end();
    process.exit(0);
  });
}

main().catch(console.error);
