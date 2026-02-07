import {
  users,
  type User,
  type InsertUser,
} from "@stockkar/shared/features/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

export interface IAuthStorage {
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  createUser(user: InsertUser & { passwordHash: string }): Promise<User>;
  hasAnyUser(): Promise<boolean>;
  updateUser(id: string, updates: { firstName?: string; lastName?: string; passwordHash?: string }): Promise<User>;
}

export class AuthStorage implements IAuthStorage {
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async createUser(user: InsertUser & { passwordHash: string }): Promise<User> {
    const [created] = await db.insert(users).values({
      ...user,
      updatedAt: new Date(),
    }).returning();
    return created;
  }

  async hasAnyUser(): Promise<boolean> {
    const result = await db.select().from(users).limit(1);
    return result.length > 0;
  }

  async updateUser(id: string, updates: { firstName?: string; lastName?: string; passwordHash?: string }): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }
}

export const authStorage = new AuthStorage();
