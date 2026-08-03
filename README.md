# Dizilink

"Filmlink" bağlantı oyununun film+dizi versiyonu. Bir başlangıç ve bir hedef film/dizi verilir; ortak oyuncular üzerinden zincir kurarak (Film/Dizi A → o yapımda oynayan bir oyuncu → oyuncunun oynadığı başka bir yapım B → ...) hedefe ulaşmaya çalışırsın.

- **Backend**: Python + FastAPI, TMDb (The Movie Database) API'sine proxy
- **Frontend**: React + TypeScript (Vite)

## Kurulum

### 1. TMDb API key al

[themoviedb.org](https://www.themoviedb.org/) üzerinde ücretsiz bir hesap oluştur, ayarlardan bir **API key (v3 auth)** al.

### 2. Backend

```bash
cd backend
python -m venv venv
./venv/Scripts/Activate.ps1   # Windows PowerShell
pip install -r requirements.txt
cp .env.example .env
```

`.env` dosyasını aç, `TMDB_API_KEY` değerini kendi TMDb key'inle değiştir. Sonra çalıştır:

```bash
uvicorn app.main:app --reload --port 8000
```

Swagger UI: http://localhost:8000/docs

### 3. Frontend (yeni bir terminalde)

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

http://localhost:5173 adresini aç.

## Nasıl oynanır

1. "Oyuna Başla" ile rastgele bir başlangıç/hedef çifti gelir.
2. Gösterilen kadrodan bir oyuncu seç.
3. O oyuncunun oynadığı başka bir film/dizi seç (zincire eklenir).
4. Hedefe ulaşana kadar tekrarla — daha az adım daha iyi skor demektir.

## Bilinen sınırlamalar / gelecek geliştirmeler

- Rastgele seçilen başlangıç/hedef çiftinin her zaman bir zincirle bağlanabilir olduğu garanti edilmiyor (v1'de graph/BFS çözülebilirlik ön-kontrolü yok).
- Zincir adımları sadece istemci tarafında doğrulanıyor (skor/liderlik tablosu gibi bir özellik eklenirse `POST /api/validate-step` gibi bir sunucu taraflı doğrulama eklenmeli).
