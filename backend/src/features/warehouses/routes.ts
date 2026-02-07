import type { Express, Request, Response } from "express";
import { insertWarehouseSchema } from "@stockkar/shared/features/warehouses";
import { warehouseStorage } from "./storage";

export function registerWarehouseRoutes(app: Express) {
  app.get("/api/warehouses", async (_req: Request, res: Response) => {
    try {
      const warehouses = await warehouseStorage.getWarehouses();
      res.json(warehouses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch warehouses" });
    }
  });

  app.get("/api/warehouses/:id", async (req: Request, res: Response) => {
    try {
      const warehouse = await warehouseStorage.getWarehouse(req.params.id);
      if (!warehouse) {
        return res.status(404).json({ error: "Warehouse not found" });
      }
      res.json(warehouse);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch warehouse" });
    }
  });

  app.post("/api/warehouses", async (req: Request, res: Response) => {
    try {
      const parsed = insertWarehouseSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const warehouse = await warehouseStorage.createWarehouse(parsed.data);
      res.status(201).json(warehouse);
    } catch (error) {
      res.status(500).json({ error: "Failed to create warehouse" });
    }
  });

  app.patch("/api/warehouses/:id", async (req: Request, res: Response) => {
    try {
      const parsed = insertWarehouseSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const warehouse = await warehouseStorage.updateWarehouse(req.params.id, parsed.data);
      if (!warehouse) {
        return res.status(404).json({ error: "Warehouse not found" });
      }
      res.json(warehouse);
    } catch (error) {
      res.status(500).json({ error: "Failed to update warehouse" });
    }
  });

  app.delete("/api/warehouses/:id", async (req: Request, res: Response) => {
    try {
      const success = await warehouseStorage.deleteWarehouse(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Warehouse not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete warehouse. It may have associated products." });
    }
  });
}
