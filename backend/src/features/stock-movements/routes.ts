import type { Express, Request, Response } from "express";
import { insertStockMovementSchema } from "@stockkar/shared/features/stock-movements";
import { stockMovementStorage } from "./storage";
import { productStorage } from "../products/storage";

export function registerStockMovementRoutes(app: Express) {
  app.get("/api/stock-movements", async (_req: Request, res: Response) => {
    try {
      const movements = await stockMovementStorage.getStockMovements();
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock movements" });
    }
  });

  app.get("/api/products/:id/movements", async (req: Request, res: Response) => {
    try {
      const movements = await stockMovementStorage.getProductStockMovements(req.params.id);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock movements" });
    }
  });

  app.post("/api/stock-movements", async (req: Request, res: Response) => {
    try {
      const parsed = insertStockMovementSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const product = await productStorage.getProduct(parsed.data.productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (parsed.data.type === "exit" && product.quantity < parsed.data.quantity) {
        return res.status(400).json({ error: "Insufficient stock quantity" });
      }

      const movement = await stockMovementStorage.createStockMovement(parsed.data);
      res.status(201).json(movement);
    } catch (error) {
      res.status(500).json({ error: "Failed to create stock movement" });
    }
  });
}
