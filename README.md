# StockKar v2 - Monorepo Yapısı

Modern ve kapsamlı bir stok yönetim sistemi. Monorepo ve feature-based mimari ile yeniden yapılandırılmıştır.

## Yapı

```
_stockkar_v2/
├── backend/      # Express backend (feature-based)
├── frontend/     # React frontend (feature-based)
├── shared/       # Shared schema ve types
├── package.json  # Root workspace config
└── tsconfig.json # Root TypeScript config
```

## Features

Her feature kendi modülünde organize edilmiştir:

- **warehouses**: Depo yönetimi
- **products**: Ürün yönetimi ve fotoğraflar
- **projects**: Proje/Firma yönetimi
- **stock-movements**: Stok hareketleri
- **barcode-scanner**: Barkod okuma (frontend only)
- **dashboard**: Dashboard (frontend only)

## Kurulum

```bash
# Tüm bağımlılıkları yükle
npm install

# Development modunda çalıştır
npm run dev

# Backend'i ayrı çalıştır
npm run dev:backend

# Frontend'i ayrı çalıştır
npm run dev:frontend
```

## Build

```bash
# Tüm paketleri build et
npm run build

# Sadece backend'i build et
npm run build:backend

# Sadece frontend'i build et
npm run build:frontend
```

## Database

```bash
# Schema'yı veritabanına push et
npm run db:push
```

## Teknolojiler

- **Backend**: Express.js, TypeScript, Drizzle ORM, PostgreSQL
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Shared**: Drizzle schema, Zod validation
