# Huquqchi Backend

.NET 10, DDD/Clean Architecture, EF Core 10, PostgreSQL, JWT va Swagger asosidagi hackathon MVP backend.

## Ishga tushirish

Talablar: .NET SDK 10 va Docker Desktop.

```powershell
docker compose up --build
```

Swagger: `http://localhost:8080/swagger`

Development OTP kodi: `111111`.

Yoki faqat PostgreSQLni Dockerda, API'ni lokal ishga tushirish:

```powershell
docker compose up -d postgres
dotnet run --project src/Huquqchi.Api
```

## Asosiy API oqimi

1. `POST /api/v1/auth/request-code`
2. `POST /api/v1/auth/verify` va javobdagi `accessToken`ni olish
3. Swagger `Authorize` tugmasiga tokenni kiritish
4. Hujjat, suhbat, tahlil, shablon va draft endpointlarini chaqirish

Guest uchun `GET /api/v1/legal-documents` ochiq. `GET /health` health endpointi.

## Test va build

```powershell
dotnet build Huquqchi.slnx
dotnet test Huquqchi.slnx
```

Arxitektura va keyingi ishlar: [BACKEND_PLAN.md](BACKEND_PLAN.md).

## CI/CD

- `CI`: build, test, dependency audit, PostgreSQL migration va Docker image build.
- `Publish container`: `main` branch va `v*` taglarda image'ni GitHub Container Registry'ga chiqaradi.
- `Deploy to server`: GitHub Actions'dan qo‘lda ishga tushiriladi va SSH orqali serverdagi production compose stack'ni yangilaydi.

Server deployi uchun GitHub `production` environment'iga `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`, `SERVER_SSH_PORT` va private image ishlatilsa `GHCR_READ_TOKEN` secretlari qo‘yiladi. Serverdagi `/opt/huquqchi` ichida `docker-compose.production.yml` hamda `.env.example`dan yaratilgan `.env` turishi kerak.

## Muhim chegara

SMS, OCR va real AI/RAG provayderlari ataylab adapter ortida qoldirilgan. Hozirgi xavfsiz hackathon implementatsiyasi faylni saqlaydi, oqimlarni ishlatadi va provayder bo‘lmasa soxta huquqiy xulosa bermaydi.
