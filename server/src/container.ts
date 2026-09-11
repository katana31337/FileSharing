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
import { PostgresFileRepository, PostgresTextRepository } from './repositories/postgres.js';
import { LocalStorageProvider } from './storage/LocalStorageProvider.js';
import { FileService } from './services/FileService.js';
import { TextService } from './services/TextService.js';
import { FileController } from './controllers/FileController.js';
import { TextController } from './controllers/TextController.js';

export interface Container {
  dbPool: Pool;
  sessionHistoryRepository: SessionHistoryRepository;
  sessionHistoryService: SessionHistoryService;
  sessionHistoryController: SessionHistoryController;
  adminSettingsRepository: AdminSettingsRepository;
  adminSettingsService: AdminSettingsService;
  adminSettingsController: AdminSettingsController;
  fileController: FileController;
  textController: TextController;
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
  const fileRepository = new PostgresFileRepository(dbPool);
  const textRepository = new PostgresTextRepository(dbPool);

  // Storage provider
  const storageProvider = new LocalStorageProvider(config.storage.localPath);

  // Services
  const sessionHistoryService = new SessionHistoryService(sessionHistoryRepository);
  const adminSettingsService = new AdminSettingsService(adminSettingsRepository);
  const fileService = new FileService(fileRepository, storageProvider);
  const textService = new TextService(textRepository);

  // Controllers
  const sessionHistoryController = new SessionHistoryController(sessionHistoryService);
  const adminSettingsController = new AdminSettingsController(adminSettingsService);
  const fileController = new FileController(fileService);
  const textController = new TextController(textService);

  return {
    dbPool,
    sessionHistoryRepository,
    sessionHistoryService,
    sessionHistoryController,
    adminSettingsRepository,
    adminSettingsService,
    adminSettingsController,
    fileController,
    textController,
  };
}
