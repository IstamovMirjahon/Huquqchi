// Demo data for the mock backend. Names, prices and reviews are fictional samples.
import type * as T from '../types'

export const CATEGORIES: T.Category[] = [
  { code: 'labor', name: 'Mehnat huquqi', icon: 'briefcase' },
  { code: 'family', name: 'Oila huquqi', icon: 'family' },
  { code: 'housing', name: 'Uy-joy va ijara', icon: 'home' },
  { code: 'consumer', name: 'Iste’molchi huquqlari', icon: 'cart' },
  { code: 'business', name: 'Biznes va shartnomalar', icon: 'building' },
  { code: 'tax', name: 'Soliq', icon: 'receipt' },
  { code: 'criminal', name: 'Jinoyat ishlari', icon: 'shield' },
  { code: 'administrative', name: 'Ma’muriy ishlar', icon: 'stamp' },
  { code: 'inheritance', name: 'Meros', icon: 'scroll' },
  { code: 'land', name: 'Yer va mulk', icon: 'map' },
  { code: 'migration', name: 'Migratsiya', icon: 'globe' },
  { code: 'civil', name: 'Fuqarolik nizolari', icon: 'scale' },
  { code: 'other', name: 'Boshqa', icon: 'dots' },
]

export const REGIONS: T.Region[] = [
  ['tashkent_city', 'Toshkent shahri'], ['tashkent', 'Toshkent viloyati'], ['andijan', 'Andijon'], ['bukhara', 'Buxoro'],
  ['fergana', 'Farg‘ona'], ['jizzakh', 'Jizzax'], ['kashkadarya', 'Qashqadaryo'], ['khorezm', 'Xorazm'],
  ['namangan', 'Namangan'], ['navoi', 'Navoiy'], ['samarkand', 'Samarqand'], ['surkhandarya', 'Surxondaryo'],
  ['syrdarya', 'Sirdaryo'], ['karakalpakstan', 'Qoraqalpog‘iston'],
].map(([code, name]) => ({ code, name }))

export const cat = (c: T.CategoryCode) => CATEGORIES.find((x) => x.code === c)!
export const reg = (c: string) => REGIONS.find((x) => x.code === c) ?? REGIONS[0]

export interface SeedLawyer {
  id: string; userId: string; name: string; type: T.LawyerType; headline: string; bio: string
  cats: T.CategoryCode[]; region: string; city: string; languages: T.Language[]; workFormats: T.WorkFormat[]
  experienceYears: number; rating: number; reviewCount: number; completedOrders: number; responseTimeMinutes: number
  isOnline: boolean; isPromoted: boolean; education: T.Education[]; licenseNumber: string; officeAddress: string | null
  hue: number
}

export const LAWYERS: SeedLawyer[] = [
  { id: 'lw-1', userId: 'u-lawyer', name: 'Dilshod Rahimov', type: 'advocate', headline: 'Mehnat va oila nizolari bo‘yicha advokat',
    bio: '2016-yildan advokatlik faoliyati bilan shug‘ullanaman. Ishga tiklash, ish haqi undirish, ajrim va aliment ishlarini sudda yuritaman. Har bir mijozga vaziyatni oddiy tilda tushuntirib, aniq reja beraman.',
    cats: ['labor', 'family', 'civil'], region: 'tashkent_city', city: 'Toshkent', languages: ['uz-Latn', 'ru'], workFormats: ['online', 'office', 'court'],
    experienceYears: 9, rating: 4.9, reviewCount: 128, completedOrders: 214, responseTimeMinutes: 35, isOnline: true, isPromoted: false,
    education: [{ institution: 'Toshkent davlat yuridik universiteti', degree: 'Magistr', year: 2015 }], licenseNumber: 'AB-004521',
    officeAddress: 'Toshkent, Yunusobod tumani, Amir Temur ko‘chasi', hue: 222 },
  { id: 'lw-2', userId: 'u-lw-2', name: 'Madina Yusupova', type: 'legal_consultant', headline: 'Ijara, oldi-sotdi va biznes shartnomalari',
    bio: 'Kichik biznes va tadbirkorlar uchun shartnomalar tuzaman va tekshiraman. 600 dan ortiq shartnoma ko‘rib chiqilgan.',
    cats: ['business', 'housing', 'consumer'], region: 'tashkent_city', city: 'Toshkent', languages: ['uz-Latn', 'ru'], workFormats: ['online'],
    experienceYears: 6, rating: 4.8, reviewCount: 96, completedOrders: 310, responseTimeMinutes: 20, isOnline: true, isPromoted: true,
    education: [{ institution: 'Jahon iqtisodiyoti va diplomatiya universiteti', degree: 'Bakalavr', year: 2018 }], licenseNumber: 'YM-11872',
    officeAddress: null, hue: 330 },
  { id: 'lw-3', userId: 'u-lw-3', name: 'Akmal Tursunov', type: 'advocate', headline: 'Jinoyat va ma’muriy ishlar himoyachisi',
    bio: 'Tergov va sud bosqichlarida himoya. Ma’muriy jarimalar ustidan shikoyat.',
    cats: ['criminal', 'administrative'], region: 'samarkand', city: 'Samarqand', languages: ['uz-Latn', 'ru'], workFormats: ['online', 'office', 'court'],
    experienceYears: 14, rating: 4.7, reviewCount: 71, completedOrders: 156, responseTimeMinutes: 60, isOnline: false, isPromoted: false,
    education: [{ institution: 'Samarqand davlat universiteti', degree: 'Magistr', year: 2010 }], licenseNumber: 'AB-001930',
    officeAddress: 'Samarqand, Registon ko‘chasi', hue: 160 },
  { id: 'lw-4', userId: 'u-lw-4', name: 'Nodira Qodirova', type: 'advocate', headline: 'Meros, yer va ko‘chmas mulk',
    bio: 'Meros ochish, merosni taqsimlash bo‘yicha nizolar, uy-joyni ro‘yxatdan o‘tkazish masalalari.',
    cats: ['inheritance', 'land', 'housing'], region: 'fergana', city: 'Farg‘ona', languages: ['uz-Latn'], workFormats: ['online', 'office', 'court'],
    experienceYears: 11, rating: 4.9, reviewCount: 54, completedOrders: 98, responseTimeMinutes: 45, isOnline: true, isPromoted: false,
    education: [{ institution: 'Toshkent davlat yuridik universiteti', degree: 'Bakalavr', year: 2013 }], licenseNumber: 'AB-003377',
    officeAddress: 'Farg‘ona, Mustaqillik ko‘chasi', hue: 30 },
  { id: 'lw-5', userId: 'u-lw-5', name: 'Bekzod Ergashev', type: 'legal_consultant', headline: 'Soliq va YaTT masalalari',
    bio: 'YaTT va MChJ ochish, soliq rejimini tanlash, soliq tekshiruvlariga tayyorgarlik.',
    cats: ['tax', 'business'], region: 'tashkent_city', city: 'Toshkent', languages: ['uz-Latn', 'ru'], workFormats: ['online'],
    experienceYears: 5, rating: 4.6, reviewCount: 39, completedOrders: 77, responseTimeMinutes: 25, isOnline: true, isPromoted: false,
    education: [{ institution: 'Toshkent moliya instituti', degree: 'Magistr', year: 2019 }], licenseNumber: 'YM-20455',
    officeAddress: null, hue: 260 },
  { id: 'lw-6', userId: 'u-lw-6', name: 'Gulnora Saidova', type: 'advocate', headline: 'Oila huquqi: ajrim, aliment, bola masalalari',
    bio: 'Oilaviy nizolarni avval murosa yo‘li bilan, kerak bo‘lsa sudda hal qilaman.',
    cats: ['family', 'inheritance'], region: 'bukhara', city: 'Buxoro', languages: ['uz-Latn', 'ru'], workFormats: ['online', 'office', 'court'],
    experienceYears: 8, rating: 4.8, reviewCount: 62, completedOrders: 120, responseTimeMinutes: 50, isOnline: false, isPromoted: false,
    education: [{ institution: 'Buxoro davlat universiteti', degree: 'Magistr', year: 2016 }], licenseNumber: 'AB-005102',
    officeAddress: 'Buxoro, Navoiy shoh ko‘chasi', hue: 350 },
  { id: 'lw-7', userId: 'u-lw-7', name: 'Sardor Mirzaev', type: 'legal_consultant', headline: 'Iste’molchi huquqlari va xaridlar',
    bio: 'Sifatsiz tovar, onlayn xaridlar, xizmat ko‘rsatish bo‘yicha talabnomalar va shikoyatlar.',
    cats: ['consumer', 'civil'], region: 'namangan', city: 'Namangan', languages: ['uz-Latn'], workFormats: ['online'],
    experienceYears: 3, rating: 4.5, reviewCount: 18, completedOrders: 34, responseTimeMinutes: 15, isOnline: true, isPromoted: false,
    education: [{ institution: 'Namangan davlat universiteti', degree: 'Bakalavr', year: 2021 }], licenseNumber: 'YM-30871',
    officeAddress: null, hue: 190 },
  { id: 'lw-8', userId: 'u-lw-8', name: 'Rustam Hamidov', type: 'advocate', headline: 'Migratsiya va xalqaro masalalar',
    bio: 'Chet elda ishlash, fuqarolik, yashash ruxsatnomasi masalalari. Rus va ingliz tillarida.',
    cats: ['migration', 'labor'], region: 'tashkent_city', city: 'Toshkent', languages: ['uz-Latn', 'ru'], workFormats: ['online', 'office'],
    experienceYears: 12, rating: 4.7, reviewCount: 45, completedOrders: 89, responseTimeMinutes: 90, isOnline: false, isPromoted: false,
    education: [{ institution: 'Toshkent davlat yuridik universiteti', degree: 'PhD', year: 2014 }], licenseNumber: 'AB-002214',
    officeAddress: 'Toshkent, Mirobod tumani', hue: 100 },
]

type SvcSeed = [lawyerId: string, type: T.ServiceType, cat: T.CategoryCode, title: string, desc: string, price: number, priceType: T.PriceType, duration: number | null, days: number | null, formats: T.ConsultationFormat[], orders: number]

export const SERVICES: SvcSeed[] = [
  ['lw-1', 'consultation', 'labor', 'Onlayn konsultatsiya, 30 daqiqa', 'Vaziyatingizni tahlil qilamiz, huquqlaringiz va keyingi qadamlarni aniqlaymiz.', 150000, 'fixed', 30, null, ['video', 'audio', 'chat'], 87],
  ['lw-1', 'question', 'labor', 'Tezkor yozma savol', 'Bitta aniq savolga 24 soat ichida yozma, manbali javob. Bitta aniqlashtirish bepul.', 70000, 'fixed', null, 1, ['chat'], 140],
  ['lw-1', 'document_drafting', 'labor', 'Ishga tiklash bo‘yicha da’vo arizasi', 'Hujjatlaringiz asosida sudga da’vo arizasini tayyorlayman.', 350000, 'from', null, 3, ['chat'], 31],
  ['lw-1', 'representation', 'family', 'Sudda vakillik (oilaviy nizo)', 'Birinchi instansiya sudida vakillik. Narx ish murakkabligiga qarab kelishiladi.', 2500000, 'from', null, 30, ['office'], 12],
  ['lw-2', 'document_review', 'housing', 'Ijara shartnomasini tekshirish', 'Shartnomani o‘qib, xavfli bandlar va tuzatish takliflarini yozma beraman.', 120000, 'fixed', null, 2, ['chat'], 190],
  ['lw-2', 'document_drafting', 'business', 'Xizmat ko‘rsatish shartnomasi tuzish', 'Sizning biznesingizga moslab shartnoma loyihasi.', 300000, 'fixed', null, 3, ['chat'], 64],
  ['lw-2', 'consultation', 'business', 'Biznes konsultatsiya, 60 daqiqa', 'Shartnoma, kontragent va majburiyatlar bo‘yicha batafsil maslahat.', 250000, 'fixed', 60, null, ['video', 'chat'], 41],
  ['lw-3', 'consultation', 'criminal', 'Himoyachi bilan konsultatsiya', 'Chaqiruv, tergov yoki ayblov bo‘yicha birinchi maslahat.', 300000, 'fixed', 45, null, ['video', 'audio', 'office'], 52],
  ['lw-3', 'document_drafting', 'administrative', 'Ma’muriy jarima ustidan shikoyat', 'Jarima qarori ustidan shikoyat tayyorlash.', 200000, 'fixed', null, 2, ['chat'], 47],
  ['lw-4', 'consultation', 'inheritance', 'Meros bo‘yicha konsultatsiya', 'Meros ochish, merosxo‘rlar navbati, muddatlar.', 120000, 'fixed', 30, null, ['video', 'audio', 'office'], 45],
  ['lw-4', 'document_review', 'land', 'Ko‘chmas mulk hujjatlarini tekshirish', 'Oldi-sotdi oldidan hujjatlarni tekshirish.', 250000, 'fixed', null, 3, ['chat'], 22],
  ['lw-5', 'consultation', 'tax', 'Soliq bo‘yicha konsultatsiya', 'Soliq rejimi, deklaratsiya, imtiyozlar.', 100000, 'fixed', 30, null, ['video', 'chat'], 40],
  ['lw-5', 'question', 'tax', 'Soliq bo‘yicha yozma savol', '24 soat ichida yozma javob.', 50000, 'fixed', null, 1, ['chat'], 37],
  ['lw-6', 'consultation', 'family', 'Oilaviy masala bo‘yicha maslahat', 'Ajrim, aliment, bola bilan uchrashish tartibi.', 130000, 'fixed', 30, null, ['video', 'audio', 'office'], 70],
  ['lw-6', 'document_drafting', 'family', 'Aliment undirish arizasi', 'Sudga ariza tayyorlash.', 180000, 'fixed', null, 2, ['chat'], 33],
  ['lw-7', 'document_drafting', 'consumer', 'Sotuvchiga talabnoma', 'Pulni qaytarish yoki tovarni almashtirish talabnomasi.', 80000, 'fixed', null, 1, ['chat'], 26],
  ['lw-7', 'question', 'consumer', 'Iste’molchi savoli', 'Yozma javob 12 soat ichida.', 40000, 'fixed', null, 1, ['chat'], 19],
  ['lw-8', 'consultation', 'migration', 'Migratsiya bo‘yicha konsultatsiya', 'Chet elda ishlash va hujjatlar.', 200000, 'fixed', 60, null, ['video', 'audio', 'chat'], 38],
]

export const REVIEW_TEXTS: [number, string, string][] = [
  [5, 'Juda tez javob berdi, vaziyatni oddiy tilda tushuntirdi. Ertasiga ish beruvchi bilan gaplashib, masalani hal qildim.', 'Sevara A.'],
  [5, 'Shartnomadagi 3 ta xavfli bandni topib berdi. Imzolashdan oldin tekshirtirganim yaxshi bo‘lgan.', 'Jasur T.'],
  [4, 'Foydali konsultatsiya, faqat 10 daqiqa kechikib boshlandi.', 'Malika R.'],
  [5, 'Professional yondashuv, hujjatlarni o‘z vaqtida tayyorlab berdi.', 'Otabek N.'],
  [5, 'Narxiga arziydi. Rahmat!', 'Dilnoza S.'],
]

export const TEMPLATES: T.Template[] = [
  {
    id: 'tpl-rent', code: 'rent_apartment', name: 'Kvartira ijara shartnomasi', category: 'Ijara', audience: ['client', 'lawyer'],
    notary: 'optional', notaryNote: '2019-yildagi islohot bilan ko‘chmas mulk ijarasini majburiy notarial tasdiqlash bekor qilingan. O‘zingiz yozma tuzasiz; xohlasangiz notarial tasdiqlatish mumkin (e-notarius.uz).',
    description: 'Turar joyni ijaraga berish va olish uchun. Tomonlar, narx, muddat va javobgarlik.',
    schema: { steps: [
      { title: 'Tomonlar', fields: [
        { key: 'landlordName', label: 'Ijaraga beruvchi F.I.Sh.', type: 'text', required: true, hint: 'Pasportdagidek', example: 'Karimov Alisher Baxtiyorovich' },
        { key: 'landlordPassport', label: 'Ijaraga beruvchi pasporti', type: 'passport', required: true, example: 'AA 1234567' },
        { key: 'tenantName', label: 'Ijarachi F.I.Sh.', type: 'text', required: true },
        { key: 'tenantPassport', label: 'Ijarachi pasporti', type: 'passport', required: true },
      ] },
      { title: 'Uy-joy', fields: [
        { key: 'address', label: 'Manzil', type: 'textarea', required: true, example: 'Toshkent sh., Chilonzor t., 9-mavze, 12-uy, 34-xonadon' },
        { key: 'rooms', label: 'Xonalar soni', type: 'number', required: false },
      ] },
      { title: 'Narx va muddat', fields: [
        { key: 'monthlyPrice', label: 'Oylik ijara haqi (so‘m)', type: 'money', required: true },
        { key: 'deposit', label: 'Garov summasi (so‘m)', type: 'money', required: false },
        { key: 'startDate', label: 'Boshlanish sanasi', type: 'date', required: true },
        { key: 'endDate', label: 'Tugash sanasi', type: 'date', required: true },
        { key: 'utilities', label: 'Kommunal to‘lovlar', type: 'select', required: true, options: [{ value: 'tenant', label: 'Ijarachi to‘laydi' }, { value: 'landlord', label: 'Ijaraga beruvchi to‘laydi' }] },
      ] },
    ] },
  },
  {
    id: 'tpl-service', code: 'service_agreement', name: 'Xizmat ko‘rsatish shartnomasi', category: 'Biznes', audience: ['client', 'lawyer'],
    notary: 'none', notaryNote: 'Oddiy yozma shaklda tuziladi, notarius shart emas.',
    description: 'Ijrochi buyurtmachiga haq evaziga xizmat ko‘rsatishi uchun.',
    schema: { steps: [
      { title: 'Tomonlar', fields: [
        { key: 'customer', label: 'Buyurtmachi', type: 'text', required: true, hint: 'F.I.Sh. yoki tashkilot nomi' },
        { key: 'contractor', label: 'Ijrochi', type: 'text', required: true },
      ] },
      { title: 'Xizmat', fields: [
        { key: 'subject', label: 'Xizmat tavsifi', type: 'textarea', required: true },
        { key: 'price', label: 'Narx (so‘m)', type: 'money', required: true },
        { key: 'deadline', label: 'Bajarish muddati', type: 'date', required: true },
      ] },
    ] },
  },
  {
    id: 'tpl-claim', code: 'claim_letter', name: 'Talabnoma (pretenziya)', category: 'Ariza', audience: ['client', 'lawyer'],
    notary: 'none', notaryNote: 'Talabnoma shartnoma emas: o‘zingiz imzolab, ikki nusxada topshirasiz.',
    description: 'Kontragentga majburiyatni bajarish talabi: qarz, sifatsiz tovar, xizmat.',
    schema: { steps: [
      { title: 'Kimdan va kimga', fields: [
        { key: 'from', label: 'Talab qiluvchi', type: 'text', required: true },
        { key: 'to', label: 'Kimga', type: 'text', required: true },
      ] },
      { title: 'Talab', fields: [
        { key: 'facts', label: 'Holat bayoni', type: 'textarea', required: true },
        { key: 'demand', label: 'Talab', type: 'textarea', required: true, example: '10 kun ichida 2 500 000 so‘mni qaytarish' },
        { key: 'amount', label: 'Summa (so‘m)', type: 'money', required: false },
      ] },
    ] },
  },
  {
    id: 'tpl-sale', code: 'sale_agreement', name: 'Oldi-sotdi shartnomasi', category: 'Oldi-sotdi', audience: ['client', 'lawyer'],
    notary: 'conditional', notaryNote: 'Oddiy ko‘char mulk uchun yozma shakl yetarli. Ishlatilgan avtomobil bo‘lsa, shartnoma notarial tasdiqlanishi shart («Avtomobil oldi-sotdi shartnomasi» shablonini oling).',
    description: 'Ko‘char mulkni (avtomobil, texnika) sotish uchun.',
    schema: { steps: [
      { title: 'Tomonlar', fields: [
        { key: 'seller', label: 'Sotuvchi', type: 'text', required: true },
        { key: 'buyer', label: 'Xaridor', type: 'text', required: true },
      ] },
      { title: 'Mulk va narx', fields: [
        { key: 'item', label: 'Mulk tavsifi', type: 'textarea', required: true },
        { key: 'price', label: 'Narx (so‘m)', type: 'money', required: true },
      ] },
    ] },
  },
]

TEMPLATES.push(
  {
    id: 'tpl-car', code: 'car_sale', name: 'Avtomobil oldi-sotdi shartnomasi', category: 'Notarial', audience: ['client', 'lawyer'],
    notary: 'required', notaryNote: 'Ishlatilgan avtomobilni sotish shartnomasi notarial tasdiqlanishi shart va tasdiqlangandan keyin 10 kun ichida YHXBda ro‘yxatdan o‘tkaziladi. Loyihani biz tayyorlaymiz, tasdiqlash notarius yoki e-notarius.uz’da. Salondan olingan yangi avtomobil uchun odatda talab qilinmaydi.',
    description: 'Ishlatilgan avtomobilni sotish va sotib olish. Notariusga borishdan oldin ma’lumotlarni tayyorlaydi.',
    schema: { steps: [
      { title: 'Tomonlar', fields: [
        { key: 'seller', label: 'Sotuvchi: F.I.Sh., pasport, manzil', type: 'textarea', required: true },
        { key: 'buyer', label: 'Xaridor: F.I.Sh., pasport, manzil', type: 'textarea', required: true },
      ] },
      { title: 'Avtomobil va narx', fields: [
        { key: 'car', label: 'Avtomobil: rusumi, yili, rangi, davlat raqami', type: 'textarea', required: true },
        { key: 'vin', label: 'Kuzov (VIN) raqami', type: 'text', required: true },
        { key: 'techpassport', label: 'Texnik pasport seriyasi va raqami', type: 'text', required: true },
        { key: 'price', label: 'Narx (so‘m)', type: 'money', required: true, hint: 'Shartnomada haqiqiy narxni yozing' },
      ] },
    ] },
  },
  {
    id: 'tpl-alimony', code: 'alimony_agreement', name: 'Aliment to‘lash to‘g‘risidagi kelishuv', category: 'Notarial', audience: ['client', 'lawyer'],
    notary: 'required', notaryNote: 'Aliment kelishuvi yozma tuzilib, notarial tasdiqlanishi shart. Notarial tasdiqlangan kelishuv ijro varaqasi kuchiga ega. Loyihani biz tayyorlaymiz, tasdiqlash notariusda.',
    description: 'Ota-onalar o‘rtasida bolaga aliment miqdori va to‘lash tartibi bo‘yicha kelishuv.',
    schema: { steps: [
      { title: 'Tomonlar va bola', fields: [
        { key: 'payer', label: 'To‘lovchi: F.I.Sh., pasport', type: 'textarea', required: true },
        { key: 'recipient', label: 'Oluvchi: F.I.Sh., pasport', type: 'textarea', required: true },
        { key: 'children', label: 'Bola(lar): F.I.Sh., tug‘ilgan sanasi', type: 'textarea', required: true },
      ] },
      { title: 'Aliment', fields: [
        { key: 'amount', label: 'Miqdori (summa yoki daromadning ulushi)', type: 'text', required: true },
        { key: 'schedule', label: 'To‘lash tartibi va sanasi', type: 'text', required: true, example: 'Har oyning 10-sanasigacha bank kartasiga' },
        { key: 'term', label: 'Muddati', type: 'text', required: false, example: 'Bola voyaga yetguncha' },
      ] },
    ] },
  },
  {
    id: 'tpl-lawsuit', code: 'lawsuit', name: 'Da’vo arizasi (fuqarolik ishi)', category: 'Sud', audience: ['client', 'lawyer'],
    notary: 'none', notaryNote: 'Notarius kerak emas: sudga (my.sud.uz) o‘zingiz topshirasiz.',
    description: 'Sudga pul undirish, shartnomani bekor qilish va boshqa fuqarolik talablari bilan murojaat.',
    schema: { steps: [
      { title: 'Sud va tomonlar', fields: [
        { key: 'court', label: 'Sud nomi', type: 'text', required: true, hint: 'Javobgar yashaydigan yoki joylashgan hududdagi sud', example: 'Chilonzor tumanlararo fuqarolik ishlari bo‘yicha sudi' },
        { key: 'plaintiff', label: 'Da’vogar (siz): F.I.Sh., manzil, telefon', type: 'textarea', required: true },
        { key: 'defendant', label: 'Javobgar: F.I.Sh. yoki tashkilot nomi, manzili', type: 'textarea', required: true },
      ] },
      { title: 'Holat va talab', fields: [
        { key: 'facts', label: 'Nima bo‘ldi (sanalar bilan)', type: 'textarea', required: true },
        { key: 'demand', label: 'Suddan nimani so‘raysiz', type: 'textarea', required: true, example: 'Javobgardan 12 000 000 so‘m qarzni undirish' },
        { key: 'amount', label: 'Da’vo summasi (so‘m)', type: 'money', required: false },
        { key: 'attachments', label: 'Ilovalar ro‘yxati', type: 'textarea', required: false, example: 'Shartnoma nusxasi, tilxat, talabnoma va unga javob' },
      ] },
    ] },
  },
  {
    id: 'tpl-appeal', code: 'appeal_letter', name: 'Davlat organiga murojaat (ariza)', category: 'Murojaat', audience: ['client', 'lawyer'],
    notary: 'none', notaryNote: 'Notarius kerak emas: murojaat.gov.uz yoki organning o‘ziga yuborasiz.',
    description: 'Hokimiyat, vazirlik, inspeksiya yoki boshqa davlat organiga yozma ariza yoki shikoyat.',
    schema: { steps: [
      { title: 'Kimga va kimdan', fields: [
        { key: 'to', label: 'Organ nomi va rahbar lavozimi', type: 'text', required: true, example: 'Chilonzor tumani hokimiga' },
        { key: 'from', label: 'Siz: F.I.Sh., manzil, telefon', type: 'textarea', required: true },
      ] },
      { title: 'Murojaat', fields: [
        { key: 'kind', label: 'Turi', type: 'select', required: true, options: [{ value: 'ariza', label: 'Ariza' }, { value: 'shikoyat', label: 'Shikoyat' }, { value: 'taklif', label: 'Taklif' }] },
        { key: 'facts', label: 'Vaziyat bayoni', type: 'textarea', required: true },
        { key: 'request', label: 'Nimani so‘raysiz', type: 'textarea', required: true },
      ] },
    ] },
  },
  {
    id: 'tpl-poa', code: 'power_of_attorney', name: 'Ishonchnoma', category: 'Notarial', audience: ['client', 'lawyer'],
    notary: 'conditional', notaryNote: 'Notarial tasdiqlash talab qilinadigan bitimlar (masalan uy-joy yoki avtomobilni sotish, hadya qilish) uchun ishonchnoma notarial bo‘lishi shart. Avtomobilni faqat boshqarish uchun elektron ishonchnoma yetarli. Tasdiqlash: e-notarius.uz yoki notarius.',
    description: 'Boshqa shaxsga sizning nomingizdan harakat qilish vakolati. Notarial tasdiqlash e-notarius.uz yoki notarius orqali.',
    schema: { steps: [
      { title: 'Tomonlar', fields: [
        { key: 'principal', label: 'Ishonch bildiruvchi (siz): F.I.Sh., pasport', type: 'textarea', required: true },
        { key: 'agent', label: 'Vakil: F.I.Sh., pasport', type: 'textarea', required: true },
      ] },
      { title: 'Vakolatlar', fields: [
        { key: 'powers', label: 'Vakil nima qila oladi', type: 'textarea', required: true, example: 'Mening nomimdan davlat organlariga hujjat topshirish va olish' },
        { key: 'term', label: 'Amal qilish muddati', type: 'text', required: true, example: '1 yil' },
      ] },
    ] },
  },
)

export const DRAFT_BODIES: Record<string, string> = {
  car_sale: `AVTOMOBIL OLDI-SOTDI SHARTNOMASI
(loyiha: notarial tasdiqlash uchun)

Sotuvchi: {seller}
Xaridor: {buyer}

1. Sotuvchi quyidagi avtomobilni Xaridorning mulkiga topshiradi, Xaridor uni qabul qilib, haqini to‘laydi:
{car}
Kuzov (VIN) raqami: {vin}
Texnik pasport: {techpassport}

2. Avtomobil narxi: {price} so‘m. Hisob-kitob qonunchilikda belgilangan tartibda (naqd pulsiz) amalga oshiriladi.

3. Sotuvchi avtomobil hech kimga sotilmagani, garovda va taqiq ostida emasligini kafolatlaydi.

4. Shartnoma notarial tasdiqlangan paytdan kuchga kiradi. Xaridor avtomobilni belgilangan muddatda ro‘yxatdan o‘tkazadi.

Sotuvchi: ____________        Xaridor: ____________`,
  alimony_agreement: `ALIMENT TO‘LASH TO‘G‘RISIDAGI KELISHUV
(loyiha: notarial tasdiqlash uchun)

To‘lovchi: {payer}
Oluvchi: {recipient}

Quyidagi bola(lar)ni ta’minlash uchun: {children}

1. To‘lovchi aliment to‘laydi: {amount}.
2. To‘lash tartibi: {schedule}.
3. Muddati: {term}.
4. Kelishuv tomonlarning o‘zaro roziligi bilan o‘zgartirilishi yoki bekor qilinishi mumkin.

To‘lovchi: ____________        Oluvchi: ____________`,
  lawsuit: `{court}ga

Da’vogar: {plaintiff}
Javobgar: {defendant}
Da’vo summasi: {amount} so‘m

DA’VO ARIZASI

{facts}

Yuqoridagilarga asosan suddan so‘rayman:
{demand}

Ilovalar:
{attachments}
- Davlat boji to‘langanligi haqida kvitansiya
- Da’vo arizasining javobgar uchun nusxasi

Sana: ____________   Imzo: ____________`,
  appeal_letter: `{to}

{from}

{kind}

{facts}

Shu munosabat bilan so‘rayman: {request}

Javobni yozma shaklda yuqoridagi manzilga yuborishingizni so‘rayman.

Sana: ____________   Imzo: ____________`,
  power_of_attorney: `ISHONCHNOMA

Men, {principal}, ushbu ishonchnoma bilan {agent}ga quyidagi vakolatlarni beraman:

{powers}

Ishonchnoma {term} muddatga beriladi.

Ishonch bildiruvchi: ____________

(Notarial tasdiqlash uchun e-notarius.uz yoki notariusga murojaat qiling.)`,
  rent_apartment: `KVARTIRA IJARA SHARTNOMASI

{landlordName} (pasport {landlordPassport}), keyingi o‘rinlarda «Ijaraga beruvchi», bir tomondan, va {tenantName} (pasport {tenantPassport}), keyingi o‘rinlarda «Ijarachi», ikkinchi tomondan, quyidagilar haqida ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI
1.1. Ijaraga beruvchi quyidagi manzildagi turar joyni Ijarachiga vaqtincha egalik qilish va foydalanish uchun beradi: {address}. Xonalar soni: {rooms}.

2. IJARA HAQI
2.1. Oylik ijara haqi {monthlyPrice} so‘m.
2.2. Garov summasi {deposit} so‘m.
2.3. Kommunal to‘lovlar: {utilities}.

3. MUDDAT
3.1. Shartnoma {startDate} dan {endDate} gacha amal qiladi.

4. TOMONLARNING MAJBURIYATLARI
4.1. Ijaraga beruvchi turar joyni yashash uchun yaroqli holatda topshiradi.
4.2. Ijarachi ijara haqini o‘z vaqtida to‘laydi va turar joydan maqsadga muvofiq foydalanadi.

5. TOMONLARNING IMZOLARI
Ijaraga beruvchi: ____________        Ijarachi: ____________`,
  service_agreement: `XIZMAT KO‘RSATISH SHARTNOMASI

{customer} («Buyurtmachi») va {contractor} («Ijrochi») quyidagilar haqida shartnoma tuzdilar:

1. Ijrochi quyidagi xizmatni ko‘rsatadi: {subject}.
2. Xizmat narxi: {price} so‘m.
3. Bajarish muddati: {deadline}.
4. Tomonlar o‘z majburiyatlarini lozim darajada bajaradilar.

Imzolar: ____________ / ____________`,
  claim_letter: `TALABNOMA

Kimga: {to}
Kimdan: {from}

{facts}

Yuqoridagilarga asosan talab qilaman: {demand}. Summa: {amount} so‘m.

Talab bajarilmagan taqdirda sudga murojaat qilish huquqimni saqlab qolaman.

Sana: ____________   Imzo: ____________`,
  sale_agreement: `OLDI-SOTDI SHARTNOMASI

{seller} («Sotuvchi») va {buyer} («Xaridor») quyidagilar haqida shartnoma tuzdilar:

1. Sotuvchi quyidagi mulkni Xaridorning mulkiga topshiradi: {item}.
2. Narx: {price} so‘m.
3. Mulk topshirilgan paytdan boshlab tasodifiy nobud bo‘lish xavfi Xaridorga o‘tadi.

Imzolar: ____________ / ____________`,
}

export const PLANS: T.Plan[] = [
  { code: 'client_free', audience: 'client', name: 'Bepul', description: 'Boshlash uchun', prices: [{ period: 'month', amount: 0 }],
    features: ['Kuniga 5 ta AI savol', 'Oyiga 1 ta hujjat tahlili', '1 ta hujjat yaratish', 'Qonunlar bazasi to‘liq'],
    limits: { ai_questions: { limit: 5, period: 'day' }, analyses: { limit: 1, period: 'month' }, drafts: { limit: 1, period: 'month' } }, isPopular: false },
  { code: 'client_plus', audience: 'client', name: 'Plus', description: 'Faol foydalanuvchilar uchun', prices: [{ period: 'month', amount: 49000 }, { period: 'year', amount: 470000 }],
    features: ['Cheksiz AI savol', 'Oyiga 10 ta tahlil', 'Cheksiz hujjat yaratish', 'DOCX/PDF yuklab olish', 'Batafsil javoblar'],
    limits: { ai_questions: { limit: null, period: 'day' }, analyses: { limit: 10, period: 'month' }, drafts: { limit: null, period: 'month' } }, isPopular: true },
  { code: 'client_business', audience: 'client', name: 'Biznes', description: 'Kompaniyalar uchun', prices: [{ period: 'month', amount: 199000 }, { period: 'year', amount: 1900000 }],
    features: ['Plus imkoniyatlari', 'Oyiga 50 ta tahlil', '3 ta foydalanuvchi', 'Shartnomalar ombori'],
    limits: { ai_questions: { limit: null, period: 'day' }, analyses: { limit: 50, period: 'month' }, drafts: { limit: null, period: 'month' } }, isPopular: false },
  { code: 'lawyer_free', audience: 'lawyer', name: 'Standart', description: 'Barcha yuristlar uchun', prices: [{ period: 'month', amount: 0 }],
    features: ['Komissiya 15%', '5 ta faol xizmat', 'Oyiga 20 ta taklif', 'Kuniga 20 ta AI savol'],
    limits: { services: { limit: 5, period: 'month' }, offers: { limit: 20, period: 'month' }, ai_pro_questions: { limit: 20, period: 'day' } }, isPopular: false },
  { code: 'lawyer_pro', audience: 'lawyer', name: 'Yurist Pro', description: 'Ko‘proq mijoz va kamroq komissiya', prices: [{ period: 'month', amount: 149000 }, { period: 'year', amount: 1430000 }],
    features: ['Komissiya 10%', 'Cheksiz xizmat va takliflar', 'Cheksiz AI vositalari', 'E’lonlarga 1 soat ertaroq kirish'],
    limits: { services: { limit: null, period: 'month' }, offers: { limit: null, period: 'month' }, ai_pro_questions: { limit: null, period: 'day' } }, isPopular: true },
]
