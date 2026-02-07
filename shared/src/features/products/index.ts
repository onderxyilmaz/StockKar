import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { warehouses } from "../warehouses";

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stockCode: text("stock_code").notNull().unique(),
  productType: text("product_type").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull().default(0),
  barcode: text("barcode"),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id),
  entryPrice: decimal("entry_price", { precision: 10, scale: 2 }).notNull().default("0"),
  exitPrice: decimal("exit_price", { precision: 10, scale: 2 }).notNull().default("0"),
  entryDate: timestamp("entry_date").defaultNow(),
  mainPhotoId: varchar("main_photo_id"),
}, (table) => [
  index("products_barcode_idx").on(table.barcode),
  index("products_stock_code_idx").on(table.stockCode),
  index("products_warehouse_idx").on(table.warehouseId),
]);

export const productsRelations = relations(products, ({ one, many }) => ({
  warehouse: one(warehouses, {
    fields: [products.warehouseId],
    references: [warehouses.id],
  }),
  photos: many(productPhotos),
  stockMovements: many(() => import("../stock-movements").then((m) => m.stockMovements)),
}));

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Product Photos
export const productPhotos = pgTable("product_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  isMain: boolean("is_main").notNull().default(false),
});

export const productPhotosRelations = relations(productPhotos, ({ one }) => ({
  product: one(products, {
    fields: [productPhotos.productId],
    references: [products.id],
  }),
}));

export const insertProductPhotoSchema = createInsertSchema(productPhotos).omit({ id: true });
export type InsertProductPhoto = z.infer<typeof insertProductPhotoSchema>;
export type ProductPhoto = typeof productPhotos.$inferSelect;

// Extended types with relations
export type ProductWithRelations = Product & {
  warehouse?: typeof warehouses.$inferSelect | null;
  photos?: ProductPhoto[];
};
