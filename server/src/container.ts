// ==========================================
// DI Container — внедрение зависимостей
// (SOLID: DIP — все зависимости через контейнер)
// ==========================================

import { Pool } from 'pg';
import { AppConfig } from './config/index.js';
import { PostgresFileRepository, PostgresTextRepository } from './repositories/postgres.js';
import { IFileRepository, ITextRepository } from './repositories/interfaces.js';
import { IStorageProvider } from './storage/interfaces.js';
import { LocalStorageProvider } from './storage/LocalStorageProvider.js';
import { FileService } from './services/FileService.js';
import { TextService } from './services/TextService.js';
import { FileController } from './controllers/FileController.js';
import { TextController } from './controllers/TextController.js';

export interface Container {
  fileRepository: IFileRepository;
  textRepository: ITextRepository;
  storageProvider: IStorageProvider;
  fileService: FileService;
  textService: TextService;
  fileController: FileController;
  textController: TextController;
  dbPool: Pool;
}

export function createContainer(config: AppConfig): Container {
  // Database
  const dbPool = new Pool({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
  });

  // Repositories
  const fileRepository = new PostgresFileRepository(dbPool);
  const textRepository = new PostgresTextRepository(dbPool);

  // Storage Provider (Strategy Pattern)
  let storageProvider: IStorageProvider;
  switch (config.storage.provider) {
    case 'local':
      storageProvider = new LocalStorageProvider(config.storage.localPath);
      break;
    // case 's3':
    //   storageProvider = new S3StorageProvider(config.s3);
    //   break;
    default:
      storageProvider = new LocalStorageProvider(config.storage.localPath);
  }

  // Services
  const fileService = new FileService(fileRepository, storageProvider);
  const textService = new TextService(textRepository);

  // Controllers
  const fileController = new FileController(fileService);
  const textController = new TextController(textService);

  return {
    fileRepository,
    textRepository,
    storageProvider,
    fileService,
    textService,
    fileController,
    textController,
    dbPool,
  };
}
