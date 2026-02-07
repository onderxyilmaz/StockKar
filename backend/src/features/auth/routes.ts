import type { Express, Request, Response } from "express";
import { loginSchema, createFirstUserSchema, updateProfileSchema, changePasswordSchema } from "@stockkar/shared/features/auth";
import { authStorage } from "./storage";
import bcrypt from "bcryptjs";
import { requireAuth } from "./jwt-middleware";
import { generateTokenPair, verifyRefreshToken } from "./jwt";
import { tokenBlacklist } from "./token-blacklist";

export function registerAuthRoutes(app: Express) {
  // Check if any user exists
  app.get("/api/auth/check-setup", async (_req: Request, res: Response) => {
    try {
      const hasUsers = await authStorage.hasAnyUser();
      res.json({ hasUsers });
    } catch (error) {
      res.status(500).json({ error: "Failed to check setup status" });
    }
  });

  // Get current user (supports both JWT and Session)
  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      if (!user || !user.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const dbUser = await authStorage.getUserById(user.userId);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Don't send password hash
      const { passwordHash, ...userWithoutPassword } = dbUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Create first user (setup)
  app.post("/api/auth/setup", async (req: Request, res: Response) => {
    try {
      const hasUsers = await authStorage.hasAnyUser();
      if (hasUsers) {
        return res.status(400).json({ error: "Setup already completed" });
      }

      const parsed = createFirstUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const existingUser = await authStorage.getUserByEmail(parsed.data.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const passwordHash = await bcrypt.hash(parsed.data.password, 10);

      const user = await authStorage.createUser({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        passwordHash,
        role: "super_admin",
        isActive: true,
      });

      // Generate JWT tokens
      const tokens = generateTokenPair(user);

      const { passwordHash: _, ...userWithoutPassword } = user;
      
      // Set httpOnly cookie for web clients
      res.cookie("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        user: userWithoutPassword,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const user = await authStorage.getUserByEmail(parsed.data.email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: "Account is disabled" });
      }

      const isValidPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Generate JWT tokens
      const tokens = generateTokenPair(user);

      const { passwordHash, ...userWithoutPassword } = user;

      // Set httpOnly cookie for web clients
      res.cookie("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        user: userWithoutPassword,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Refresh token endpoint
  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    try {
      // Refresh token'ı cookie'den veya body'den al
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token required" });
      }

      // Token blacklist'te mi kontrol et
      if (tokenBlacklist.isBlacklisted(refreshToken)) {
        return res.status(401).json({ error: "Refresh token has been revoked" });
      }

      // Refresh token'ı doğrula
      const payload = verifyRefreshToken(refreshToken);

      // Kullanıcıyı bul
      const user = await authStorage.getUserById(payload.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ error: "User not found or inactive" });
      }

      // Yeni token çifti oluştur
      const tokens = generateTokenPair(user);

      // Eski refresh token'ı blacklist'e ekle (7 gün expire süresi)
      tokenBlacklist.addToken(refreshToken, 7 * 24 * 60 * 60 * 1000);

      // Yeni cookie'leri set et
      res.cookie("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      });
    } catch (error: any) {
      if (error.message === "Refresh token expired") {
        return res.status(401).json({ error: "Refresh token expired" });
      }
      return res.status(401).json({ error: "Invalid refresh token" });
    }
  });

  // Logout
  app.post("/api/auth/logout", requireAuth, async (req: Request, res: Response) => {
    try {
      // JWT token'ı blacklist'e ekle
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        // Access token expire süresi kadar blacklist'te tut (15 dakika)
        tokenBlacklist.addToken(token, 15 * 60 * 1000);
      }

      // Refresh token'ı da blacklist'e ekle
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      if (refreshToken) {
        // Refresh token expire süresi kadar blacklist'te tut (7 gün)
        tokenBlacklist.addToken(refreshToken, 7 * 24 * 60 * 60 * 1000);
      }

      // Cookie'leri temizle
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to logout" });
    }
  });

  // Update profile (requires auth)
  app.put("/api/auth/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user || !user.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const dbUser = await authStorage.updateUser(user.userId, {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
      });

      const { passwordHash, ...userWithoutPassword } = dbUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Change password (requires auth)
  app.post("/api/auth/change-password", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user || !user.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const dbUser = await authStorage.getUserById(user.userId);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const isValidPassword = await bcrypt.compare(parsed.data.currentPassword, dbUser.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Mevcut şifre hatalı" });
      }

      const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
      await authStorage.updateUser(user.userId, { passwordHash });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to change password" });
    }
  });
}
