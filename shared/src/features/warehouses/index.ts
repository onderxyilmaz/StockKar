import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const warehouses = pgTable("warehouses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  description: text("description"),
});

export const warehousesRelations = relations(warehouses, ({ many }) => ({
  products: many(() => import("../products").then((m) => m.products)),
}));

export const insertWarehouseSchema = createInsertSchema(warehouses).omit({ id: true });
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type Warehouse = typeof warehouses.$inferSelect;
