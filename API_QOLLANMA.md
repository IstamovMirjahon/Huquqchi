# Huquqchi API qo‘llanmasi

Versiya: `v1`  
Backend: `.NET 10`, ASP.NET Core Web API, EF Core, PostgreSQL, JWT  
Asosiy manba: `Huquqchi_Funksional_Topshiriq_va_Dizayn.md`

## 1. Hozirgi holat

Backendning Clean Architecture asosidagi MVP API qismi ishlaydi: autentifikatsiya, profil, suhbatlar, hujjat ombori, tahlil so‘rovlari, qonunlar katalogi, shablonlar va hujjat loyihalari mavjud.

Funksional topshiriqdagi barcha mahsulot funksiyalari hali tugallanmagan. Telegram orqali xavfsiz OTP mavjud; SMS, email, AI/RAG, OCR, vektor qidiruv, DOCX/PDF eksport, bildirishnomalar, obuna/to‘lov, aktiv sessiyalar, hisobni o‘chirish va administrator API’lari keyingi implementatsiyani talab qiladi.

Hozir backend jami 23 ta HTTP endpoint beradi:

- 2 ta autentifikatsiya endpointi;
- 2 ta profil endpointi;
- 5 ta suhbat endpointi;
- 8 ta hujjat va tahlil endpointi;
- 2 ta qonunlar katalogi endpointi;
- 1 ta shablon endpointi;
- 2 ta loyiha endpointi;
- 1 ta health-check endpointi.

## 2. Ishga tushirish va Swagger

Docker orqali ishga tushirish:

```powershell
docker compose up --build
```

Manzillar:

| Resurs | URL |
|---|---|
| API base URL | `http://localhost:8080` |
| Swagger UI | `http://localhost:8080/swagger` |
| Swagger JSON | `http://localhost:8080/swagger/v1/swagger.json` |
| Health check | `http://localhost:8080/health` |

OTP statik emas. Telegram bot foydalanuvchining o‘z kontaktiga bog‘langan 6 xonali kod yaratadi; kod 5 daqiqa amal qiladi va faqat bir marta ishlatiladi.

## 3. Autentifikatsiya

`AllowAnonymous` deb ko‘rsatilgan endpointlardan tashqari barcha endpointlar JWT talab qiladi.

Token olish tartibi:

1. `POST /api/v1/auth/request-code` orqali Telegram bot havolasi olinadi.
2. Botda `/start` bosilib, foydalanuvchining o‘z telefon kontakti yuboriladi.
3. Bot yuborgan 6 xonali kod `POST /api/v1/auth/verify` orqali tasdiqlanadi.
4. Javobdagi `accessToken` olinadi.
5. Keyingi so‘rovlarga quyidagi header qo‘shiladi:

```http
Authorization: Bearer ACCESS_TOKEN
```

Swagger’da yuqoridagi `Authorize` tugmasi orqali token kiritiladi.

JWT ichida backend foydalanadigan asosiy claimlar:

| Claim | Vazifasi |
|---|---|
| `sub` / NameIdentifier | Foydalanuvchi identifikatori |
| `workspace_id` | Joriy shaxsiy yoki biznes ish maydoni |
| role | Foydalanuvchi roli |

Shaxsiy resurslar `workspace_id` bo‘yicha ajratiladi. Boshqa workspace foydalanuvchisi hujjat yoki suhbat identifikatorini bilsa ham uni ola olmaydi.

## 4. Umumiy javob va xatolik formati

Muvaffaqiyatli endpointlar odatda `200 OK`, yaratish endpointlari `201 Created`, o‘zgartirish va o‘chirish endpointlari `204 No Content` qaytaradi.

Xatolar RFC 7807 `ProblemDetails` formatida qaytadi:

```json
{
  "type": "https://httpstatuses.com/404",
  "title": "NotFound",
  "status": 404,
  "detail": "Hujjat topilmadi.",
  "code": "documents.not_found"
}
```

Frontend foydalanuvchiga `detail` matnini ko‘rsatishi mumkin, dasturiy qarorlar uchun esa o‘zgarmas `code` qiymatidan foydalanishi kerak.

| HTTP status | Ma’nosi |
|---|---|
| `400` | Request validatsiyadan o‘tmadi |
| `401` | Token yo‘q/noto‘g‘ri yoki OTP noto‘g‘ri |
| `403` | Amal uchun ruxsat yetarli emas |
| `404` | Resurs topilmadi yoki joriy workspace’ga tegishli emas |
| `409` | Konflikt, masalan bir xil fayl qayta yuklandi |
| `500` | Kutilmagan server xatosi |

## 5. Endpointlar qisqa jadvali

| Method | Endpoint | Auth | Asosiy vazifa | Ilovada ishlatiladigan joy |
|---|---|---:|---|---|
| `GET` | `/health` | Yo‘q | API va PostgreSQL holatini tekshirish | Docker, CI/CD, server monitoring |
| `POST` | `/api/v1/auth/request-code` | Yo‘q | Telegram OTP bot havolasini olish | Kirish ekrani |
| `POST` | `/api/v1/auth/verify` | Yo‘q | OTP’ni tekshirish va JWT olish | Kod tasdiqlash/ro‘yxatdan o‘tish |
| `GET` | `/api/v1/profile` | Ha | Joriy profil va workspace’ni olish | Profil, Home salomlashuvi |
| `PATCH` | `/api/v1/profile` | Ha | Ism va tilni yangilash | Profil sozlamalari |
| `GET` | `/api/v1/conversations` | Ha | Suhbatlar tarixini olish | Chat tarixi, Home so‘nggi suhbatlar |
| `POST` | `/api/v1/conversations` | Ha | Yangi suhbat yaratish | Yangi chat |
| `GET` | `/api/v1/conversations/{id}/messages` | Ha | Suhbat xabarlarini olish | Chat oynasi |
| `POST` | `/api/v1/conversations/{id}/messages` | Ha | Matnli xabar yuborish | Chat inputi |
| `POST` | `/api/v1/conversations/{id}/documents/{documentId}` | Ha | Saqlangan hujjatni chatga biriktirish | “Hujjatlardan tanlash” |
| `GET` | `/api/v1/documents` | Ha | Hujjatlarni qidirish va filtrlash | Hujjatlar, Home so‘nggi hujjatlar |
| `GET` | `/api/v1/documents/{id}` | Ha | Bitta hujjat tafsilotini olish | Hujjat tafsiloti |
| `POST` | `/api/v1/documents` | Ha | Fayl yuklash va saqlash | Hujjatlar yoki Chat attachment |
| `PATCH` | `/api/v1/documents/{id}` | Ha | Nomi va teglarini yangilash | Hujjatni tahrirlash |
| `DELETE` | `/api/v1/documents/{id}` | Ha | Hujjatni soft-delete qilish | Hujjatni o‘chirish |
| `GET` | `/api/v1/documents/{id}/download` | Ha | Asl faylni yuklab olish | Hujjat tafsiloti |
| `POST` | `/api/v1/documents/{id}/analyses` | Ha | Yangi tahlil so‘rovini yaratish | “AI bilan tekshirish” |
| `GET` | `/api/v1/documents/{id}/analyses` | Ha | Oldingi tahlillar tarixini olish | Tahlil tarixi |
| `GET` | `/api/v1/legal-documents` | Yo‘q | Nashr qilingan qonunlarni qidirish | Qonunlar katalogi, guest rejimi |
| `GET` | `/api/v1/legal-documents/{id}` | Yo‘q | Qonun, tahrir va moddalarni olish | Qonun o‘qish ekrani |
| `GET` | `/api/v1/templates` | Ha | Nashr qilingan shablonlarni olish | Shartnoma turini tanlash |
| `GET` | `/api/v1/drafts` | Ha | Foydalanuvchi loyihalarini olish | Yaratilgan hujjatlar ro‘yxati |
| `POST` | `/api/v1/drafts` | Ha | Shablondan loyiha yaratish | Shartnoma/hujjat yaratish ustasi |

## 6. Health check

### `GET /health`

API va PostgreSQL ulanishining ishlash holatini tekshiradi.

Qayerda ishlatiladi:

- Docker container health-check;
- reverse proxy yoki load balancer;
- CI/CD deploy tekshiruvi;
- server monitoring.

Muvaffaqiyatli javob: `200 OK` va `Healthy`.

## 7. Auth API

### `POST /api/v1/auth/request-code`

Telefon raqamini tekshiradi va kod olinadigan Telegram bot havolasini qaytaradi.

Request:

```json
{
  "phone": "+998901234567"
}
```

Javob: `202 Accepted`.

```json
{
  "message": "Tasdiqlash kodini Telegram bot orqali oling.",
  "deliveryChannel": "telegram",
  "telegramBotUrl": "https://t.me/huquqchi_bot"
}
```

Bot `/start` buyrug‘idan keyin kontakt yuborish tugmasini ko‘rsatadi. Faqat Telegram foydalanuvchisining o‘z kontakti qabul qilinadi. Kod hash ko‘rinishida PostgreSQL’da saqlanadi, 5 daqiqa amal qiladi, 5 ta noto‘g‘ri urinishdan keyin bloklanadi va muvaffaqiyatli kirishdan keyin qayta ishlatilmaydi.

Asosiy xato kodi: `auth.invalid_phone`.

### `POST /api/v1/auth/verify`

Telefon va kodni tekshiradi. Yangi telefon bo‘lsa `User`, `Workspace`, `Membership` va rozilik yozuvini yaratadi; mavjud telefon bo‘lsa mavjud hisobga token beradi.

Request:

```json
{
  "phone": "+998901234567",
  "code": "123456",
  "name": "Ali Valiyev",
  "workspaceKind": "Personal"
}
```

`workspaceKind` qiymatlari: `Personal`, `Business`.

Javob: `200 OK`.

```json
{
  "accessToken": "eyJ...",
  "userId": "00000000-0000-0000-0000-000000000000",
  "workspaceId": "00000000-0000-0000-0000-000000000000",
  "role": "Owner"
}
```

Asosiy xato kodlari: `auth.invalid_phone`, `auth.invalid_code`, `auth.code_rate_limited`.

## 8. Profile API

### `GET /api/v1/profile`

Joriy token egasining profili, workspace’i va rolini qaytaradi.

Qayerda ishlatiladi:

- Profil sahifasi;
- Home sahifadagi salomlashuv;
- shaxsiy/biznes rejimini ko‘rsatish;
- rolga qarab UI imkoniyatlarini boshqarish.

Javob namunasi:

```json
{
  "id": "USER_ID",
  "name": "Ali Valiyev",
  "phone": "+998901234567",
  "language": "uz-Latn",
  "workspace": {
    "id": "WORKSPACE_ID",
    "name": "Ali Valiyev ish maydoni",
    "kind": "Personal"
  },
  "role": "Owner"
}
```

### `PATCH /api/v1/profile`

Foydalanuvchi ismi va interfeys tilini yangilaydi.

```json
{
  "name": "Ali Valiyev",
  "language": "uz-Latn"
}
```

Muvaffaqiyatli javob: `204 No Content`.

Asosiy xato kodlari: `profile.empty_name`, `profile.user_not_found`, `profile.workspace_not_found`.

## 9. Conversations API

### `GET /api/v1/conversations`

Joriy workspace’dagi o‘chirilmagan suhbatlarni oxirgi faollik bo‘yicha qaytaradi.

Qayerda ishlatiladi: Chat tarixi va Home sahifadagi “So‘nggi suhbatlar”. Frontend Home uchun ro‘yxatdan dastlabki 2–3 elementni olishi mumkin.

### `POST /api/v1/conversations`

Yangi suhbat yaratadi. `title` bo‘sh bo‘lsa backend `Yangi suhbat` nomini beradi.

```json
{
  "title": "Ijara shartnomasi bo‘yicha savol"
}
```

Javob: `201 Created` va yaratilgan `ConversationItem`.

### `GET /api/v1/conversations/{id}/messages`

Suhbatga tegishli xabarlarni eski xabardan yangisiga qarab qaytaradi.

Qayerda ishlatiladi: foydalanuvchi chat tarixidan suhbatni ochganda.

### `POST /api/v1/conversations/{id}/messages`

Suhbatga foydalanuvchi xabarini yuboradi.

```json
{
  "content": "Ijaraga beruvchi shartnomani muddatidan oldin bekor qila oladimi?"
}
```

Hozirgi implementatsiya user xabarini saqlaydi va AI provayder ulanmaganini bildiruvchi xavfsiz assistant xabarini qaytaradi. Real huquqiy AI javobi hali yaratilmaydi.

Asosiy xato kodlari: `conversations.not_found`, `conversations.empty_message`.

### `POST /api/v1/conversations/{id}/documents/{documentId}`

Oldin omborga yuklangan hujjatni yangi nusxa yaratmasdan suhbatga bog‘laydi. Bir xil bog‘lanish qayta yuborilsa dublikat yaratmaydi.

Qayerda ishlatiladi: Chat ichidagi “Hujjatlardan tanlash” oqimi.

Muvaffaqiyatli javob: `204 No Content`.

Asosiy xato kodlari: `conversations.not_found`, `documents.not_found`.

## 10. Documents API

### `GET /api/v1/documents`

Joriy workspace hujjatlarini qaytaradi.

Query parametrlar:

| Parametr | Majburiy | Vazifasi |
|---|---:|---|
| `search` | Yo‘q | Hujjat nomi yoki teg bo‘yicha qidiradi |
| `origin` | Yo‘q | `Uploaded`, `Chat` yoki `Generated` bo‘yicha filtrlaydi |

Misollar:

```http
GET /api/v1/documents?search=ijara
GET /api/v1/documents?origin=Generated
```

Qayerda ishlatiladi:

- Hujjatlar asosiy ro‘yxati;
- nom va teg qidiruvi;
- “Yuklanganlar/Yaratilganlar” filtri;
- Home sahifadagi so‘nggi hujjatlar;
- Chat uchun saqlangan hujjat tanlash.

`DocumentOrigin`: `Uploaded`, `Chat`, `Generated`.  
`DocumentStatus`: `Saved`, `Processing`, `Ready`, `Failed`, `Draft`, `Deleted`.

### `GET /api/v1/documents/{id}`

Bitta hujjat kartasi va uning joriy holatini qaytaradi.

Qayerda ishlatiladi: Hujjat tafsiloti sahifasi.

Asosiy xato kodi: `documents.not_found`.

### `POST /api/v1/documents`

Faylni yopiq storage’ga saqlaydi, SHA-256 hash hisoblaydi, metadata va birinchi versiyani PostgreSQL’ga yozadi.

Request turi: `multipart/form-data`.

| Field | Turi | Majburiy | Tavsif |
|---|---|---:|---|
| `file` | file | Ha | PDF, DOCX, JPG/JPEG yoki PNG |
| `origin` | string | Yo‘q | Default: `Uploaded`; boshqa qiymatlar: `Chat`, `Generated` |

Cheklovlar:

- maksimal hajm: 25 MB;
- bo‘sh fayl qabul qilinmaydi;
- ruxsat etilgan formatlar: `.pdf`, `.docx`, `.jpg`, `.jpeg`, `.png`;
- aynan bir xil fayl shu workspace’da mavjud bo‘lsa `409 Conflict` qaytadi.

Qayerda ishlatiladi:

- Hujjatlar → “Hujjat yuklash”;
- Chat → yangi fayl biriktirish;
- Home → “Hujjat tekshirtirish”.

Asosiy xato kodlari: `documents.invalid_type`, `documents.invalid_size`, `documents.duplicate`.

### `PATCH /api/v1/documents/{id}`

Hujjat nomi va teglarini yangilaydi. Bu amal yangi fayl versiyasi yoki yangi tahlil yaratmaydi.

```json
{
  "name": "Ijara shartnomasi 2026",
  "tags": "ijara,uy-joy,2026"
}
```

Muvaffaqiyatli javob: `204 No Content`.

### `DELETE /api/v1/documents/{id}`

Hujjatni soft-delete qiladi va audit yozuvini yaratadi. O‘chirilgan hujjat ro‘yxat va boshqa foydalanuvchi endpointlarida ko‘rinmaydi.

Muvaffaqiyatli javob: `204 No Content`.

Eslatma: hozir physical fayl va barcha bog‘liq ma’lumotlarni retention siyosati bo‘yicha background tozalash implementatsiya qilinmagan.

### `GET /api/v1/documents/{id}/download`

Hujjatning eng oxirgi saqlangan versiyasini binary fayl sifatida qaytaradi. `Content-Type` va yuklab olinadigan fayl nomi response headerlarida beriladi.

Qayerda ishlatiladi: “Asl faylni yuklab olish” tugmasi.

### `POST /api/v1/documents/{id}/analyses`

Saqlangan hujjat uchun yangi tahlil yozuvini yaratadi.

```json
{
  "purpose": "Bekor qilish va jarima bandlarini tekshirish",
  "userRole": "Men ijarachiman"
}
```

Qayerda ishlatiladi:

- Hujjat tafsiloti → “AI bilan tekshirish”;
- Chatga yuklangan hujjat tahlili;
- saqlangan hujjatni qayta tekshirish.

Hozir endpoint tahlil oqimi, status va history’ni yaratadi, ammo AI/OCR provayderi ulanmagan. Shuning uchun u soxta huquqiy xulosa bermaydi va provayder integratsiyasi kutilayotganini ko‘rsatadigan informational finding qaytaradi.

`AnalysisStatus`: `Queued`, `Processing`, `Completed`, `Failed`.  
`FindingSeverity`: `Information`, `NeedsReview`, `HighAttention`.

Asosiy xato kodlari: `documents.empty_analysis_purpose`, `documents.not_found`, `analyses.not_found`.

### `GET /api/v1/documents/{id}/analyses`

Hujjatning barcha versiyalariga tegishli tahlillarni yangi tahlildan eskisiga qarab qaytaradi.

Qayerda ishlatiladi: Hujjat tafsilotidagi “Oldingi tahlillar” bo‘limi.

## 11. Legal documents API

Bu ikki endpoint guest foydalanuvchiga ham ochiq.

### `GET /api/v1/legal-documents`

Nashr qilingan huquqiy hujjatlarni ro‘yxatlaydi. `query` berilsa nom yoki hujjat raqami bo‘yicha qidiradi.

```http
GET /api/v1/legal-documents?query=mehnat
```

Qayerda ishlatiladi:

- Qonunlar katalogi;
- Home → “Qonunlarni qidirish”;
- guest rejimi.

Hozir kalit so‘z qidiruvi nom va raqam bilan chegaralangan. Modda matni, organ, sana, holat va semantik savol bo‘yicha kengaytirilgan qidiruv hali mavjud emas.

### `GET /api/v1/legal-documents/{id}`

Tanlangan hujjat, uning tarixiy/amaldagi tahrirlari va har bir tahrirdagi moddalarni qaytaradi.

Qayerda ishlatiladi: qonun tafsiloti, tahrir tanlash, mundarija va modda o‘qish ekrani.

Response tarkibi:

- hujjat nomi, turi, raqami va rasmiy URL;
- `effectiveFrom`, `effectiveTo`, `isCurrent` bilan tahrirlar;
- har bir tahrir uchun modda raqami, sarlavhasi va matni;
- tahrirning rasmiy manba URL’i.

Asosiy xato kodi: `legal_documents.not_found`.

## 12. Templates va Drafts API

### `GET /api/v1/templates`

Faqat `Published` holatidagi hujjat/shartnoma shablonlarini qaytaradi.

Qayerda ishlatiladi: “Shartnoma yaratish” ustasining birinchi bosqichi.

Har bir element:

- `id` — shablon identifikatori;
- `code` — barqaror kod;
- `name` — foydalanuvchiga ko‘rsatiladigan nom;
- `category` — shartnoma/hujjat kategoriyasi;
- `schemaJson` — frontend formani qurishi uchun maydonlar sxemasi.

### `GET /api/v1/drafts`

Joriy workspace’da yaratilgan loyihalarni yangi loyihadan eskisiga qarab qaytaradi.

Qayerda ishlatiladi: Hujjatlar ichidagi “Yaratilganlar” yoki “Loyihalar” ro‘yxati.

### `POST /api/v1/drafts`

Tanlangan shablon va foydalanuvchi kiritgan qiymatlar asosida hujjat loyihasini yaratadi.

```json
{
  "templateId": "TEMPLATE_ID",
  "name": "Kvartira ijara shartnomasi",
  "fields": {
    "landlordName": "Ali Valiyev",
    "tenantName": "Vali Aliyev",
    "address": null,
    "monthlyPrice": "3000000"
  }
}
```

Bo‘sh yoki `null` qiymat shablonda mavjud bo‘lsa backend soxta ma’lumot o‘ylab topmaydi; uning o‘rniga `[TO‘LDIRING: fieldName]` belgisini qo‘yadi.

Qayerda ishlatiladi: shartnoma/hujjat yaratish ustasining preview va saqlash bosqichi.

Javob: `201 Created` va render qilingan `DraftItem`.

Asosiy xato kodlari: `drafts.empty_name`, `templates.not_found`.

Eslatma: draftni tahrirlash, o‘chirish, ombordagi `UploadedDocument`ga aylantirish hamda DOCX/PDF eksport endpointlari hali mavjud emas.

## 13. Frontend oqimlari

### A. Kirish

```text
request-code → verify → accessToken’ni secure storage’ga saqlash → profile
```

### B. Yangi chat

```text
POST conversations → POST messages → GET messages
```

Real AI ulangunga qadar `POST messages` faqat xavfsiz placeholder javob beradi.

### C. Chatga yangi fayl biriktirish

```text
POST documents (origin=Chat)
→ POST conversations/{id}/documents/{documentId}
→ ixtiyoriy POST documents/{documentId}/analyses
```

### D. Saqlangan hujjatni chatga biriktirish

```text
GET documents
→ foydalanuvchi hujjatni tanlaydi
→ POST conversations/{id}/documents/{documentId}
```

Fayl qayta yuklanmaydi va yangi nusxa yaratilmaydi.

### E. Hujjatni yuklash va keyin tahlil qilish

```text
POST documents (origin=Uploaded)
→ GET documents/{id}
→ POST documents/{id}/analyses
→ GET documents/{id}/analyses
```

### F. Qonun topish

```text
GET legal-documents?query=...
→ GET legal-documents/{id}
→ kerakli version va section’ni UI’da ochish
```

### G. Shartnoma loyihasi yaratish

```text
GET templates
→ schemaJson asosida forma qurish
→ POST drafts
→ GET drafts
```

## 14. Hali mavjud bo‘lmagan API’lar

Quyidagi imkoniyatlar funksional topshiriqda bor, lekin joriy backendda endpoint yoki to‘liq integratsiya sifatida hali yo‘q:

### Auth va account

- SMS yoki email orqali OTP yuborish;
- refresh token;
- hisobni tiklash;
- aktiv sessiyalar va barcha qurilmalardan chiqish;
- consent endpointlari;
- hisobni va shaxsiy ma’lumotlarni eksport/o‘chirish;
- workspace almashtirish va bir nechta workspace boshqaruvi.

### Chat va AI

- AI/RAG provider integratsiyasi;
- manbali real huquqiy javob va `Citation` yaratish;
- streaming/Stop/Retry;
- suhbatni qayta nomlash, qidirish va o‘chirish;
- suhbatga biriktirilgan hujjatlar ro‘yxati va ajratib tashlash;
- xato javob haqida shikoyat va baholash;
- ovozli savol.

### Hujjat va tahlil

- OCR va matn ajratib olish;
- virus/malware scanning;
- parolli yoki shikastlangan faylni aniqlash;
- 100 sahifa limitini tekshirish;
- yangi file version yuklash;
- tahlilni queue/background worker’da bajarish;
- tahlil detail endpointini alohida olish;
- tahlilni PDF eksport qilish;
- ikki versiyani solishtirish;
- physical storage, OCR, indeks va tahlillarni retention siyosati bo‘yicha tozalash.

### Shartnoma/draft

- draft detail, edit va delete;
- draftni `UploadedDocument` sifatida omborga saqlash;
- DOCX/PDF generatsiyasi va download;
- to‘ldirilmagan majburiy maydonlar bo‘yicha alohida checklist;
- yuridik muharrirning shablon CRUD/publish API’lari.

### Qonunlar bazasi

- tur, mavzu, organ, sana va holat filtrlari;
- modda matni ichida qidirish;
- apostrof variantlariga chidamli va semantik qidiruv;
- saqlangan qonunlar va so‘nggi qidiruvlar;
- rasmiy manbadan import/yangilash pipeline’i;
- qonun yangilanishiga obuna.

### Boshqa modullar

- bildirishnomalar;
- tarif, limit, subscription va payment;
- admin va yuridik muharrir endpointlari;
- support endpointlari;
- audit logini ko‘rish;
- yurist profili va maslahat so‘rovi.

## 15. Funksional topshiriqqa nisbatan yakuniy baho

| Yo‘nalish | Holat | Izoh |
|---|---|---|
| Clean Architecture va DDD qatlamlari | Tayyor | Domain, Application, Infrastructure, API ajratilgan |
| PostgreSQL va EF Core | Tayyor | Configurations, migration va index/FK’lar mavjud |
| JWT auth va Telegram OTP | MVP tayyor | 5 daqiqalik, bir martalik kod bor; refresh token hali yo‘q |
| Workspace isolation | Tayyor | Hujjat va chatlar workspace bo‘yicha tekshiriladi |
| Hujjat ombori | MVP tayyor | Upload, list, search, rename, tags, download, soft-delete |
| AI hujjat tahlili | Skelet | History/status ishlaydi, real OCR/AI yo‘q |
| AI chat | Skelet | Xabar saqlanadi, real RAG javobi yo‘q |
| Qonunlar katalogi | MVP tayyor | Oddiy katalog va details bor, advanced search/import yo‘q |
| Shartnoma yaratish | Qisman | Template’dan draft bor, tahrirlash va DOCX/PDF eksport yo‘q |
| Profil | MVP tayyor | Get/update bor, kengaytirilgan sozlamalar yo‘q |
| Bildirishnoma va obuna | Mavjud emas | Keyingi implementatsiya |
| Admin panel backend | Mavjud emas | Keyingi implementatsiya |
| Docker va CI | Tayyor | PostgreSQL, API, migration, test va image build tekshiriladi |

Demak, backend hackathon MVP uchun ishlaydigan asos va asosiy API oqimlariga ega. Ammo funksional topshiriqdagi to‘liq production mahsulotni “barcha ishlar tugallangan” deb hisoblash uchun 14-bo‘limdagi integratsiya va endpointlar ham bajarilishi kerak.
