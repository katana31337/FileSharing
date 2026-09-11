// ==========================================
// Error Handling Middleware
// ==========================================
export class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
export function errorHandler(err, _req, res, _next) {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: err.message,
        });
        return;
    }
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Внутренняя ошибка сервера',
    });
}
export function notFoundHandler(_req, res) {
    res.status(404).json({
        error: 'Маршрут не найден',
    });
}
//# sourceMappingURL=errorHandler.js.map