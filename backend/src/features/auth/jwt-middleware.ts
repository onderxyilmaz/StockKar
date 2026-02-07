import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "./jwt";
import { tokenBlacklist } from "./token-blacklist";

/**
 * JWT token doğrulama middleware'i
 * Authorization header'dan Bearer token'ı alır ve doğrular
 */
export function requireJwtAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Authorization header'dan token'ı al
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7); // "Bearer " kısmını çıkar

    // Token blacklist'te mi kontrol et
    if (tokenBlacklist.isBlacklisted(token)) {
      return res.status(401).json({ error: "Token has been revoked" });
    }

    // Token'ı doğrula
    const payload = verifyAccessToken(token);

    // Request'e user bilgilerini ekle
    (req as any).user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error: any) {
    if (error.message === "Token expired") {
      return res.status(401).json({ error: "Token expired" });
    }
    if (error.message === "Invalid token") {
      return res.status(401).json({ error: "Invalid token" });
    }
    return res.status(401).json({ error: "Authentication failed" });
  }
}

/**
 * requireAuth - JWT authentication kullanır
 * Alias for requireJwtAuth for consistency
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  return requireJwtAuth(req, res, next);
}
