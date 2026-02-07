import "dotenv/config";
import { db } from "./db";
import { stockMovements, productPhotos, products, projects, warehouses, users } from "@stockkar/shared";

async function clearDatabase() {
  try {
    console.log("Clearing database...");

    // Foreign key constraint'leri nedeniyle doğru sırayla silmeliyiz
    await db.delete(stockMovements);
    console.log("✓ Stock movements deleted");

    await db.delete(productPhotos);
    console.log("✓ Product photos deleted");

    await db.delete(products);
    console.log("✓ Products deleted");

    await db.delete(projects);
    console.log("✓ Projects deleted");

    await db.delete(warehouses);
    console.log("✓ Warehouses deleted");

    await db.delete(users);
    console.log("✓ Users deleted");

    console.log("\n✅ Database cleared successfully!");
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    process.exit(1);
  }
}

clearDatabase();
