# Stok Yönetim Sistemi (Stock Management System)

## Overview

A professional inventory management system built with a React frontend and Express backend. The application provides warehouse management, product tracking, stock movements, and barcode scanning capabilities for Turkish-language business operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming (light/dark mode support)
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Design**: RESTful JSON API under `/api/*` routes
- **File Uploads**: Multer for image handling with UUID-based filenames
- **Static Serving**: Express static middleware for production builds

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Definition**: Shared schema in `shared/schema.ts` with Zod validation via drizzle-zod
- **Database**: PostgreSQL (connection via `DATABASE_URL` environment variable)
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization

### Core Data Models
- **Warehouses**: Storage locations with name, address, description
- **Products**: Inventory items with stock codes, barcodes, pricing, and warehouse associations
- **Product Photos**: Image attachments for products with main photo designation
- **Projects/Companies**: Customer entities for tracking sales destinations
- **Stock Movements**: Entry/exit transactions linking products to projects

### Project Structure
```
├── client/           # React frontend application
│   └── src/
│       ├── components/  # UI components and shadcn/ui
│       ├── pages/       # Route page components
│       ├── hooks/       # Custom React hooks
│       └── lib/         # Utilities and query client
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database operations interface
│   └── db.ts         # Database connection
├── shared/           # Shared code between frontend/backend
│   └── schema.ts     # Drizzle schema and Zod types
└── migrations/       # Database migration files
```

### Build System
- **Development**: Vite dev server with HMR proxied through Express
- **Production**: Custom build script using esbuild for server bundling and Vite for client
- **Output**: Compiled to `dist/` with server as CommonJS and client as static files

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, required via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage for PostgreSQL (available but sessions not currently implemented)

### UI Framework Dependencies
- **Radix UI**: Complete set of accessible, unstyled component primitives
- **Tailwind CSS**: Utility-first CSS framework with custom theme configuration
- **Lucide React**: Icon library used throughout the interface

### Form and Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation shared between frontend and backend
- **@hookform/resolvers**: Zod integration for React Hook Form

### Data Fetching
- **TanStack React Query**: Server state management with automatic caching and refetching

### Date Handling
- **date-fns**: Date formatting and manipulation with Turkish locale support

### File Handling
- **Multer**: Multipart form data handling for image uploads
- **Uploads Directory**: Files stored in `uploads/` directory at project root

### Barcode Scanning Features
- **Product Form Barcode Mode**: "Barkod ile" toggle searches by barcode/stock code and auto-fills form for updating existing products
- **Barcode Scanner Page**: Real-time barcode lookup with stock entry/exit operations, plus edit and delete product actions
- **Safety**: Toggling barcode mode off clears form and resets state to prevent unintended updates