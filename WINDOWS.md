# Windows 10 Kurulum Kılavuzu

Bu kılavuz Windows 10'da uygulamayı Docker ile çalıştırmak için adım adım talimatlar içerir.

## Gereksinimler

1. **Docker Desktop for Windows**
   - İndirme: https://www.docker.com/products/docker-desktop/
   - Windows 10 64-bit: Pro, Enterprise veya Education (Build 19041 veya üzeri)
   - WSL 2 özelliği etkin olmalı

2. **Git** (opsiyonel - GitHub'dan klonlamak için)
   - İndirme: https://git-scm.com/download/win
   - Veya GitHub Desktop kullanabilirsiniz

## Kurulum Adımları

### 1. Docker Desktop Kurulumu

1. Docker Desktop installer'ı indirin ve çalıştırın
2. Kurulum sırasında "Use WSL 2 instead of Hyper-V" seçeneğini işaretleyin (önerilir)
3. Kurulum tamamlandıktan sonra bilgisayarı yeniden başlatın
4. Docker Desktop'ı başlatın ve sistem tray'de çalıştığından emin olun

### 2. Projeyi İndirme

**Seçenek 1: Git ile klonlama**
```powershell
git clone https://github.com/onderxyilmaz/StockKar.git
cd StockKar
```

**Seçenek 2: ZIP olarak indirme**
1. https://github.com/onderxyilmaz/StockKar adresine gidin
2. "Code" butonuna tıklayın ve "Download ZIP" seçin
3. ZIP dosyasını bir klasöre çıkarın (örn: `C:\Projects\StockKar`)
4. PowerShell veya Command Prompt'u açın ve klasöre gidin:
```powershell
cd C:\Projects\StockKar
```

### 3. Docker Compose ile Başlatma

**PowerShell veya Command Prompt'ta:**

```powershell
# Uygulamayı başlat
docker-compose up -d

# Durumu kontrol et
docker-compose ps

# Logları görüntüle
docker-compose logs -f
```

**İlk başlatmada:**
- Docker image'ları indirilecek (birkaç dakika sürebilir)
- Uygulama build edilecek
- Veritabanı şeması otomatik oluşturulacak

### 4. Uygulamaya Erişim

Uygulama hazır olduğunda tarayıcıda şu adresi açın:
```
http://localhost:5000
```

## Yaygın Sorunlar ve Çözümleri

### Port 5000 Kullanımda

Eğer port 5000 başka bir uygulama tarafından kullanılıyorsa, `docker-compose.yml` dosyasında portu değiştirebilirsiniz:

```yaml
ports:
  - "5001:5000"  # 5001 yerine başka bir port kullanabilirsiniz
```

### Port 5433 Kullanımda (PostgreSQL)

Eğer port 5433 kullanımdaysa, `docker-compose.yml` dosyasında değiştirin:

```yaml
ports:
  - "5434:5432"  # 5434 yerine başka bir port
```

### Docker Desktop Başlamıyor

1. WSL 2'nin kurulu olduğundan emin olun:
   ```powershell
   wsl --list --verbose
   ```
2. Eğer WSL 2 yoksa:
   ```powershell
   wsl --install
   ```
3. Bilgisayarı yeniden başlatın

### Volume İzin Sorunları

Windows'ta genellikle volume izin sorunları olmaz. Eğer `uploads` klasörü oluşturulamıyorsa, manuel olarak oluşturun:

```powershell
mkdir uploads
```

## Komutlar

```powershell
# Uygulamayı başlat
docker-compose up -d

# Durumu kontrol et
docker-compose ps

# Logları görüntüle
docker-compose logs -f

# Sadece uygulama logları
docker-compose logs -f app

# Uygulamayı durdur
docker-compose down

# Uygulamayı durdur ve verileri sil
docker-compose down -v

# Yeniden build et
docker-compose up -d --build

# Container'ları yeniden başlat
docker-compose restart
```

## Veritabanı Erişimi

PostgreSQL veritabanına dışarıdan erişmek isterseniz:

- **Host:** localhost
- **Port:** 5433 (docker-compose.yml'de tanımlı)
- **Database:** stok_yonetim
- **User:** postgres
- **Password:** postgres

Örnek bağlantı string'i:
```
postgresql://postgres:postgres@localhost:5433/stok_yonetim
```

## Sorun Giderme

### Container'lar başlamıyor

```powershell
# Logları kontrol edin
docker-compose logs

# Container'ları temizleyin ve yeniden başlatın
docker-compose down -v
docker-compose up -d --build
```

### Build hatası

```powershell
# Docker cache'i temizleyin
docker system prune -a

# Yeniden build edin
docker-compose build --no-cache
docker-compose up -d
```

### Port çakışması

Windows'ta port kullanımını kontrol edin:
```powershell
netstat -ano | findstr :5000
netstat -ano | findstr :5433
```

## Notlar

- İlk build işlemi 5-10 dakika sürebilir
- Docker Desktop'ın çalışıyor olması gerekiyor
- WSL 2 backend kullanmanız önerilir (daha iyi performans)
- Veritabanı verileri Docker volume'de saklanır, `docker-compose down -v` ile silinmedikçe kalıcıdır
