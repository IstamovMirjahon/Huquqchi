# Huquqchi Backend

.NET 10, DDD/Clean Architecture, EF Core 10, PostgreSQL, JWT va Swagger asosidagi hackathon MVP backend.

## Ishga tushirish

Talablar: .NET SDK 10 va Docker Desktop.

```powershell
docker compose up --build
```

Swagger: `http://localhost:8080/swagger`

Tasdiqlash kodi alohida `Huquqchi.TelegramBot` worker orqali yuboriladi. BotFather tokeni `Telegram__BotToken`, OTP hash kaliti esa `Otp__HashKey` konfiguratsiyasidan olinadi.

Yoki faqat PostgreSQLni Dockerda, API'ni lokal ishga tushirish:

```powershell
docker compose up -d postgres
dotnet run --project src/Huquqchi.Api
```

## Asosiy API oqimi

1. `POST /api/v1/auth/request-code` orqali Telegram bot havolasini olish.
2. Botda `/start` bosib o‘z telefon kontaktini faqat birinchi marta yuborish va 6 xonali kodni olish. Keyingi kirishlarda bot saqlangan bog‘lanishdan foydalanadi.
3. `POST /api/v1/auth/verify` orqali kodni tasdiqlab 15 daqiqalik `accessToken` va 30 kunlik `refreshToken` olish.
4. Swagger `Authorize` tugmasiga tokenni kiritish.
5. Access token tugaganda `POST /api/v1/auth/refresh` orqali sessiyani kodsiz yangilash; chiqishda `POST /api/v1/auth/logout` orqali refresh tokenni bekor qilish.
6. Hujjat, suhbat, tahlil, shablon va draft endpointlarini chaqirish.

Guest uchun `GET /api/v1/legal-documents` ochiq. `GET /health` health endpointi.

## Test va build

```powershell
dotnet build Huquqchi.slnx
dotnet test Huquqchi.slnx
```

Arxitektura va keyingi ishlar: [BACKEND_PLAN.md](BACKEND_PLAN.md).

## CI/CD

- `CI`: build, test, dependency audit, PostgreSQL migration hamda API/bot Docker image build.
- `Publish container`: `main` branch va `v*` taglarda image'ni GitHub Container Registry'ga chiqaradi.
- `Deploy to server`: GitHub Actions'dan qo‘lda ishga tushiriladi va SSH orqali serverdagi production compose stack'ni yangilaydi.

Server deployi uchun GitHub `production` environment'iga `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY` va `SERVER_SSH_PORT` secretlari qo‘yiladi. GHCR image shu repository'ning vaqtinchalik `GITHUB_TOKEN` tokeni bilan olinadi; alohida doimiy registry tokeni saqlanmaydi. Serverdagi `/home/deploy/huquqchi` ichida `docker-compose.production.yml` hamda `.env.example`dan yaratilgan `.env` turishi kerak.

Birinchi deploydan oldin serverda `deploy/bootstrap-server.sh` bir marta bajariladi. U production secretlarini tasodifiy yaratadi, `.env` permissionini `600` qiladi va API uchun serverdagi `3500` portni tanlaydi. Keyingi deploylarda workflow compose faylini yangilaydi, `.env` esa o‘zgartirilmaydi.

## Muhit konfiguratsiyasi

- `appsettings.json` production uchun secretsiz bazaviy sozlamalarni saqlaydi.
- `appsettings.Development.json` lokal PostgreSQL, development JWT, OTP va storage sozlamalarini saqlaydi.
- Production `ConnectionStrings__Postgres`, `Jwt__Key`, `Otp__HashKey` va `Telegram__BotToken` qiymatlarini server `.env` fayli orqali oladi. Majburiy secret yo‘q yoki kalitlar 32 belgidan qisqa bo‘lsa tegishli service ishga tushmaydi.

## Muhim chegara

SMS o‘rniga Telegram OTP worker ishlaydi. OCR va real AI/RAG provayderlari adapter ortida qoldirilgan. Hozirgi xavfsiz hackathon implementatsiyasi faylni saqlaydi, oqimlarni ishlatadi va provayder bo‘lmasa soxta huquqiy xulosa bermaydi.
