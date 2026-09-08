// ==========================================
// Express Application Entry Point
// ==========================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import { loadConfig } from './config/index.js';
import { createContainer } from './container.js';
import { createRoutes } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';

async function main() {
  const config = loadConfig();
  const container = createContainer(config);

  const app = express();

  // Trust proxy (Nginx terminates SSL and forwards X-Forwarded-Proto)
  app.set('trust proxy', 1);

  // Middleware
  app.use(helmet());
  app.use(cors({ origin: config.cors.origin, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(requestLogger);

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Слишком много запросов, попробуйте позже' },
  });
  app.use('/api/', limiter);

  // Routes
  const routes = createRoutes(container.fileController, container.textController);
  app.use('/api', routes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Cleanup cron job — every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[Cleanup] Running expired items cleanup...');
    try {
      const filesCleaned = await container.fileService.cleanupExpired();
      const textsCleaned = await container.textService.cleanupExpired();
      console.log(`[Cleanup] Cleaned ${filesCleaned} files, ${textsCleaned} texts`);
    } catch (error) {
      console.error('[Cleanup] Error:', error);
    }
  });

  // Start server
  app.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════╗
║         FileShare Server v1.0.0          ║
║──────────────────────────────────────────║
║  Port:     ${String(config.port).padEnd(29)}║
║  Env:      ${config.nodeEnv.padEnd(29)}║
║  Storage:  ${config.storage.provider.padEnd(29)}║
║  DB:       ${config.database.host.padEnd(29)}║
╚══════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await container.dbPool.end();
    process.exit(0);
  });
}

main().catch(console.error);
