// ==========================================
// Request Logger Middleware
// ==========================================
export function requestLogger(req, _res, next) {
    const start = Date.now();
    _res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${_res.statusCode} ${duration}ms`);
    });
    next();
}
//# sourceMappingURL=logger.js.map