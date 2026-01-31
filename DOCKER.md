# Docker Compose Kurulumu

Bu uygulamayı Docker Compose ile çalıştırmak için aşağıdaki adımları izleyin.

## Gereksinimler

- Docker
- Docker Compose

## Kurulum ve Çalıştırma

1. **Docker Compose ile uygulamayı başlatın:**

```bash
docker-compose up -d
```

Bu komut:
- PostgreSQL veritabanını başlatır
- Uygulamayı build eder ve çalıştırır
- Veritabanı şemasını otomatik olarak oluşturur

2. **Uygulamaya erişim:**

Uygulama `http://localhost:5000` adresinde çalışacaktır.

## Veritabanı

PostgreSQL veritabanı:
- **Host:** localhost
- **Port:** 5432
- **Database:** stok_yonetim
- **User:** postgres
- **Password:** postgres

## Veritabanı Şeması

Uygulama başlatıldığında veritabanı şeması otomatik olarak oluşturulur (`npm run db:push` komutu ile).

**Not:** Production modunda seed verileri eklenmez. Veritabanı boş başlar.

## Durdurma

Uygulamayı durdurmak için:

```bash
docker-compose down
```

Veritabanı verilerini de silmek için:

```bash
docker-compose down -v
```

## Logları Görüntüleme

```bash
# Tüm servislerin logları
docker-compose logs -f

# Sadece uygulama logları
docker-compose logs -f app

# Sadece veritabanı logları
docker-compose logs -f postgres
```

## Yeniden Build

Kod değişikliklerinden sonra yeniden build etmek için:

```bash
docker-compose up -d --build
```

## Volume'ler

- `postgres_data`: PostgreSQL veritabanı verileri
- `./uploads`: Ürün fotoğrafları (host makinede `uploads` klasörüne kaydedilir)

## Environment Variables

Docker Compose içinde tanımlı environment variables:
- `DATABASE_URL`: PostgreSQL bağlantı URL'i
- `PORT`: Uygulama portu (varsayılan: 5000)
- `NODE_ENV`: production

Bu değerleri değiştirmek için `docker-compose.yml` dosyasını düzenleyin.
