import { db } from "./db";
import { warehouses, products, projects } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  try {
    const existingWarehouses = await db.select().from(warehouses);
    if (existingWarehouses.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding database...");

    const [warehouse1] = await db.insert(warehouses).values({
      name: "Ana Depo",
      address: "Atatürk Cad. No: 123, Merkez/İstanbul",
      description: "Ana merkez deposu - Tüm ürünlerin giriş noktası",
    }).returning();

    const [warehouse2] = await db.insert(warehouses).values({
      name: "Anadolu Depo",
      address: "Organize Sanayi Bölgesi 5. Cadde, Kayseri",
      description: "Anadolu bölgesi dağıtım merkezi",
    }).returning();

    const [warehouse3] = await db.insert(warehouses).values({
      name: "Ege Depo",
      address: "Alsancak, İzmir",
      description: "Ege bölgesi depolama alanı",
    }).returning();

    const [project1] = await db.insert(projects).values({
      name: "Mega AVM Projesi",
      type: "project",
      contactPerson: "Ahmet Yılmaz",
      phone: "0532 123 4567",
      email: "ahmet@megaavm.com",
      address: "Bağdat Cad. No: 456, Kadıköy/İstanbul",
    }).returning();

    const [project2] = await db.insert(projects).values({
      name: "ABC Elektronik A.Ş.",
      type: "company",
      contactPerson: "Mehmet Demir",
      phone: "0533 987 6543",
      email: "mehmet@abcelektronik.com.tr",
      address: "Kozyatağı, İstanbul",
    }).returning();

    const [project3] = await db.insert(projects).values({
      name: "Güneş Enerji Projesi",
      type: "project",
      contactPerson: "Ayşe Kara",
      phone: "0534 555 1234",
      email: "ayse@gunesenerji.com",
      address: "Muğla",
    }).returning();

    const [project4] = await db.insert(projects).values({
      name: "XYZ İnşaat Ltd.",
      type: "company",
      contactPerson: "Can Öztürk",
      phone: "0535 111 2233",
      email: "can@xyzinsaat.com",
      address: "Ankara",
    }).returning();

    await db.insert(products).values([
      {
        stockCode: "ELK-001",
        name: "Samsung 55\" 4K Smart TV",
        productType: "Elektronik",
        description: "55 inç 4K Ultra HD Smart LED TV, HDR10+ desteği",
        quantity: 25,
        barcode: "8690123456001",
        warehouseId: warehouse1.id,
        entryPrice: "12500.00",
        exitPrice: "15999.00",
      },
      {
        stockCode: "ELK-002",
        name: "LG Buzdolabı 520L",
        productType: "Beyaz Eşya",
        description: "No-Frost teknolojili çift kapılı buzdolabı",
        quantity: 12,
        barcode: "8690123456002",
        warehouseId: warehouse1.id,
        entryPrice: "18000.00",
        exitPrice: "22500.00",
      },
      {
        stockCode: "BLG-001",
        name: "Dell Latitude 5520 Laptop",
        productType: "Bilgisayar",
        description: "Intel Core i7, 16GB RAM, 512GB SSD, 15.6\" FHD",
        quantity: 8,
        barcode: "8690123456003",
        warehouseId: warehouse1.id,
        entryPrice: "28000.00",
        exitPrice: "35000.00",
      },
      {
        stockCode: "MOB-001",
        name: "iPhone 15 Pro 256GB",
        productType: "Telefon",
        description: "Apple iPhone 15 Pro, Titanium Black",
        quantity: 45,
        barcode: "8690123456004",
        warehouseId: warehouse1.id,
        entryPrice: "52000.00",
        exitPrice: "62999.00",
      },
      {
        stockCode: "AKS-001",
        name: "Sony WH-1000XM5 Kulaklık",
        productType: "Aksesuar",
        description: "Kablosuz gürültü önleyici kulaklık",
        quantity: 3,
        barcode: "8690123456005",
        warehouseId: warehouse2.id,
        entryPrice: "6500.00",
        exitPrice: "8999.00",
      },
      {
        stockCode: "AKS-002",
        name: "Logitech MX Master 3 Mouse",
        productType: "Aksesuar",
        description: "Kablosuz ergonomik mouse, USB-C şarj",
        quantity: 0,
        barcode: "8690123456006",
        warehouseId: warehouse2.id,
        entryPrice: "2200.00",
        exitPrice: "2999.00",
      },
      {
        stockCode: "ELK-003",
        name: "Beko Çamaşır Makinesi 9KG",
        productType: "Beyaz Eşya",
        description: "A+++ enerji sınıfı, 1400 devir",
        quantity: 18,
        barcode: "8690123456007",
        warehouseId: warehouse3.id,
        entryPrice: "9500.00",
        exitPrice: "12500.00",
      },
      {
        stockCode: "MOB-002",
        name: "Samsung Galaxy S24 Ultra",
        productType: "Telefon",
        description: "512GB, Titanium Gray, S Pen dahil",
        quantity: 22,
        barcode: "8690123456008",
        warehouseId: warehouse3.id,
        entryPrice: "48000.00",
        exitPrice: "58999.00",
      },
    ]);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
