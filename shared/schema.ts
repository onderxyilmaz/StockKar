import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Depolar (Warehouses)
export const warehouses = pgTable("warehouses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  description: text("description"),
});

export const warehousesRelations = relations(warehouses, ({ many }) => ({
  products: many(products),
}));

export const insertWarehouseSchema = createInsertSchema(warehouses).omit({ id: true });
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type Warehouse = typeof warehouses.$inferSelect;

// Projeler/Firmalar (Projects/Companies for sales)
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull().default("project"), // "project" or "company"
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  stockMovements: many(stockMovements),
}));

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Ürünler (Products)
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
  stockMovements: many(stockMovements),
}));

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Ürün Fotoğrafları (Product Photos)
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

// Stok Hareketleri (Stock Movements)
export const stockMovements = pgTable("stock_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "entry" (giriş) or "exit" (çıkış)
  quantity: integer("quantity").notNull(),
  projectId: varchar("project_id").references(() => projects.id),
  notes: text("notes"),
  date: timestamp("date").defaultNow(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
}, (table) => [
  index("stock_movements_product_idx").on(table.productId),
  index("stock_movements_project_idx").on(table.projectId),
  index("stock_movements_date_idx").on(table.date),
]);

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  product: one(products, {
    fields: [stockMovements.productId],
    references: [products.id],
  }),
  project: one(projects, {
    fields: [stockMovements.projectId],
    references: [projects.id],
  }),
}));

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({ id: true });
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;

// Extended types with relations
export type ProductWithRelations = Product & {
  warehouse?: Warehouse | null;
  photos?: ProductPhoto[];
};

export type StockMovementWithRelations = StockMovement & {
  product?: Product | null;
  project?: Project | null;
};
