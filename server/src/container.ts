// ==========================================
// DI контейнер для внедрения зависимостей
// ==========================================

import { Pool } from 'pg';
import { Config } from './config/index.js';
import { SessionHistoryRepository } from './repositories/SessionHistoryRepository.js';
import { SessionHistoryService } from './services/SessionHistoryService.js';
import { SessionHistoryController } from './controllers/SessionHistoryController.js';
import { AdminSettingsRepository } from './repositories/AdminSettingsRepository.js';
import { AdminSettingsService } from './services/AdminSettingsService.js';
import { AdminSettingsController } from './controllers/AdminSettingsController.js';

export interface Container {
  dbPool: Pool;
  sessionHistoryRepository: SessionHistoryRepository;
  sessionHistoryService: SessionHistoryService;
  sessionHistoryController: SessionHistoryController;
  adminSettingsRepository: AdminSettingsRepository;
  adminSettingsService: AdminSettingsService;
  adminSettingsController: AdminSettingsController;
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
  const adminSettingsRepository = new AdminSettingsRepository(dbPool);

  // Services
  const sessionHistoryService = new SessionHistoryService(sessionHistoryRepository);
  const adminSettingsService = new AdminSettingsService(adminSettingsRepository);

  // Controllers
  const sessionHistoryController = new SessionHistoryController(sessionHistoryService);
  const adminSettingsController = new AdminSettingsController(adminSettingsService);

  return {
    dbPool,
    sessionHistoryRepository,
    sessionHistoryService,
    sessionHistoryController,
    adminSettingsRepository,
    adminSettingsService,
    adminSettingsController,
  };
}
