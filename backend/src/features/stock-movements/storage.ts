import {
  stockMovements,
  type StockMovement,
  type InsertStockMovement,
  type StockMovementWithRelations,
} from "@stockkar/shared/features/stock-movements";
import { products } from "@stockkar/shared/features/products";
import { db } from "../../db";
import { eq, desc } from "drizzle-orm";

export interface IStockMovementStorage {
  getStockMovements(): Promise<StockMovementWithRelations[]>;
  getProductStockMovements(productId: string): Promise<StockMovementWithRelations[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;
}

export class StockMovementStorage implements IStockMovementStorage {
  async getStockMovements(): Promise<StockMovementWithRelations[]> {
    const result = await db.query.stockMovements.findMany({
      with: {
        product: true,
        project: true,
      },
      orderBy: [desc(stockMovements.date)],
    });
    return result;
  }

  async getProductStockMovements(productId: string): Promise<StockMovementWithRelations[]> {
    const result = await db.query.stockMovements.findMany({
      where: eq(stockMovements.productId, productId),
      with: {
        product: true,
        project: true,
      },
      orderBy: [desc(stockMovements.date)],
    });
    return result;
  }

  async createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
    return await db.transaction(async (tx) => {
      const [created] = await tx.insert(stockMovements).values(movement).returning();
      
      const [product] = await tx.select().from(products).where(eq(products.id, movement.productId));
      if (product) {
        const quantityChange = movement.type === 'entry' ? movement.quantity : -movement.quantity;
        await tx.update(products)
          .set({ quantity: product.quantity + quantityChange })
          .where(eq(products.id, movement.productId));
      }
      
      return created;
    });
  }
}

export const stockMovementStorage = new StockMovementStorage();
