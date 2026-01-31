import {
  warehouses,
  products,
  projects,
  productPhotos,
  stockMovements,
  type Warehouse,
  type InsertWarehouse,
  type Product,
  type InsertProduct,
  type Project,
  type InsertProject,
  type ProductPhoto,
  type InsertProductPhoto,
  type StockMovement,
  type InsertStockMovement,
  type ProductWithRelations,
  type StockMovementWithRelations,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Warehouses
  getWarehouses(): Promise<Warehouse[]>;
  getWarehouse(id: string): Promise<Warehouse | undefined>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  updateWarehouse(id: string, warehouse: Partial<InsertWarehouse>): Promise<Warehouse | undefined>;
  deleteWarehouse(id: string): Promise<boolean>;

  // Products
  getProducts(): Promise<ProductWithRelations[]>;
  getProduct(id: string): Promise<ProductWithRelations | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Product Photos
  getProductPhotos(productId: string): Promise<ProductPhoto[]>;
  getPhoto(id: string): Promise<ProductPhoto | undefined>;
  createProductPhoto(photo: InsertProductPhoto): Promise<ProductPhoto>;
  updateProductPhoto(id: string, photo: Partial<InsertProductPhoto>): Promise<ProductPhoto | undefined>;
  deleteProductPhoto(id: string): Promise<boolean>;
  setMainPhoto(productId: string, photoId: string): Promise<void>;

  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;

  // Stock Movements
  getStockMovements(): Promise<StockMovementWithRelations[]>;
  getProductStockMovements(productId: string): Promise<StockMovementWithRelations[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;
}

export class DatabaseStorage implements IStorage {
  // Warehouses
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

  // Products
  async getProducts(): Promise<ProductWithRelations[]> {
    const result = await db.query.products.findMany({
      with: {
        warehouse: true,
        photos: true,
      },
      orderBy: [desc(products.entryDate)],
    });
    return result;
  }

  async getProduct(id: string): Promise<ProductWithRelations | undefined> {
    const result = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        warehouse: true,
        photos: true,
      },
    });
    return result || undefined;
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.barcode, barcode));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products).set(product).where(eq(products.id, id)).returning();
    return updated || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Product Photos
  async getProductPhotos(productId: string): Promise<ProductPhoto[]> {
    return db.select().from(productPhotos).where(eq(productPhotos.productId, productId));
  }

  async getPhoto(id: string): Promise<ProductPhoto | undefined> {
    const [photo] = await db.select().from(productPhotos).where(eq(productPhotos.id, id));
    return photo || undefined;
  }

  async createProductPhoto(photo: InsertProductPhoto): Promise<ProductPhoto> {
    const [created] = await db.insert(productPhotos).values(photo).returning();
    return created;
  }

  async updateProductPhoto(id: string, photo: Partial<InsertProductPhoto>): Promise<ProductPhoto | undefined> {
    const [updated] = await db.update(productPhotos).set(photo).where(eq(productPhotos.id, id)).returning();
    return updated || undefined;
  }

  async deleteProductPhoto(id: string): Promise<boolean> {
    const result = await db.delete(productPhotos).where(eq(productPhotos.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async setMainPhoto(productId: string, photoId: string): Promise<void> {
    await db.update(productPhotos)
      .set({ isMain: false })
      .where(eq(productPhotos.productId, productId));
    
    await db.update(productPhotos)
      .set({ isMain: true })
      .where(eq(productPhotos.id, photoId));
    
    await db.update(products)
      .set({ mainPhotoId: photoId })
      .where(eq(products.id, productId));
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return db.select().from(projects).orderBy(projects.name);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [created] = await db.insert(projects).values(project).returning();
    return created;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db.update(projects).set(project).where(eq(projects.id, id)).returning();
    return updated || undefined;
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Stock Movements
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

export const storage = new DatabaseStorage();
