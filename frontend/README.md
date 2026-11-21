# Huquqchi veb-platformasi

React 19, TypeScript, Vite va React Router ilovasi. Manba backend bilan bir repoda, `frontend/` papkasida saqlanadi.

## Lokal ishga tushirish

```bash
npm ci
npm run dev
npm run build
```

`npm run dev` manzili: `http://localhost:5173`. `.env.local` faylida `VITE_API_MODE=mock` o‘rnatilsa, backend talab qilinmaydigan demo ishlaydi. Backend bilan `hybrid` rejimda ishlash uchun `.env.local`ga quyidagilarni yozing:

```dotenv
VITE_API_MODE=hybrid
VITE_API_URL=
VITE_API_PROXY=http://127.0.0.1:3500
```

`VITE_API_PROXY` faqat Vite dev serveriga tegishli; production’da frontend Nginx `/api/` so‘rovlarini Docker ichidagi API’ga uzatadi. Production build `hybrid` rejimida yaratiladi. `real` rejimini barcha endpointlar backendda tayyor bo‘lmaguncha tanlamang.

## Hozirgi funksiya chegarasi

`hybrid` rejimda autentifikatsiya, profil, fayl, hujjat, suhbat, qonun va reference endpointlari mavjud backend bilan ishlaydi. Yuristlar, buyurtma, to‘lov, e’lon, ishlar, hamyon va ayrim AI bo‘limlari demo ma’lumotlarida ishlaydi; ilova bu holatni “Backend + demo” deb ko‘rsatadi. Demo to‘lov haqiqiy pul yechmaydi. Shu modullar uchun haqiqiy backend endpointlari qo‘shilgach `src/api/hybrid.ts` yangilanishi kerak.

## Muhim fayllar

- `src/api/http.ts`: real API client, token yangilash va xato formati.
- `src/api/hybrid.ts`: real va demo endpointlar xaritasi.
- `src/api/mock/`: faqat brauzerda saqlanadigan demo ma’lumotlari.
- `src/pages/`: mijoz, yurist va umumiy sahifalar.
- `nginx.conf`, `Dockerfile`: production build va shu domen orqali API proxy.
