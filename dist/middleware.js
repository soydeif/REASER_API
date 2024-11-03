"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyMiddleware = apiKeyMiddleware;
function apiKeyMiddleware(req, res, next) {
    const apiKey = req.header("x-api-key");
    if (apiKey && apiKey === process.env.API_KEY) {
        next();
    }
    else {
        res.status(403).json({ error: "Forbidden" });
    }
}
