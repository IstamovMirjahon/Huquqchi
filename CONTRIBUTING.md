# Huquqchi loyihasiga hissa qo‘shish

Bu fayl backend repozitoriysining ildizida turadi. Ish boshlashdan oldin `README.md`, tegishli kod va testlarni o‘qing. API tafsilotlari `API_QOLLANMA.md`da, arxitektura va reja `BACKEND_PLAN.md`da. Hujjatlar bilan kod farq qilsa, amaldagi kod va testlarni tekshiring; hujjatni ham yangilang.

## Loyiha

- Stack: .NET 10, ASP.NET Core Web API, EF Core 10, PostgreSQL 17, JWT, Swagger va alohida Telegram bot worker.
- Solution: `Huquqchi.slnx`.
- Bu monorepoda backend va React/TypeScript frontend (`frontend/`) birga saqlanadi. `Huquqchi-Frontend` eski landing repo bo‘lib, yangi platformaning manbasi emas.
- Hozirgi AI/RAG va OCR adapterlari haqiqiy provayderga ulanmagan. Ularni ishlayotgandek ko‘rsatmang va huquqiy xulosani o‘ylab topmang.

## Kod tuzilmasi

| Joy | Vazifa |
| --- | --- |
| `src/Huquqchi.Domain` | Entity, enum va biznes invariantlari |
| `src/Huquqchi.Application` | `Features/<Feature>` servis, contract, interfeys va `Result<T>` |
| `src/Huquqchi.Infrastructure` | EF Core, PostgreSQL, JWT, fayl saqlash, Telegram bilan bog‘liq adapterlar va migratsiyalar |
| `src/Huquqchi.Api` | Controller, HTTP javob/xato mapping, autentifikatsiya, Swagger va health check |
| `src/Huquqchi.TelegramBot` | OTP yuboradigan worker |
| `tests/Huquqchi.UnitTests` | Domain va application unit testlari |
| `tests/Huquqchi.IntegrationTests` | API va arxitektura testlari |
| `frontend` | React 19, TypeScript, Vite, demo va hybrid API client |

Bog‘liqlik ichkariga yo‘nalsin: Domain tashqi qatlamlarni bilmasin; Application Infrastructure yoki Api’ga bog‘lanmasin; Infrastructure Api’ga bog‘lanmasin. Controllerda biznes yoki persistence mantiqini yig‘mang. Yangi funksiyani tegishli `Features` papkasida, persistence o‘zgarishini Infrastructure’da bajaring. Mavjud `Result<T>` va barqaror xato kodlari uslubini saqlang.

## Ishga tushirish va tekshirish

Talablar: .NET SDK 10 va lokal Docker. Repo ildizidan:

```sh
docker compose up --build
```

API: `http://localhost:8080`; Swagger: `http://localhost:8080/swagger`; health: `http://localhost:8080/health`. `docker-compose.yml` lokal development uchun. Faqat bazani Docker’da ishga tushirish kerak bo‘lsa:

```sh
docker compose up -d postgres
dotnet run --project src/Huquqchi.Api
```

Kod o‘zgargach kamida tegishli testlarni, yakunda esa imkon bo‘lsa quyidagilarni bajaring:

```sh
dotnet build Huquqchi.slnx
dotnet test Huquqchi.slnx
```

EF migratsiyasi kerak bo‘lsa `dotnet tool restore` qiling va `.config/dotnet-tools.json`dagi `dotnet-ef`dan foydalaning. Entity yoki schema o‘zgarsa migratsiya, model konfiguratsiyasi va tegishli testni birga yangilang. Production ma’lumotlar bazasiga lokal tajriba yoki test uchun migratsiya qo‘llamang.

## API va xavfsizlik qoidalari

- Endpointlar `/api/v1` ostida; `GET /health` alohida. Amaldagi request/response shartnomasini o‘zgartirishdan oldin controllerlar va `API_QOLLANMA.md`ni tekshiring.
- Telegram OTP, access/refresh token aylanishi va `workspace_id` izolyatsiyasini saqlang. Shaxsiy resurslar har doim joriy workspace bilan cheklansin.
- Fayl yo‘lini mijoz yuborgan nomdan tuzmang; mavjud fayl saqlash va format/hajm tekshiruvlaridan foydalaning.
- Parol, JWT/OTP kaliti, Telegram tokeni va connection stringni kodga, commitga yoki logga yozmang. `.env` gitga kiritilmaydi; `.env.example` faqat namuna.
- `appsettings.Development.json` faqat lokal sozlamalar uchun. Production secretlari server muhitidan olinadi.
- Kutiladigan biznes xatosini mavjud `Result<T>` orqali qaytaring; API `ProblemDetails` va `code` formatini saqlasin.
- Huquqiy javob yoki manba bilan bog‘liq funksiya qo‘shilsa, mavjud bo‘lmagan qonun, modda yoki iqtibosni ishlab chiqarmang.

## O‘zgarishni yakunlash

Ishni kichik, tekshiriladigan o‘zgarishlarga ajrating. Tegishli test va hujjatlarni yangilang. Yakunda nima o‘zgargani, qaysi buyruqlar bilan tekshirilgani va qolgan cheklovlarni qisqa yozing. CI/CD va production compose fayllari `.github/workflows/`, `docker-compose.production.yml` va `deploy/` ichida; serverga chiqarishdan oldin ularning amaldagi holatini tekshiring.
