import { Pool } from 'pg';
import { Config } from './config/index.js';
import { SessionHistoryRepository } from './repositories/SessionHistoryRepository.js';
import { SessionHistoryService } from './services/SessionHistoryService.js';
import { SessionHistoryController } from './controllers/SessionHistoryController.js';
import { AdminSettingsRepository } from './repositories/AdminSettingsRepository.js';
import { AdminSettingsService } from './services/AdminSettingsService.js';
import { AdminSettingsController } from './controllers/AdminSettingsController.js';
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
export declare function createContainer(config: Config): Container;
//# sourceMappingURL=container.d.ts.map