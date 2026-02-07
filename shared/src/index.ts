// Re-export all features
export * from "./features/warehouses";
export * from "./features/products";
export * from "./features/projects";
export * from "./features/stock-movements";
export * from "./features/auth";

// Export combined schema for Drizzle
import * as warehousesSchema from "./features/warehouses";
import * as productsSchema from "./features/products";
import * as projectsSchema from "./features/projects";
import * as stockMovementsSchema from "./features/stock-movements";
import * as authSchema from "./features/auth";

export const schema = {
  ...warehousesSchema,
  ...productsSchema,
  ...projectsSchema,
  ...stockMovementsSchema,
  ...authSchema,
};
