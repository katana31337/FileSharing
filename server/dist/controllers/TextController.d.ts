import { Request, Response } from 'express';
import { TextService } from '../services/TextService.js';
export declare class TextController {
    private textService;
    constructor(textService: TextService);
    /**
     * POST /api/texts — создание сниппета
     */
    create: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/texts/:shortUrl — получение сниппета
     */
    get: (req: Request, res: Response) => Promise<void>;
    /**
     * DELETE /api/texts/:shortUrl — удаление сниппета
     */
    delete: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=TextController.d.ts.map