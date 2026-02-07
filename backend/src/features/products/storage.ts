import {
  products,
  productPhotos,
  type Product,
  type InsertProduct,
  type ProductPhoto,
  type InsertProductPhoto,
  type ProductWithRelations,
} from "@stockkar/shared/features/products";
import { db } from "../../db";
import { eq, desc } from "drizzle-orm";

export interface IProductStorage {
  getProducts(): Promise<ProductWithRelations[]>;
  getProduct(id: string): Promise<ProductWithRelations | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  getProductPhotos(productId: string): Promise<ProductPhoto[]>;
  getPhoto(id: string): Promise<ProductPhoto | undefined>;
  createProductPhoto(photo: InsertProductPhoto): Promise<ProductPhoto>;
  updateProductPhoto(id: string, photo: Partial<InsertProductPhoto>): Promise<ProductPhoto | undefined>;
  deleteProductPhoto(id: string): Promise<boolean>;
  setMainPhoto(productId: string, photoId: string): Promise<void>;
}

export class ProductStorage implements IProductStorage {
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
}

export const productStorage = new ProductStorage();
