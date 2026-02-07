import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { products } from "../products";
import { projects } from "../projects";

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
export type StockMovementWithRelations = StockMovement & {
  product?: typeof products.$inferSelect | null;
  project?: typeof projects.$inferSelect | null;
};
