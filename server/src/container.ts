// ==========================================
// DI контейнер для внедрения зависимостей
// ==========================================

import { Pool } from 'pg';
import { Config } from './config/index.js';
import { SessionHistoryRepository } from './repositories/SessionHistoryRepository.js';
import { SessionHistoryService } from './services/SessionHistoryService.js';
import { SessionHistoryController } from './controllers/SessionHistoryController.js';

export interface Container {
  dbPool: Pool;
  sessionHistoryRepository: SessionHistoryRepository;
  sessionHistoryService: SessionHistoryService;
  sessionHistoryController: SessionHistoryController;
}

export function createContainer(config: Config): Container {
  // Database connection pool
  const dbPool = new Pool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
  });

  // Repositories
  const sessionHistoryRepository = new SessionHistoryRepository(dbPool);

  // Services
  const sessionHistoryService = new SessionHistoryService(sessionHistoryRepository);

  // Controllers
  const sessionHistoryController = new SessionHistoryController(sessionHistoryService);

  return {
    dbPool,
    sessionHistoryRepository,
    sessionHistoryService,
    sessionHistoryController,
  };
}
