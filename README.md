# Stock Manager Pro - Stok Yönetim Sistemi

Modern ve kapsamlı bir stok yönetim sistemi. React frontend ve Express backend ile geliştirilmiştir.

## Özellikler

- 📦 **Ürün Yönetimi**: Ürün ekleme, düzenleme, silme ve arama
- 🏢 **Depo Yönetimi**: Çoklu depo desteği
- 📊 **Stok Takibi**: Giriş/çıkış hareketleri ve stok durumu
- 📸 **Fotoğraf Yönetimi**: Ürün fotoğrafları (maksimum 5 fotoğraf)
- 🏷️ **Barkod Desteği**: Barkod ile hızlı ürün arama ve işlem
- 📈 **Dashboard**: Genel bakış ve istatistikler
- 🏗️ **Proje/Firma Yönetimi**: Satış hedefleri için proje ve firma takibi

## Teknolojiler

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js, TypeScript
- **Veritabanı**: PostgreSQL
- **ORM**: Drizzle ORM
- **Validasyon**: Zod

## Kurulum

### Docker ile (Önerilen)

```bash
# Uygulamayı başlat
docker-compose up -d

# Logları görüntüle
docker-compose logs -f

# Durdur
docker-compose down
```

Detaylı Docker kurulum bilgileri için [DOCKER.md](./DOCKER.md) dosyasına bakın.

### Manuel Kurulum

1. **Bağımlılıkları yükleyin:**
```bash
npm install
```

2. **Veritabanını ayarlayın:**
`.env` dosyası oluşturun:
```
DATABASE_URL=postgresql://kullanici:sifre@localhost:5432/stok_yonetim
PORT=5000
```

3. **Veritabanı şemasını oluşturun:**
```bash
npm run db:push
```

4. **Uygulamayı çalıştırın:**
```bash
npm run dev
```

Uygulama `http://localhost:5000` adresinde çalışacaktır.

## Geliştirme

```bash
# Development modunda çalıştır
npm run dev

# Production build
npm run build

# Production modunda çalıştır
npm start

# TypeScript kontrolü
npm run check
```

## Lisans

MIT License
