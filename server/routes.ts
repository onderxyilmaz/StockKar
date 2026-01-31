import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertWarehouseSchema,
  insertProductSchema,
  insertProjectSchema,
  insertStockMovementSchema,
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed."));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Warehouses
  app.get("/api/warehouses", async (_req: Request, res: Response) => {
    try {
      const warehouses = await storage.getWarehouses();
      res.json(warehouses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch warehouses" });
    }
  });

  app.get("/api/warehouses/:id", async (req: Request, res: Response) => {
    try {
      const warehouse = await storage.getWarehouse(req.params.id);
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
      const warehouse = await storage.createWarehouse(parsed.data);
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
      const warehouse = await storage.updateWarehouse(req.params.id, parsed.data);
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
      const success = await storage.deleteWarehouse(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Warehouse not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete warehouse. It may have associated products." });
    }
  });

  // Products
  app.get("/api/products", async (_req: Request, res: Response) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req: Request, res: Response) => {
    try {
      const parsed = insertProductSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const product = await storage.createProduct(parsed.data);
      res.status(201).json(product);
    } catch (error: any) {
      if (error?.message?.includes("unique")) {
        return res.status(400).json({ error: "Stock code already exists" });
      }
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const parsed = insertProductSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const product = await storage.updateProduct(req.params.id, parsed.data);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      if (error?.message?.includes("unique")) {
        return res.status(400).json({ error: "Stock code already exists" });
      }
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const photos = await storage.getProductPhotos(req.params.id);
      for (const photo of photos) {
        const filePath = path.join(uploadsDir, photo.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Product Photos
  app.get("/api/products/:id/photos", async (req: Request, res: Response) => {
    try {
      const photos = await storage.getProductPhotos(req.params.id);
      res.json(photos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch photos" });
    }
  });

  app.post("/api/products/:id/photos", upload.single("photo"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const existingPhotos = await storage.getProductPhotos(req.params.id);
      if (existingPhotos.length >= 5) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Maximum 5 photos allowed per product" });
      }

      const isMain = req.body.isMain === "true" || existingPhotos.length === 0;
      
      const photo = await storage.createProductPhoto({
        productId: req.params.id,
        url: `/api/photos/${req.file.filename}`,
        filename: req.file.filename,
        isMain,
      });

      if (isMain) {
        await storage.setMainPhoto(req.params.id, photo.id);
      }

      res.status(201).json(photo);
    } catch (error) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: "Failed to upload photo" });
    }
  });

  app.get("/api/photos/:id", async (req: Request, res: Response) => {
    try {
      const photo = await storage.getPhoto(req.params.id);
      if (photo) {
        const filePath = path.join(uploadsDir, photo.filename);
        if (fs.existsSync(filePath)) {
          return res.sendFile(filePath);
        }
      }
      
      const filePath = path.join(uploadsDir, req.params.id);
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
      
      return res.status(404).json({ error: "Photo not found" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch photo" });
    }
  });

  app.delete("/api/photos/:id", async (req: Request, res: Response) => {
    try {
      const photo = await storage.getPhoto(req.params.id);
      if (!photo) {
        return res.status(404).json({ error: "Photo not found" });
      }

      const filePath = path.join(uploadsDir, photo.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const wasMain = photo.isMain;
      const productId = photo.productId;
      
      await storage.deleteProductPhoto(req.params.id);
      
      if (wasMain) {
        const remainingPhotos = await storage.getProductPhotos(productId);
        if (remainingPhotos.length > 0) {
          await storage.setMainPhoto(productId, remainingPhotos[0].id);
        } else {
          await storage.updateProduct(productId, { mainPhotoId: null });
        }
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete photo" });
    }
  });

  app.patch("/api/photos/:id/main", async (req: Request, res: Response) => {
    try {
      const photo = await storage.getPhoto(req.params.id);
      if (!photo) {
        return res.status(404).json({ error: "Photo not found" });
      }
      await storage.setMainPhoto(photo.productId, photo.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to set main photo" });
    }
  });

  // Projects
  app.get("/api/projects", async (_req: Request, res: Response) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req: Request, res: Response) => {
    try {
      const parsed = insertProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const project = await storage.createProject(parsed.data);
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const parsed = insertProjectSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const project = await storage.updateProject(req.params.id, parsed.data);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteProject(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project. It may have associated stock movements." });
    }
  });

  // Stock Movements
  app.get("/api/stock-movements", async (_req: Request, res: Response) => {
    try {
      const movements = await storage.getStockMovements();
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock movements" });
    }
  });

  app.get("/api/products/:id/movements", async (req: Request, res: Response) => {
    try {
      const movements = await storage.getProductStockMovements(req.params.id);
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

      const product = await storage.getProduct(parsed.data.productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (parsed.data.type === "exit" && product.quantity < parsed.data.quantity) {
        return res.status(400).json({ error: "Insufficient stock quantity" });
      }

      const movement = await storage.createStockMovement(parsed.data);
      res.status(201).json(movement);
    } catch (error) {
      res.status(500).json({ error: "Failed to create stock movement" });
    }
  });

  return httpServer;
}
