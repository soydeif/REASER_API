import { Request, Response, NextFunction } from "express";

// Middleware para verificar la clave API
export function apiKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.header("x-api-key");
  if (apiKey && apiKey === process.env.API_KEY) {
    next(); // La clave API es válida, continuar
  } else {
    res.status(403).json({ error: "Forbidden" });
  }
}
