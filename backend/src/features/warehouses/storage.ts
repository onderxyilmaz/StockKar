import {
  warehouses,
  type Warehouse,
  type InsertWarehouse,
} from "@stockkar/shared/features/warehouses";
import { db } from "../../db";
import { eq } from "drizzle-orm";

export interface IWarehouseStorage {
  getWarehouses(): Promise<Warehouse[]>;
  getWarehouse(id: string): Promise<Warehouse | undefined>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  updateWarehouse(id: string, warehouse: Partial<InsertWarehouse>): Promise<Warehouse | undefined>;
  deleteWarehouse(id: string): Promise<boolean>;
}

export class WarehouseStorage implements IWarehouseStorage {
  async getWarehouses(): Promise<Warehouse[]> {
    return db.select().from(warehouses).orderBy(warehouses.name);
  }

  async getWarehouse(id: string): Promise<Warehouse | undefined> {
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return warehouse || undefined;
  }

  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    const [created] = await db.insert(warehouses).values(warehouse).returning();
    return created;
  }

  async updateWarehouse(id: string, warehouse: Partial<InsertWarehouse>): Promise<Warehouse | undefined> {
    const [updated] = await db.update(warehouses).set(warehouse).where(eq(warehouses.id, id)).returning();
    return updated || undefined;
  }

  async deleteWarehouse(id: string): Promise<boolean> {
    const result = await db.delete(warehouses).where(eq(warehouses.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const warehouseStorage = new WarehouseStorage();
