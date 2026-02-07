import type { Express, Request, Response } from "express";
import { insertProductSchema, insertProductPhotoSchema } from "@stockkar/shared/features/products";
import { productStorage } from "./storage";
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

export function registerProductRoutes(app: Express) {
  // Products
  app.get("/api/products", async (_req: Request, res: Response) => {
    try {
      const products = await productStorage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const product = await productStorage.getProduct(req.params.id);
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
      if (!req.body.warehouseId) {
        return res.status(400).json({ error: "Depo seçimi zorunludur" });
      }
      const parsed = insertProductSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const product = await productStorage.createProduct(parsed.data);
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
      const product = await productStorage.updateProduct(req.params.id, parsed.data);
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
      const photos = await productStorage.getProductPhotos(req.params.id);
      for (const photo of photos) {
        const filePath = path.join(uploadsDir, photo.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      const success = await productStorage.deleteProduct(req.params.id);
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
      const photos = await productStorage.getProductPhotos(req.params.id);
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

      const existingPhotos = await productStorage.getProductPhotos(req.params.id);
      if (existingPhotos.length >= 5) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Maximum 5 photos allowed per product" });
      }

      const isMain = req.body.isMain === "true" || existingPhotos.length === 0;
      
      const photo = await productStorage.createProductPhoto({
        productId: req.params.id,
        url: `/api/photos/${req.file.filename}`,
        filename: req.file.filename,
        isMain,
      });

      if (isMain) {
        await productStorage.setMainPhoto(req.params.id, photo.id);
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
      const photo = await productStorage.getPhoto(req.params.id);
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
      const photo = await productStorage.getPhoto(req.params.id);
      if (!photo) {
        return res.status(404).json({ error: "Photo not found" });
      }

      const filePath = path.join(uploadsDir, photo.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const wasMain = photo.isMain;
      const productId = photo.productId;
      
      await productStorage.deleteProductPhoto(req.params.id);
      
      if (wasMain) {
        const remainingPhotos = await productStorage.getProductPhotos(productId);
        if (remainingPhotos.length > 0) {
          await productStorage.setMainPhoto(productId, remainingPhotos[0].id);
        } else {
          await productStorage.updateProduct(productId, { mainPhotoId: null });
        }
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete photo" });
    }
  });

  app.patch("/api/photos/:id/main", async (req: Request, res: Response) => {
    try {
      const photo = await productStorage.getPhoto(req.params.id);
      if (!photo) {
        return res.status(404).json({ error: "Photo not found" });
      }
      await productStorage.setMainPhoto(photo.productId, photo.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to set main photo" });
    }
  });
}
