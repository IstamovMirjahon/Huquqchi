# Huquqchi backend ish rejasi

## 1. Arxitektura

- `Domain`: biznes obyektlari, holatlar va invariantlar.
- `Application`: use-case servislar, DTO va port/interfeyslar.
- `Infrastructure`: EF Core/PostgreSQL, JWT va yopiq fayl ombori adapterlari.
- `Api`: REST controllerlar, Swagger, autentifikatsiya va xatolar formati.

Bog‘liqlik yo‘nalishi: `Api -> Infrastructure -> Application -> Domain`.

### Ichki tuzilma

- Domain entitylari bounded-context papkalarida va har biri alohida faylda.
- Application use-case'lari `Features/<Feature>` ichida interface, contract va service sifatida ajratilgan.
- Kutiladigan biznes xatolari `Result<T>` va barqaror error code orqali qaytadi.
- Infrastructure `IRepository<T>` va `IUnitOfWork` portlarini EF Core bilan implementatsiya qiladi.
- Har bir entity explicit `IEntityTypeConfiguration<T>` konfiguratsiyasiga ega.
- API controllerlari persistence'ni bilmaydi; faqat request mapping va HTTP response mapping bajaradi.

## 2. MVP ketma-ketligi

1. Solution, 4 qatlam va test projectlari.
2. User/workspace/JWT va OTP adapteri.
3. Hujjat yuklash, versiya, SHA-256 dublikat nazorati, yuklab olish va soft-delete.
4. Suhbat/xabar va saqlangan hujjatni biriktirish.
5. Tahlil/topilma modeli va almashtiriladigan AI/OCR chegarasi.
6. Qonun, tahrir, modda va rasmiy manba modeli.
7. Tekshirilgan shablonlardan hujjat loyihasi yaratish.
8. PostgreSQL migration, Docker, Swagger va API integration testlari.
9. Keyingi integratsiyalar: SMS, S3/MinIO, OCR worker, AI/RAG, search index, notification.

## 3. Xavfsizlik qarorlari

- Har bir shaxsiy query `workspace_id` bilan cheklanadi.
- Fayl nomidan storage yo‘li olinmaydi; tasodifiy kalit va path traversal tekshiruvi ishlatiladi.
- Ruxsat etilgan format va 25 MB limit serverda tekshiriladi.
- AI provayderi ulanmagan holatda tizim huquqiy xulosa to‘qimaydi.
- Productionda OTP, JWT kaliti, DB paroli va storage tashqi secret/config orqali beriladi.
