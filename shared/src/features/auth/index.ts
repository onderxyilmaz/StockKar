import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"), // "super_admin" or "user"
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, passwordHash: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(1, "Şifre zorunludur"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Create first user schema
export const createFirstUserSchema = z.object({
  firstName: z.string().min(1, "Ad zorunludur"),
  lastName: z.string().min(1, "Soyad zorunludur"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string()
    .min(7, "Şifre en az 7 karakter olmalıdır")
    .regex(/[A-Z]/, "Şifre en az 1 büyük harf içermelidir")
    .regex(/[a-z]/, "Şifre en az 1 küçük harf içermelidir")
    .regex(/[0-9]/, "Şifre en az 1 rakam içermelidir")
    .regex(/[^A-Za-z0-9]/, "Şifre en az 1 özel karakter içermelidir"),
  confirmPassword: z.string().min(1, "Şifre tekrar zorunludur"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

export type CreateFirstUserInput = z.infer<typeof createFirstUserSchema>;

// Update profile schema
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "Ad zorunludur"),
  lastName: z.string().min(1, "Soyad zorunludur"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifre zorunludur"),
  newPassword: z.string()
    .min(7, "Şifre en az 7 karakter olmalıdır")
    .regex(/[A-Z]/, "Şifre en az 1 büyük harf içermelidir")
    .regex(/[a-z]/, "Şifre en az 1 küçük harf içermelidir")
    .regex(/[0-9]/, "Şifre en az 1 rakam içermelidir")
    .regex(/[^A-Za-z0-9]/, "Şifre en az 1 özel karakter içermelidir"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
