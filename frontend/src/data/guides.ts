// Bo‘limlar: free static legal guides (no AI, no backend, no sign-in).
// Each guide: what to read in the document, traps to avoid, what to prepare before going.
// Before publishing, a legal editor reviews every guide and sets reviewed: true.

export interface Guide {
  id: string; title: string; icon: string; tone: 'lapis' | 'gold' | 'teal' | 'ink'; category: string; reviewed: boolean
  short: string; situations: string[]
  read: { doc: string; items: [string, string][] }[]
  traps: [string, string][]; where: [string, string][]; bring: string[]; before?: string[]; lawyer: string[]
  laws: [string, string | null][]; caseHint?: string
}

const K = (n: number, url: string): [string, string | null] => [`Konstitutsiya, ${n}-modda`, url]
const LAW = {
  k27: K(27, 'https://lex.uz/docs/6445145#6445434'),
  k28: K(28, 'https://lex.uz/docs/6445145#6445509'),
  k29: K(29, 'https://lex.uz/docs/6445145#6445518'),
  k41: K(41, 'https://lex.uz/docs/6445145#6445574'),
  k42: K(42, 'https://lex.uz/docs/6445145#6445578'),
  k45: K(45, 'https://lex.uz/docs/6445145#6445589'),
  k46: K(46, 'https://lex.uz/docs/6445145#6445593'),
  k47: K(47, 'https://lex.uz/docs/6445145#6445597'),
  k55: K(55, 'https://lex.uz/docs/6445145#6445640'),
  k57: K(57, 'https://lex.uz/docs/6445145#6445652'),
  k76: K(76, 'https://lex.uz/docs/6445145#6445717'),
  k78: K(78, 'https://lex.uz/docs/6445145#6445724'),
}

export const GUIDES_UPDATED = '2026-11-21'
export const GUIDES: Guide[] = [
  {
    id: 'ijara', title: 'Uy-joy ijarasi', icon: 'home', tone: 'lapis', category: 'housing', reviewed: false,
    short: 'Kvartira yoki uyni ijaraga olish va berish: shartnoma, garov, to‘lovlar.',
    situations: ['Kvartira ijaraga olmoqchiman', 'Uy egasi garovni qaytarmayapti', 'Ijaradan muddatidan oldin chiqarishmoqchi'],
    read: [
      { doc: 'Ijara shartnomasi', items: [
        ['Tomonlar', 'Ijaraga beruvchi haqiqatan uy egasimi yoki egasi bergan ishonchnoma bormi: pasport va mulk hujjatidagi ism bir xil bo‘lishi kerak.'],
        ['Shartnoma predmeti', 'To‘liq manzil, xonalar soni va uydagi jihozlar ro‘yxati. Ro‘yxatda yo‘q narsa uchun keyin javob so‘ralmasin.'],
        ['Muddat', 'Boshlanish va tugash sanasi. Muddat tugagach avtomatik uzayadimi?'],
        ['Ijara haqi va to‘lov tartibi', 'Summa, valyuta, har oyning qaysi sanasigacha, qanday usulda. Narxni oshirish sharti bormi va qanchaga.'],
        ['Garov (depozit)', 'Summa, qachon va qaysi muddatda qaytariladi, qaysi hollarda ushlab qolinadi. Muddat yozilmagan bo‘lsa, yozdiring.'],
        ['Kommunal to‘lovlar', 'Kim to‘laydi, hisoblagich ko‘rsatkichlari qachondan hisoblanadi.'],
        ['Bekor qilish', 'Kim, qanday sababda va necha kun oldin yozma ogohlantirib bekor qila oladi. Faqat bir tomonga huquq bersa, e’tibor bering.'],
        ['Javobgarlik', 'Buzilgan jihoz yoki ta’mir uchun kim javob beradi.'],
      ] },
      { doc: 'Topshirish-qabul dalolatnomasi', items: [
        ['Uy holati', 'Mavjud nuqsonlar (devor, santexnika, jihozlar) yozilgan bo‘lsin. Shu hujjat garovni qaytarishda asosiy dalil bo‘ladi.'],
        ['Hisoblagichlar', 'Kirish kunidagi ko‘rsatkichlar.'],
      ] },
    ],
    traps: [
      ['Uy egasi emas, vositachi ijaraga beryapti', 'Ba’zan ijarachining o‘zi uyni boshqaga «ijaraga» beradi. Mulk hujjati va pasportni solishtiring, ishonchnoma bo‘lsa notarial tasdiqlanganini tekshiring.'],
      ['Uyni ko‘rmasdan «bron puli»', 'Uyni ko‘rmasdan va shartnomasiz oldindan pul bermang. Bu rieltorlik firibgarligining eng ko‘p uchraydigan usuli.'],
      ['Kvitansiyasiz naqd to‘lov', 'Har bir to‘lovga tilxat oling yoki bank orqali o‘tkazing. Aks holda to‘laganingizni isbotlash qiyin.'],
      ['Garovni qaytarmaslik uchun «zarar»', 'Kirish kuni surat va video oling, dalolatnomaga imzo qo‘ydiring. Chiqishda ham shunday qiling.'],
      ['Faqat og‘zaki kelishuv', 'Og‘zaki kelishuvda narx, muddat va garov bo‘yicha nizoni isbotlash juda qiyin. Har doim yozma shartnoma tuzing.'],
    ],
    where: [
      ['Notarius', 'Shartnomani notarial tasdiqlatish ikki tomonni ham himoya qiladi (majburiyligini notariusdan so‘rang).'],
      ['Soliq organi (my.soliq.uz)', 'Ijaraga beruvchi ijara daromadi va shartnomani soliq organida hisobga qo‘yishi kerakmi, tekshiring.'],
      ['Mahalla va ichki ishlar organi', 'Vaqtincha ro‘yxatdan o‘tish (propiska) masalasi.'],
    ],
    bring: ['Ikkala tomonning pasporti yoki ID kartasi', 'Uy egasidan: mulk huquqini tasdiqlovchi hujjat (kadastr ko‘chirmasi)', 'Uyning boshqa egalari bo‘lsa, ularning roziligi', 'Vakil orqali bo‘lsa, notarial ishonchnoma', 'Hisoblagich ko‘rsatkichlari va uy surati'],
    before: ['Mulk hujjatidagi egasi bilan shaxsan uchrashing', 'Shartnoma loyihasini oldindan so‘rab, uyda tinch o‘qing', 'Garov qaytarish muddatini shartnomaga yozdiring'],
    lawyer: ['Uzoq muddatli yoki tijorat (ofis, do‘kon) ijarasi', 'Katta garov yoki oldindan bir necha oylik to‘lov', 'Uy egasi muddatidan oldin chiqarib yuborishga urinmoqda'],
    laws: [LAW.k47, ['Fuqarolik kodeksi: mulk ijarasi va turar joy ijarasi boblari', null], ['Uy-joy kodeksi', null]],
  },
  {
    id: 'mulk', title: 'Uy-joy, yer va ko‘chmas mulk', icon: 'building', tone: 'ink', category: 'land', reviewed: false,
    short: 'Kvartira, uy yoki yer sotib olish va sotish: hujjatlar va xavfli joylar.',
    situations: ['Ikkilamchi bozordan kvartira olyapman', 'Yangi qurilayotgan uydan xonadon', 'Mulkni sotmoqchiman'],
    read: [
      { doc: 'Kadastr ko‘chirmasi (mulk hujjati)', items: [
        ['Egalari', 'Barcha egalar ko‘rsatilganmi: sotayotgan odam yagona egami?'],
        ['Taqiq va yuklamalar', 'Garov (ipoteka), sud taqiqi, hibsga olish bormi. Bor bo‘lsa, olib tashlanmaguncha bitim qilmang.'],
        ['Maydon va manzil', 'Hujjatdagi maydon haqiqiy maydonga mos keladimi, noqonuniy qayta qurish bormi.'],
      ] },
      { doc: 'Oldi-sotdi shartnomasi', items: [
        ['Narx', 'Shartnomada haqiqiy narx yoziladimi. Nizoda faqat shartnomadagi summani talab qila olasiz.'],
        ['To‘lov tartibi', 'Qachon, qanday usulda, qism-qism bo‘lsa jadvali. Avans yoki zakalat bo‘lsa, ularning farqi yozilsin.'],
        ['Topshirish muddati', 'Kalit va mulk qachon topshiriladi, sotuvchi qachongacha chiqib ketadi.'],
        ['Ro‘yxatda turganlar', 'Uyda doimiy ro‘yxatda turganlar bormi va ular qachongacha chiqariladi.'],
      ] },
      { doc: 'Yangi qurilish: ulushli qurilish shartnomasi', items: [
        ['Quruvchi hujjatlari', 'Qurilish ruxsatnomasi, yer uchastkasiga huquq, quruvchi kompaniya rekvizitlari.'],
        ['Topshirish muddati va jarima', 'Kechiksa quruvchi qanday javobgar bo‘ladi.'],
      ] },
    ],
    traps: [
      ['Narxni kamaytirib yozish taklifi', '«Soliq kam bo‘ladi» deb shartnomada past narx yozishni taklif qilishadi. Bitim bekor bo‘lsa, faqat yozilgan summani qaytarib olasiz.'],
      ['Voyaga yetmaganlar va boshqa merosxo‘rlar', 'Mulkda bolalar ulushi bo‘lsa, vasiylik va homiylik organi ruxsati kerak. Merosdan qolgan mulkda boshqa merosxo‘rlar keyin da’vo qilishi mumkin.'],
      ['Ishonchnoma bo‘yicha sotuv', 'Ishonchnomaning haqiqiyligini notarius orqali tekshiring, egasi bilan imkon bo‘lsa bog‘laning.'],
      ['Bitimdan oldin katta avans', 'Hujjatlar tekshirilmaguncha katta summa bermang. Bersangiz, yozma kelishuv va tilxat oling.'],
      ['Er yoki xotin roziligi yo‘q', 'Nikohda olingan mulkni sotish uchun ikkinchi turmush o‘rtog‘ining roziligi kerak bo‘lishi mumkin.'],
    ],
    where: [
      ['Notarius', 'Ko‘chmas mulk oldi-sotdisi notarial tasdiqlanadi; notarius taqiqlarni ham tekshiradi.'],
      ['Kadastr agentligi / Davlat xizmatlari markazi', 'Mulk huquqini davlat ro‘yxatidan o‘tkazish va kadastr ko‘chirmasini olish.'],
    ],
    bring: ['Tomonlarning pasporti', 'Kadastr hujjati (mulk huquqi)', 'Turmush o‘rtog‘ining roziligi (nikohda olingan mulk bo‘lsa)', 'Vasiylik va homiylik organi ruxsati (bolalar ulushi bo‘lsa)', 'Notarial ishonchnoma (vakil orqali bo‘lsa)', 'To‘lovni tasdiqlovchi hujjatlar'],
    before: ['Kadastr ko‘chirmasini yangi olib tekshiring (eski nusxaga ishonmang)', 'Kommunal qarzlar yo‘qligini tekshiring', 'Shartnoma matnini notariusdan oldindan so‘rab o‘qing'],
    lawyer: ['Yangi qurilishdan xonadon', 'Merosdan qolgan yoki ko‘p egali mulk', 'Narx juda past yoki shoshiltirishmoqda'],
    laws: [LAW.k41, LAW.k47, ['Fuqarolik kodeksi: oldi-sotdi va ko‘chmas mulk', null], ['Yer kodeksi', null]],
  },
  {
    id: 'mehnat', title: 'Mehnat munosabatlari', icon: 'briefcase', tone: 'lapis', category: 'labor', reviewed: false,
    short: 'Ishga kirish, mehnat shartnomasi, ish haqi va ta’til.',
    situations: ['Ishga kiryapman, shartnomani imzolashim kerak', 'Sinov muddati haqida', 'Ta’til va dam olish kunlari'],
    read: [
      { doc: 'Mehnat shartnomasi', items: [
        ['Lavozim va mehnat vazifasi', 'Aniq yozilsin. Keyin shartnomada yo‘q ishni majburlash qiyin bo‘ladi.'],
        ['Ish haqi', 'Summa (soliqdan oldin yoki keyin), qachon va qanday to‘lanadi, ustamalar.'],
        ['Ish vaqti va dam olish', 'Ish kuni davomiyligi, dam olish kunlari, ta’til.'],
        ['Sinov muddati', 'Bor-yo‘qligi va davomiyligi.'],
        ['Shartnoma muddati', 'Muddatli yoki muddatsiz. Muddatli bo‘lsa, sababi.'],
        ['Moddiy javobgarlik va maxfiylik', 'To‘liq moddiy javobgarlik yoki «raqobat qilmaslik» bandi bormi: bular jiddiy majburiyat.'],
      ] },
      { doc: 'Ishga qabul qilish buyrug‘i', items: [
        ['Buyruqdagi ma’lumot', 'Lavozim, ish haqi va sana shartnomadagi bilan bir xilmi.'],
      ] },
    ],
    traps: [
      ['Shartnomasiz ishlash', '«Avval sinab ko‘ramiz» deb rasmiylashtirmaslik. Bunda ish stajingiz va himoyangiz bo‘lmaydi.'],
      ['«Konvert»dagi maosh', 'Shartnomada kam summa, qolgani naqd. Nizoda faqat shartnomadagi summani undira olasiz, pensiyangiz ham kam bo‘ladi.'],
      ['Ishga kirish uchun pul so‘rash', 'O‘qitish, forma yoki «hujjat uchun» pul so‘rash firibgarlik belgisi.'],
      ['Pasportni olib qo‘yish', 'Ish beruvchi asl pasportingizni saqlab qolishga haqli emas.'],
      ['Sanasiz bo‘shatish arizasi', 'Ishga kirishda oldindan «o‘z xohishim bilan» arizasini yozdirishadi. Hech qachon yozmang.'],
    ],
    where: [
      ['Ish beruvchining kadrlar bo‘limi', 'Shartnoma va buyruqning bir nusxasini oling.'],
      ['my.gov.uz', 'Elektron mehnat daftarchangizda ishga qabul qilinganingiz qayd etilganini tekshiring.'],
    ],
    bring: ['Pasport yoki ID karta', 'Diplom va sertifikatlar', 'Mehnat daftarchasi (qog‘oz bo‘lsa)', 'Tibbiy ma’lumotnoma (lavozim talab qilsa)'],
    before: ['Shartnomani imzolashdan oldin uyga olib, tinch o‘qing', 'Ish haqi summasini shartnomada ko‘ring, og‘zaki va’daga ishonmang', 'Imzolagan nusxangizni oling'],
    lawyer: ['Raqobat qilmaslik yoki to‘liq moddiy javobgarlik bandi', 'Chet el kompaniyasi yoki masofaviy ish', 'Shartnoma chet tilida'],
    laws: [LAW.k42, LAW.k45, ['Mehnat kodeksi', null]],
  },
  {
    id: 'ishdagi-muammolar', title: 'Ishdagi muammolar', icon: 'alert', tone: 'gold', category: 'labor', reviewed: false,
    short: 'Ish haqi to‘lanmasa, ishdan bo‘shatishsa yoki bosim qilishsa.',
    situations: ['Ish haqi bir necha oydan beri berilmayapti', 'Ogohlantirmasdan ishdan bo‘shatishdi', '«O‘z xohishing bilan ket» deb bosim qilishyapti'],
    read: [
      { doc: 'Ishdan bo‘shatish buyrug‘i', items: [
        ['Bo‘shatish asosi', 'Qaysi asos bilan bo‘shatilgansiz. Asos noto‘g‘ri bo‘lsa, shu nizoning markazi bo‘ladi.'],
        ['Sana va imzo', 'Buyruq sanasi, rahbar imzosi, siz bilan tanishtirilgan sana.'],
      ] },
      { doc: 'Yakuniy hisob-kitob varaqasi', items: [
        ['To‘lovlar', 'Oxirgi ish haqi, foydalanilmagan ta’til uchun kompensatsiya va boshqa to‘lovlar ko‘rsatilganmi.'],
        ['Ushlab qolishlar', 'Nima uchun ushlab qolingan, asosi bormi.'],
      ] },
      { doc: 'Mehnat shartnomasi', items: [
        ['Ish haqi summasi', 'Talab qilinadigan summa shu yerdan hisoblanadi.'],
      ] },
    ],
    traps: [
      ['Bosim bilan «o‘z xohishim bilan» arizasi', 'Yozsangiz, keyin noqonuniy bo‘shatishni isbotlash qiyinlashadi. Majburlashsa, yozishmalar va guvohlarni saqlang.'],
      ['Buyruqni bermaslik', 'Bo‘shatish buyrug‘i nusxasini yozma so‘rang. Arizaning ikkinchi nusxasiga qabul belgisini qo‘ydiring.'],
      ['Muddatni o‘tkazib yuborish', 'Mehnat nizolari bo‘yicha murojaat muddatlari qisqa. Kechiktirmang, aniq muddatni yurist yoki mehnat inspeksiyasidan so‘rang.'],
      ['«Ertaga to‘laymiz» va’dalari', 'Har bir va’dani yozma so‘rang (xat, xabar). Og‘zaki va’da dalil emas.'],
      ['Asossiz jarima va ushlab qolish', 'Ish haqidan ushlab qolish faqat qonunda belgilangan hollarda mumkin. Asosini yozma so‘rang.'],
    ],
    where: [
      ['Ish beruvchiga yozma talabnoma', 'Ikki nusxada; ikkinchisiga qabul qilingan sana va imzo qo‘ydiring.'],
      ['Davlat mehnat inspeksiyasi', 'Ish haqi, bo‘shatish va mehnat sharoiti bo‘yicha shikoyat.'],
      ['Kasaba uyushmasi', 'Ish joyingizda bo‘lsa, a’zo sifatida yordam so‘rang.'],
      ['Sud (fuqarolik ishlari)', 'Ishga tiklash, ish haqini undirish bo‘yicha da’vo.'],
    ],
    bring: ['Pasport', 'Mehnat shartnomasi va buyruqlar nusxasi', 'Ish haqi to‘langanini ko‘rsatuvchi hujjatlar (bank ko‘chirmasi, karta tarixi)', 'Ish beruvchi bilan yozishmalar (Telegram, email)', 'Guvohlar ism-familiyasi va telefoni', 'Elektron mehnat daftarchasidan ko‘chirma'],
    before: ['Barcha yozishmalarni skrinshot qilib saqlang', 'To‘lanmagan oylar va summalarni yozib chiqing', 'Talabnomani yozma topshiring va javob muddatini belgilang'],
    lawyer: ['Ishga tiklanish kerak', 'Homiladorlik, nogironlik yoki kasallik vaqtida bo‘shatilgan', 'Katta summadagi qarzdorlik'],
    laws: [LAW.k42, LAW.k55, ['Mehnat kodeksi: mehnat shartnomasini bekor qilish va mehnat nizolari', null]],
    caseHint: 'Huquqchi platformasida «Ishlarim» bo‘limi bu yo‘lni qadamma-qadam yuritadi: summani hisoblash, talabnoma, keyingi murojaat.',
  },
  {
    id: 'pensiya', title: 'Pensiya va nafaqalar', icon: 'wallet', tone: 'teal', category: 'other', reviewed: false,
    short: 'Pensiya tayinlash, ish staji va nafaqalar.',
    situations: ['Pensiya yoshim yaqinlashyapti', 'Pensiya kam hisoblangan', 'Ish stajim to‘liq hisobga olinmagan'],
    read: [
      { doc: 'Pensiya tayinlash to‘g‘risidagi qaror yoki ma’lumotnoma', items: [
        ['Hisobga olingan staj', 'Qaysi yillar kiritilgan va qaysilari kiritilmagan.'],
        ['Hisoblash uchun ish haqi', 'Qaysi davrdagi ish haqi olingan.'],
        ['Rad javobi', 'Rad etilgan bo‘lsa, sababi va qayta murojaat tartibi yozma ko‘rsatilganmi.'],
      ] },
      { doc: 'Elektron mehnat daftarchasi / staj yozuvlari', items: [
        ['Bo‘shliqlar', 'Ishlagan, lekin yozilmagan davrlar bormi: ularni hujjat bilan tasdiqlash kerak.'],
      ] },
    ],
    traps: [
      ['«Pensiyani tezlashtiramiz» degan vositachilar', 'Pensiya tayinlash davlat xizmati, vositachiga pul to‘lash shart emas.'],
      ['Telefonda karta ma’lumotini so‘rash', '«Pensiya jamg‘armasidan» deb qo‘ng‘iroq qilib karta raqami yoki SMS kodni so‘rashadi. Hech kimga aytmang.'],
      ['Pensiya kartasini boshqaga berish', 'Kartani va PIN-kodni hech kimga bermang, qarindoshga bo‘lsa ham ehtiyot bo‘ling.'],
      ['Norasmiy ish davrlari', '«Konvert»da yoki shartnomasiz ishlagan yillar stajga kirmasligi mumkin.'],
    ],
    where: [
      ['Budjetdan tashqari Pensiya jamg‘armasi bo‘limi', 'Pensiya tayinlash va qayta hisoblash.'],
      ['Davlat xizmatlari markazi yoki my.gov.uz', 'Ariza va ma’lumotnomalar.'],
      ['Arxiv', 'Tugatilgan korxonalardagi ish stajini tasdiqlovchi ma’lumotnoma.'],
    ],
    bring: ['Pasport yoki ID karta', 'Mehnat daftarchasi (qog‘oz bo‘lsa)', 'Stajni tasdiqlovchi arxiv ma’lumotnomalari', 'Harbiy xizmat, bola parvarishi davrlari hujjatlari', 'Familiya o‘zgargan bo‘lsa, nikoh guvohnomasi'],
    before: ['Pensiya yoshidan bir necha oy oldin stajingizni tekshirib chiqing', 'Yetishmayotgan davrlar uchun arxivga oldindan so‘rov yuboring'],
    lawyer: ['Pensiya tayinlash rad etildi', 'Staj bo‘yicha nizo', 'Imtiyozli pensiya masalasi'],
    laws: [LAW.k46, ['Fuqarolarning davlat pensiya ta’minoti to‘g‘risidagi qonun', null]],
  },
  {
    id: 'ijtimoiy', title: 'Ijtimoiy himoya va «Inson» markazlari', icon: 'users', tone: 'teal', category: 'other', reviewed: false,
    short: 'Kam ta’minlangan oilalar uchun yordam, nafaqa va ijtimoiy xizmatlar.',
    situations: ['Oilamiz ijtimoiy yordamga muhtoj', 'Nafaqa rad etildi', 'Keksa ota-onam uchun ijtimoiy xizmat'],
    read: [
      { doc: 'Ariza natijasi yoki rad javobi', items: [
        ['Rad etish sababi', 'Aniq sabab yozilganmi: daromad, oila tarkibi yoki hujjat yetishmasligi.'],
        ['Oila ma’lumotlari', 'Oila tarkibi va daromadingiz to‘g‘ri kiritilganmi. Xato bo‘lsa, tuzatish so‘rang.'],
        ['Qayta murojaat', 'Qachon va qanday qayta ariza berish mumkin.'],
      ] },
    ],
    traps: [
      ['Ro‘yxatga kiritish uchun pul', 'Ijtimoiy yordam va ro‘yxatga kiritish bepul. Pul so‘ragan odam haqida xabar bering.'],
      ['Soxta qo‘ng‘iroqlar', 'Nafaqa «tasdiqlash» uchun karta raqami yoki SMS kod so‘rashadi. Davlat organlari SMS kodni so‘ramaydi.'],
      ['Noto‘g‘ri ma’lumot sabab rad', 'Ko‘pincha daromad yoki oila a’zolari noto‘g‘ri kiritiladi. Ma’lumotlaringizni tekshiring.'],
    ],
    where: [
      ['«Inson» ijtimoiy xizmatlar markazi', 'Tuman yoki shahardagi markaz: ijtimoiy yordam va xizmatlar.'],
      ['Mahalla', 'Ijtimoiy xodim va hokim yordamchisi: oila holatini o‘rganish.'],
      ['my.gov.uz', 'Onlayn ariza va holatni kuzatish.'],
    ],
    bring: ['Oila a’zolarining pasporti yoki ID kartasi', 'Bolalarning tug‘ilganlik guvohnomasi', 'Daromad haqidagi ma’lumotnomalar', 'Nogironlik yoki kasallik hujjatlari (bo‘lsa)', 'Uy-joy hujjati'],
    before: ['Oila a’zolari va daromadlar ro‘yxatini yozib oling', 'Ariza raqami va sanasini saqlab qo‘ying'],
    lawyer: ['Bir necha marta asossiz rad etilgan', 'Uy-joy yoki vasiylik bilan bog‘liq murakkab holat'],
    laws: [LAW.k46, LAW.k57],
  },
  {
    id: 'nogironlik', title: 'Nogironligi bo‘lgan shaxslarga imtiyozlar', icon: 'access', tone: 'lapis', category: 'other', reviewed: false,
    short: 'Nogironlikni belgilash, qayta ko‘rik, pensiya va imtiyozlar.',
    situations: ['Nogironlik guruhini rasmiylashtirish', 'Qayta ko‘rik muddati keldi', 'Imtiyozlardan foydalana olmayapman'],
    read: [
      { doc: 'Tibbiy-ijtimoiy ekspertiza xulosasi', items: [
        ['Guruh va sabab', 'Belgilangan guruh va nogironlik sababi.'],
        ['Muddat', 'Qancha muddatga belgilangan, qayta ko‘rik sanasi qachon.'],
        ['Tavsiyalar', 'Reabilitatsiya, mehnat sharoiti va yordamchi vositalar bo‘yicha tavsiyalar.'],
      ] },
    ],
    traps: [
      ['«Guruh olib beramiz» deb pul so‘rash', 'Bu jinoyat. Ekspertiza bepul va faqat tibbiy hujjatlar asosida o‘tkaziladi.'],
      ['Qayta ko‘rik muddatini o‘tkazib yuborish', 'Muddat o‘tsa, to‘lovlar to‘xtashi mumkin. Sanani oldindan belgilab qo‘ying.'],
      ['Imtiyozni rasmiylashtirmaslik', 'Ko‘p imtiyozlar (transport, kommunal, soliq) avtomatik berilmaydi. Ariza kerak bo‘lishi mumkin.'],
    ],
    where: [
      ['Oilaviy poliklinika', 'Ekspertizaga yo‘llanma.'],
      ['Tibbiy-ijtimoiy ekspert komissiyasi', 'Nogironlikni belgilash va qayta ko‘rik.'],
      ['«Inson» markazi va Pensiya jamg‘armasi', 'Nafaqa, pensiya va ijtimoiy xizmatlar.'],
    ],
    bring: ['Pasport yoki ID karta', 'Tibbiy hujjatlar: kasallik tarixi, ko‘chirmalar, tahlillar', 'Oldingi ekspertiza xulosasi (qayta ko‘rikda)', 'Ishlasangiz, ish joyidan tavsifnoma'],
    before: ['Barcha tibbiy hujjatlarni bitta papkaga yig‘ing', 'Qayta ko‘rik sanasini kalendarga yozing'],
    lawyer: ['Ekspertiza xulosasiga roziman emas', 'Ish joyida kamsitish yoki ishdan bo‘shatish'],
    laws: [LAW.k57, ['Nogironligi bo‘lgan shaxslarning huquqlari to‘g‘risidagi qonun', null]],
  },
  {
    id: 'meros', title: 'Oilaviy huquqlar va meros', icon: 'scroll', tone: 'gold', category: 'inheritance', reviewed: false,
    short: 'Merosni qabul qilish, vasiyatnoma va oiladagi mulk.',
    situations: ['Yaqinim vafot etdi, meros qanday rasmiylashtiriladi', 'Vasiyatnoma bor', 'Merosxo‘rlar o‘rtasida nizo'],
    read: [
      { doc: 'Vasiyatnoma', items: [
        ['Notarial tasdiq va sana', 'Notarius tasdiqlaganmi. Bir nechta vasiyatnoma bo‘lsa, odatda oxirgisi kuchda bo‘ladi.'],
        ['Kimga va nima qoldirilgan', 'Mulk va merosxo‘rlar aniq ko‘rsatilganmi.'],
      ] },
      { doc: 'Meros to‘g‘risidagi guvohnoma', items: [
        ['Merosxo‘rlar va ulushlar', 'Barcha merosxo‘rlar kiritilganmi, ulushlar to‘g‘rimi.'],
        ['Mulk ro‘yxati', 'Uy, avtomobil, bank hisoblari: qaysilari kiritilgan.'],
      ] },
    ],
    traps: [
      ['Merosni qabul qilish muddatini o‘tkazish', 'Merosni qonunda belgilangan muddatda qabul qilish kerak (odatda meros ochilgan kundan 6 oy). Notariusga kechiktirmasdan murojaat qiling.'],
      ['Merosxo‘rni «unutib» guvohnoma olish', 'Ba’zan bir merosxo‘r boshqalarni ko‘rsatmasdan guvohnoma oladi. Notariusga barcha merosxo‘rlar haqida ma’lumot bering.'],
      ['Majburiy ulush', 'Voyaga yetmagan bolalar va mehnatga layoqatsiz qarindoshlar vasiyatda bo‘lmasa ham ulush olish huquqiga ega bo‘lishi mumkin.'],
      ['Bosim ostida merosdan voz kechish', 'Voz kechish arizasi qaytarib bo‘lmaydigan oqibatga ega bo‘lishi mumkin. Shoshilmang.'],
      ['Qarzlar ham meros bo‘ladi', 'Marhumning qarzlari ham merosxo‘rlarga o‘tishi mumkin. Mulk va qarzlarni birga baholang.'],
    ],
    where: [
      ['Notarius', 'Meros ochilgan joydagi (marhumning oxirgi yashash joyi) notarius.'],
      ['FHDYo organi', 'O‘lim va qarindoshlik guvohnomalari.'],
    ],
    bring: ['O‘lim to‘g‘risidagi guvohnoma', 'Qarindoshlikni tasdiqlovchi hujjatlar (tug‘ilganlik, nikoh guvohnomalari)', 'Merosxo‘rning pasporti', 'Marhumning oxirgi yashash joyi haqida ma’lumotnoma', 'Mulk hujjatlari (kadastr, avtomobil texpasporti, bank ma’lumotlari)', 'Vasiyatnoma (bo‘lsa)'],
    before: ['Barcha merosxo‘rlar ro‘yxatini tuzing', 'Marhumning mulki va qarzlari ro‘yxatini tuzing', 'Notariusga imkon qadar erta boring'],
    lawyer: ['Merosxo‘rlar o‘rtasida nizo', 'Vasiyatnomaga e’tiroz', 'Muddat o‘tib ketgan'],
    laws: [LAW.k41, LAW.k76, ['Fuqarolik kodeksi: meros huquqi bo‘limi', null], ['Oila kodeksi', null]],
  },
  {
    id: 'ajrim-aliment', title: 'Nikohni bekor qilish va aliment', icon: 'family', tone: 'lapis', category: 'family', reviewed: false,
    short: 'Ajrim, bolalar kim bilan qolishi, aliment va mulkni bo‘lish.',
    situations: ['Ajrashmoqchimiz', 'Aliment to‘lanmayapti', 'Bola bilan uchrashishga ruxsat berishmayapti'],
    read: [
      { doc: 'Sud qarori', items: [
        ['Bolalar masalasi', 'Bolalar kim bilan qoladi, ikkinchi ota-ona bilan uchrashish tartibi.'],
        ['Aliment', 'Miqdori (ulush yoki qat’iy summa) va qachondan to‘lanadi.'],
        ['Mulk', 'Umumiy mulk bo‘lingan bo‘lsa, kimga nima o‘tadi.'],
        ['Shikoyat muddati', 'Qarorga rozi bo‘lmasangiz, qancha muddatda shikoyat qilish mumkin.'],
      ] },
      { doc: 'Aliment to‘g‘risidagi kelishuv', items: [
        ['Notarial tasdiq', 'Notarial tasdiqlangan kelishuv to‘lanmasa, majburiy ijroga berilishi mumkin.'],
        ['Summa va muddat', 'Miqdor, to‘lov kuni va indeksatsiya.'],
      ] },
    ],
    traps: [
      ['Faqat og‘zaki kelishuv', 'Og‘zaki va’da bilan aliment undirib bo‘lmaydi. Notarial kelishuv yoki sud qarori kerak.'],
      ['Daromadni yashirish', 'Rasmiy daromad kam ko‘rsatilsa, aliment ham kam bo‘ladi. Haqiqiy daromad dalillarini yig‘ing.'],
      ['Ajrimdan oldin mulkni sotib yuborish', 'Umumiy mulkni sotishga urinishsa, tezroq yuristga murojaat qiling.'],
      ['Uchrashish tartibi yozilmagan', 'Bola bilan uchrashish tartibini yozma belgilatmasangiz, keyin nizo ko‘payadi.'],
      ['«Tez ajrashtirib beramiz» degan vositachilar', 'Ajrim tartibi qonunda belgilangan. Vositachiga pul to‘lashdan oldin uning maqomini tekshiring.'],
    ],
    where: [
      ['FHDYo organi', 'Ikki tomon rozi va umumiy voyaga yetmagan bolalar bo‘lmasa, nikoh FHDYo orqali bekor qilinishi mumkin.'],
      ['Sud', 'Bolalar bo‘lsa, nizo bo‘lsa yoki bir tomon rozi bo‘lmasa.'],
      ['Majburiy ijro byurosi', 'Aliment qarori yoki kelishuvi bajarilmasa, undirish.'],
    ],
    bring: ['Pasport', 'Nikoh guvohnomasi', 'Bolalarning tug‘ilganlik guvohnomasi', 'Ikkinchi tomonning daromadi haqida ma’lumot (bo‘lsa)', 'Umumiy mulk hujjatlari', 'Davlat boji to‘lov kvitansiyasi (sudga)'],
    before: ['Umumiy mulk ro‘yxatini tuzing', 'Bola xarajatlarini (maktab, davolanish) hujjatlari bilan yig‘ing'],
    lawyer: ['Bolalar kim bilan qolishi bo‘yicha nizo', 'Katta mulkni bo‘lish', 'Chet elda yashovchi turmush o‘rtog‘i'],
    laws: [LAW.k76, LAW.k78, ['Oila kodeksi: nikohni bekor qilish va aliment majburiyatlari', null]],
  },
  {
    id: 'migratsiya', title: 'Xorijda ishlash va migrantlar huquqlari', icon: 'globe', tone: 'teal', category: 'migration', reviewed: false,
    short: 'Chet elga ishga ketishdan oldin: shartnoma, agentlik, hujjatlar.',
    situations: ['Chet elga ishga ketmoqchiman', 'Agentlik orqali ish taklifi keldi', 'Chet elda ish beruvchi maosh bermayapti'],
    read: [
      { doc: 'Chet eldagi ish beruvchi bilan mehnat shartnomasi', items: [
        ['Ish beruvchi', 'Kompaniya nomi, manzili va mamlakati: internetda tekshiring.'],
        ['Lavozim va ish haqi', 'Summa, valyuta, to‘lov tartibi, ish soatlari.'],
        ['Turar joy va sug‘urta', 'Kim ta’minlaydi va kim to‘laydi.'],
        ['Yo‘l xarajatlari', 'Chiptani kim oladi, qaytish qanday.'],
        ['Til', 'Shartnoma siz tushunadigan tilda bo‘lsin yoki tarjimasi bo‘lsin.'],
      ] },
      { doc: 'Vositachi agentlik bilan shartnoma', items: [
        ['Xizmat narxi', 'Nima uchun qancha to‘laysiz, ish bo‘lmasa pul qaytariladimi.'],
        ['Litsenziya', 'Agentlikning litsenziya raqami ko‘rsatilganmi.'],
      ] },
    ],
    traps: [
      ['Litsenziyasiz agentliklar', 'Xorijga ishga yuborish litsenziya talab qiladi. Agentlik litsenziyasini rasmiy manbada tekshiring.'],
      ['Turist vizasi bilan ishga yuborish', 'Ish vizasisiz ishlash deportatsiya va kirish taqiqiga olib kelishi mumkin.'],
      ['Pasportni olib qo‘yish', 'Ish beruvchi yoki vositachi pasportingizni olib qo‘ysa, bu odam savdosi belgisi. Darhol elchixonaga murojaat qiling.'],
      ['Oldindan katta to‘lov', 'Ish va hujjatlar tayyor bo‘lmaguncha katta summa bermang.'],
      ['Faqat chet tilidagi shartnoma', 'Tushunmagan hujjatga imzo qo‘ymang.'],
    ],
    where: [
      ['Tashqi mehnat migratsiyasi agentligi', 'Rasmiy ish takliflari, agentliklarni tekshirish, ketishdan oldin maslahat.'],
      ['O‘zbekistonning chet eldagi elchixonasi yoki konsulligi', 'Chet elda muammo bo‘lsa.'],
    ],
    bring: ['Xorijga chiqish pasporti', 'Diplom va sertifikatlar (tarjima va apostil talab qilinishi mumkin)', 'Tibbiy ma’lumotnoma', 'Shartnoma nusxasi (bir nusxasini qarindoshlarda qoldiring)', 'Elchixona va konsullik kontaktlari'],
    before: ['Pasport va shartnomaning suratini qarindoshlarga yuboring', 'Ish beruvchi haqida mustaqil ma’lumot qidiring', 'Borgan mamlakatdagi elchixona manzilini yozib oling'],
    lawyer: ['Agentlik pul olib, ish bermadi', 'Chet elda ish haqi to‘lanmadi yoki hujjat olib qo‘yildi'],
    laws: [LAW.k42, ['Tashqi mehnat migratsiyasi to‘g‘risidagi qonun', null]],
  },
  {
    id: 'istemolchi', title: 'Iste’molchi huquqlari', icon: 'cart', tone: 'gold', category: 'consumer', reviewed: false,
    short: 'Sifatsiz tovar, onlayn xarid, xizmat ko‘rsatish va kafolat.',
    situations: ['Tovar buzildi, do‘kon qaytarib olmayapti', 'Onlayn to‘ladim, tovar kelmadi', 'Xizmat sifatsiz bajarildi'],
    read: [
      { doc: 'Chek va kafolat taloni', items: [
        ['Sana va summa', 'Xarid sanasi va narxi: talab muddatlari shundan hisoblanadi.'],
        ['Kafolat muddati va shartlari', 'Qancha muddat, qaysi holatlar kafolatdan chiqariladi.'],
        ['Servis markazi', 'Kafolat ta’miri qayerda.'],
      ] },
      { doc: 'Onlayn oferta yoki xizmat shartnomasi', items: [
        ['Qaytarish va bekor qilish', 'Qaysi muddatda va qanday qaytarish mumkin.'],
        ['Yetkazib berish', 'Muddat, kim javob beradi, kechiksa nima bo‘ladi.'],
        ['Sotuvchi rekvizitlari', 'Yuridik nomi, STIR, manzil: nizoda kerak bo‘ladi.'],
      ] },
    ],
    traps: [
      ['«Sotilgan tovar qaytarilmaydi» yozuvi', 'Do‘kondagi yozuv qonundagi iste’molchi huquqlaringizni bekor qilmaydi.'],
      ['Chek olmaslik', 'Chek eng muhim dalil. Har doim oling va saqlang (elektron chek ham bo‘ladi).'],
      ['«Foizsiz» nasiyada yashirin to‘lovlar', 'Umumiy summani va jadvalni yozma so‘rang.'],
      ['Soxta onlayn do‘konlar', 'Noma’lum sahifaga to‘liq oldindan to‘lamang, sotuvchi rekvizitlarini tekshiring.'],
      ['Kafolat ta’mirini cho‘zish', 'Tovar topshirilgan sanani yozma qayd ettiring.'],
    ],
    where: [
      ['Sotuvchiga yozma talabnoma', 'Ikki nusxada, ikkinchisiga qabul belgisi bilan.'],
      ['Raqobatni rivojlantirish va iste’molchilar huquqlarini himoya qilish qo‘mitasi', 'Sotuvchi talabni bajarmasa, shikoyat.'],
      ['Sud', 'Pulni qaytarish va zararni undirish.'],
    ],
    bring: ['Chek', 'Kafolat taloni', 'Tovarning o‘zi (qaytarishda)', 'Nuqson surati va videosi', 'Sotuvchi bilan yozishmalar'],
    before: ['Nuqsonni sana bilan suratga oling', 'Talabnomada aniq talab yozing: pulni qaytarish, almashtirish yoki ta’mirlash'],
    lawyer: ['Katta summadagi tovar (avtomobil, texnika)', 'Sog‘liqqa zarar yetgan'],
    laws: [LAW.k55, ['Iste’molchilarning huquqlarini himoya qilish to‘g‘risidagi qonun', null]],
    caseHint: 'Huquqchi platformasida talabnomani shablon asosida bepul tayyorlash mumkin.',
  },
  {
    id: 'kredit', title: 'Kredit, nasiya va qarz', icon: 'card', tone: 'ink', category: 'civil', reviewed: false,
    short: 'Bank krediti, mikroqarz, kafillik va qarz tilxati.',
    situations: ['Kredit olmoqchiman', 'Tanishimga qarz berdim, qaytarmayapti', 'Mening nomimga kredit olishgan'],
    read: [
      { doc: 'Kredit shartnomasi', items: [
        ['Yillik foiz va to‘liq qiymat', 'Faqat foiz emas: barcha komissiya va to‘lovlar bilan umumiy qancha to‘laysiz.'],
        ['To‘lov jadvali', 'Har oy qancha, qaysi sanada.'],
        ['Muddatidan oldin to‘lash', 'Jarimasiz yopish mumkinmi.'],
        ['Kechikish jarimasi', 'Penya qanday hisoblanadi.'],
        ['Garov va kafillik', 'Nima garovga qo‘yiladi, kim kafil.'],
        ['Sug‘urta', 'Majburiymi, narxi qancha.'],
      ] },
      { doc: 'Qarz tilxati (shaxslar o‘rtasida)', items: [
        ['Summa va valyuta', 'Raqam va so‘z bilan.'],
        ['Qaytarish muddati', 'Aniq sana.'],
        ['Tomonlar', 'Pasport ma’lumotlari va imzolar, iloji bo‘lsa guvohlar.'],
      ] },
    ],
    traps: [
      ['O‘z nomingizga boshqaga kredit olib berish', 'Bank uchun qarzdor sizsiz. U to‘lamasa, siz to‘laysiz va kredit tarixingiz buziladi.'],
      ['Kafil bo‘lish', 'Qarzdor to‘lamasa, qarz kafildan undirilishi mumkin. Imzolashdan oldin o‘ylang.'],
      ['Onlayn mikroqarz ilovalari', 'Telefoningizdagi kontaktlar va suratlarga ruxsat so‘raydigan ilovalardan ehtiyot bo‘ling.'],
      ['SMS kodni aytish', 'Bank xodimi SMS kodni hech qachon so‘ramaydi. Kod so‘ralsa, bu firibgarlik.'],
      ['Tilxatsiz qarz', 'Katta summani tilxatsiz yoki bank o‘tkazmasisiz bermang.'],
    ],
    where: [
      ['Bank filiali', 'Shartnoma, to‘lov jadvali va kredit qoldig‘i.'],
      ['Markaziy bank', 'Bank xizmati ustidan shikoyat.'],
      ['Kredit-axborot tahliliy markazi (KATM)', 'Kredit tarixingizni va nomingizdagi kreditlarni tekshirish.'],
      ['Ichki ishlar organi', 'Nomingizga firibgarlik yo‘li bilan kredit olingan bo‘lsa.'],
    ],
    bring: ['Pasport yoki ID karta', 'Daromad haqida ma’lumotnoma', 'Garov hujjatlari (bo‘lsa)', 'Qarz tilxati va o‘tkazma cheklari (qarz bo‘yicha nizoda)'],
    before: ['Kredit tarixingizni tekshiring', 'Bir necha bankning to‘liq qiymatini solishtiring', 'Shartnoma nusxasini oling'],
    lawyer: ['Garovdagi uy-joyni olib qo‘yish tahdidi', 'Nomingizga firibgarlik bilan kredit', 'Katta summadagi qarz nizosi'],
    laws: [LAW.k41, ['Fuqarolik kodeksi: qarz va kredit', null]],
  },
  {
    id: 'korrupsiya', title: 'Korrupsiyaga qarshi kurashish', icon: 'shield', tone: 'gold', category: 'administrative', reviewed: false,
    short: 'Davlat xizmatida pora so‘rashsa yoki ishni sun’iy cho‘zishsa.',
    situations: ['Xizmatni tezlashtirish uchun pul so‘rashdi', 'Arizam sababsiz cho‘zilyapti', 'Vositachi «tanishim bor» deyapti'],
    read: [
      { doc: 'Davlat xizmatining rasmiy tartibi', items: [
        ['Rasmiy narx (davlat boji)', 'my.gov.uz yoki idora saytida ko‘rsatilgan rasmiy summa. Undan ortiq to‘lov asossiz.'],
        ['Muddat', 'Xizmat qancha kunda ko‘rsatilishi kerak.'],
      ] },
      { doc: 'Rad javobi', items: [
        ['Yozma sabab', 'Rad javobi yozma va sababi bilan berilishini so‘rang.'],
      ] },
    ],
    traps: [
      ['«Tezlashtirish uchun» norasmiy to‘lov', 'Pora berish ham javobgarlikka sabab bo‘ladi. Faqat rasmiy kvitansiya bilan to‘lang.'],
      ['«Tanishim bor» vositachilar', 'Ko‘pincha pulni olib, hech narsa qilmaydi. Davlat xizmatlarini o‘zingiz rasmiy rasmiylashtiring.'],
      ['Kvitansiyasiz to‘lov', 'Har bir rasmiy to‘lov uchun kvitansiya yoki elektron chek bo‘ladi.'],
    ],
    where: [
      ['Korrupsiyaga qarshi kurashish agentligi', 'Korrupsiya holatlari haqida xabar berish.'],
      ['Prokuratura', 'Mansabdor shaxsning noqonuniy harakati ustidan.'],
      ['Idora rahbariyati va ishonch telefonlari', 'Ichki shikoyat.'],
    ],
    bring: ['Voqea sanasi, vaqti va joyi', 'Mansabdor shaxsning ismi va lavozimi', 'Dalillar: yozishmalar, qonuniy yo‘l bilan olingan yozuvlar', 'Guvohlar'],
    before: ['Xizmatning rasmiy narxi va muddatini oldindan bilib oling', 'Ariza raqami va sanasini saqlang'],
    lawyer: ['Sizdan ko‘rsatma so‘ralmoqda yoki ish qo‘zg‘atilgan', 'Xabar berganingiz uchun bosim'],
    laws: [LAW.k55, ['Korrupsiyaga qarshi kurashish to‘g‘risidagi qonun', null]],
  },
  {
    id: 'huquq-organlari', title: 'Politsiya, tergov va ushlanganda', icon: 'stamp', tone: 'ink', category: 'criminal', reviewed: false,
    short: 'Chaqiruv, so‘roq, bayonnoma va ushlash: huquqlaringiz.',
    situations: ['Politsiyaga chaqirishdi', 'Yaqinim ushlandi', 'Bayonnomaga imzo qo‘yishni so‘rashyapti'],
    read: [
      { doc: 'Chaqiruv qog‘ozi', items: [
        ['Kim va nima uchun chaqiryapti', 'Organ nomi, tergovchi, manzil, sana va vaqt.'],
        ['Maqomingiz', 'Guvoh, gumonlanuvchi yoki ayblanuvchi sifatida: huquqlaringiz shunga bog‘liq.'],
      ] },
      { doc: 'Bayonnoma (so‘roq, ushlash, tintuv)', items: [
        ['To‘liq matn', 'Imzolashdan oldin har bir sahifani o‘qing. Aytmagan gapingiz yozilmaganini tekshiring.'],
        ['E’tirozlar', 'Rozi bo‘lmasangiz, «e’tirozim bor» deb o‘z qo‘lingiz bilan yozing.'],
        ['Vaqt va asos', 'Ushlash vaqti va asosi ko‘rsatilganmi.'],
      ] },
    ],
    traps: [
      ['Advokatsiz ko‘rsatma berishga undash', 'Malakali yuridik yordam olish huquqingiz kafolatlangan. Advokat talab qiling.'],
      ['O‘qimasdan imzolash', '«Hammasi standart, imzolang» deyishsa ham o‘qimasdan imzolamang.'],
      ['«Imzolasang qo‘yib yuboramiz»', 'Va’da evaziga imzolangan hujjat sizga qarshi dalil bo‘lishi mumkin.'],
      ['«Ishni yopamiz» evaziga pul', 'Bu firibgarlik yoki pora. Advokat bilan maslahatlashing.'],
    ],
    where: [
      ['Advokat', 'Advokatlar palatasi orqali yoki ishonchli advokat. Huquqchi platformasida tasdiqlangan advokatlar bor.'],
      ['Prokuratura', 'Tergov organining noqonuniy harakati ustidan shikoyat.'],
      ['Favqulodda yordam: 102', 'Xavf ostida bo‘lsangiz.'],
    ],
    bring: ['Pasport', 'Chaqiruv qog‘ozi', 'Advokatning telefon raqami', 'Yaqinlaringizga qayerga va nima uchun borayotganingizni ayting'],
    before: ['Borishdan oldin advokat bilan maslahatlashing', 'Maqomingizni (guvoh yoki gumonlanuvchi) aniqlang'],
    lawyer: ['Gumonlanuvchi yoki ayblanuvchi sifatida chaqirilsangiz: har doim', 'Ushlash, tintuv yoki mol-mulkni olib qo‘yish'],
    laws: [LAW.k27, LAW.k28, LAW.k29, ['Jinoyat-protsessual kodeksi', null]],
  },
  {
    id: 'xotin-qizlar', title: 'Xotin-qizlar himoyasi va tazyiq', icon: 'heart', tone: 'gold', category: 'family', reviewed: false,
    short: 'Oilaviy zo‘ravonlik, tazyiq va himoya orderi.',
    situations: ['Oilada zo‘ravonlik bor', 'Ishda tazyiq qilishyapti', 'Himoya orderi qanday olinadi'],
    read: [
      { doc: 'Himoya orderi', items: [
        ['Kimga nisbatan', 'Tajovuzkorning ma’lumotlari to‘g‘ri yozilganmi.'],
        ['Cheklovlar', 'Unga nima taqiqlangan: yaqinlashish, bog‘lanish va boshqalar.'],
        ['Muddat', 'Qancha muddatga berilgan va qanday uzaytiriladi.'],
      ] },
    ],
    traps: [
      ['«Oilaviy masala» deb arizani qabul qilmaslik', 'Arizani yozma topshiring va qabul qilingani haqida belgi so‘rang.'],
      ['Tibbiy ko‘rikni kechiktirish', 'Jarohatlar tez o‘tadi: tibbiy ko‘rikdan imkon qadar tez o‘ting, bu asosiy dalil.'],
      ['Bosim ostida arizani qaytarib olish', 'Qarindoshlar bosimi bilan arizadan voz kechmang, avval maslahatlashing.'],
    ],
    where: [
      ['Favqulodda: 102', 'Hozir xavf ostida bo‘lsangiz.'],
      ['Ichki ishlar organi (profilaktika inspektori)', 'Ariza va himoya orderi.'],
      ['«Inson» markazlari va reabilitatsiya markazlari', 'Psixologik, huquqiy va boshpana yordami.'],
      ['Mahalla', 'Profilaktika va yordam.'],
    ],
    bring: ['Pasport', 'Tibbiy hujjatlar va ko‘rik xulosasi', 'Suratlar, yozishmalar, audio', 'Guvohlar'],
    before: ['Muhim hujjatlaringiz nusxasini xavfsiz joyda saqlang', 'Ishonchli odamga vaziyat haqida ayting'],
    lawyer: ['Ajrim, bolalar va uy-joy masalasi bilan birga', 'Takroriy zo‘ravonlik'],
    laws: [LAW.k27, LAW.k76, ['Xotin-qizlarni tazyiq va zo‘ravonlikdan himoya qilish to‘g‘risidagi qonun', null]],
  },
  {
    id: 'talim', title: 'Ta’lim va kontrakt', icon: 'grad', tone: 'teal', category: 'other', reviewed: false,
    short: 'OTM, kollej va o‘quv markazlari bilan shartnomalar.',
    situations: ['Kontrakt asosida o‘qishga kirdim', 'O‘quv markazi pulni qaytarmayapti', 'Chet el universiteti filiali'],
    read: [
      { doc: 'To‘lov-kontrakt shartnomasi', items: [
        ['Narx va to‘lov muddatlari', 'Yillik summa, qism-qism to‘lash, kechiksa nima bo‘ladi.'],
        ['Narx o‘zgarishi', 'O‘qish davomida narx oshishi mumkinmi va qanday tartibda.'],
        ['Chetlatish va qaytarish', 'O‘qishdan chiqsangiz yoki chetlatilsangiz, to‘langan pul qaytariladimi.'],
        ['Akademik ta’til va ko‘chirish', 'Shartlari.'],
      ] },
      { doc: 'O‘quv markazi shartnomasi', items: [
        ['Litsenziya', 'Ta’lim xizmati uchun litsenziya yoki ruxsat bormi.'],
        ['Qaytarish siyosati', 'Darsga bormasangiz yoki to‘xtatsangiz, pul qaytariladimi.'],
      ] },
    ],
    traps: [
      ['Litsenziyasiz OTM yoki filial', 'Diplom tan olinmasligi mumkin. Litsenziyani rasmiy reyestrda tekshiring.'],
      ['«Grantga kiritib qo‘yaman» degan vositachi', 'Qabul natijalari rasmiy tizim orqali e’lon qilinadi. Pul so‘rash firibgarlik.'],
      ['Yashirin to‘lovlar', 'Yotoqxona, kitob, imtihon uchun alohida to‘lovlarni oldindan so‘rang.'],
    ],
    where: [
      ['OTM qabul komissiyasi', 'Shartnoma va to‘lov rekvizitlari.'],
      ['Bilim va malakalarni baholash agentligi', 'Qabul jarayoni va natijalar.'],
      ['my.gov.uz', 'Ta’lim muassasasi va litsenziyani tekshirish.'],
    ],
    bring: ['Pasport', 'Attestat yoki diplom', 'Sertifikatlar', 'Rasm', 'Tibbiy ma’lumotnoma (talab qilinsa)'],
    before: ['Muassasa litsenziyasini tekshiring', 'To‘lovni faqat shartnomadagi rasmiy rekvizitlarga qiling'],
    lawyer: ['Asossiz chetlatish', 'Katta summani qaytarish nizosi'],
    laws: [['Ta’lim to‘g‘risidagi qonun', null]],
  },
  {
    id: 'notarius', title: 'Notarius kerakmi?', icon: 'stamp', tone: 'gold', category: 'civil', reviewed: false,
    short: 'Qaysi hujjat notarial tasdiqlanishi shart, qaysini o‘zingiz tuzsangiz bo‘ladi.',
    situations: ['Uy yoki avtomobil sotyapman', 'Ijara shartnomasini notariusga olib borish kerakmi', 'Ishonchnoma kerak'],
    read: [
      { doc: 'Notarial tasdiqlash SHART bo‘lgan hujjatlar', items: [
        ['Uy-joyni boshqaga o‘tkazish', 'Uy, kvartira yoki uning qismini sotish, hadya qilish, ayirboshlash: mulk joylashgan hududdagi notarius tasdiqlaydi.'],
        ['Ishlatilgan avtomobil oldi-sotdisi', 'Oldi-sotdi, ayirboshlash, hadya notarial tasdiqlanadi va 10 kun ichida YHXBda ro‘yxatdan o‘tkaziladi. Salondan yangi avtomobil uchun odatda talab qilinmaydi.'],
        ['Vasiyatnoma', 'Notarius tasdiqlaydi.'],
        ['Nikoh shartnomasi', 'Yozma tuziladi va notarial tasdiqlanadi (davlat boji olinmaydi).'],
        ['Aliment to‘lash to‘g‘risidagi kelishuv', 'Notarial tasdiqlanadi; tasdiqlangan kelishuv ijro varaqasi kuchiga ega.'],
        ['Mulkni sotish uchun ishonchnoma', 'Notarial shakl talab qilinadigan bitimlar uchun ishonchnoma ham notarial bo‘ladi. Avtomobilni faqat boshqarish uchun elektron ishonchnoma yetarli.'],
        ['Meros guvohnomasi', 'Notarius beradi.'],
      ] },
      { doc: 'O‘zingiz tuzsangiz bo‘ladigan hujjatlar (oddiy yozma shakl)', items: [
        ['Uy-joy ijarasi va tekin foydalanish', '2019-yildagi notariat islohoti bilan majburiy notarial tasdiqlash bekor qilingan. Ijara daromadini soliq organida hisobga qo‘yish masalasini alohida tekshiring.'],
        ['Mehnat va xizmat ko‘rsatish shartnomalari', 'Tomonlar imzolaydi.'],
        ['Ko‘char mulk oldi-sotdisi', 'Avtomobildan tashqari: texnika, jihozlar va boshqalar.'],
        ['Talabnoma, da’vo arizasi, davlat organiga murojaat', 'Bular shartnoma emas: o‘zingiz imzolab, topshirasiz yoki yuborasiz.'],
        ['Qarz tilxati va dalolatnomalar', 'Yozma shakl yetarli; katta summada notarial tasdiqlatish ixtiyoriy, lekin dalil sifatida kuchliroq.'],
      ] },
    ],
    traps: [
      ['«Notariussiz ham bo‘laveradi» degan sotuvchi', 'Notarial shakl shart bo‘lgan bitimni oddiy yozma tuzsangiz, u haqiqiy hisoblanmasligi mumkin. Pul bersangiz, qaytarib olish qiyin.'],
      ['Faqat ishonchnoma bilan avtomobil «sotib olish»', 'Ishonchnoma mulk huquqini bermaydi. Avtomobilni oldi-sotdi shartnomasi bilan sotib oling.'],
      ['Notariusdan oldin pul berish', 'Bitim notarial tasdiqlanmaguncha to‘liq summani bermang.'],
      ['Shartnomada past narx yozish', 'Nizoda faqat shartnomadagi summani talab qila olasiz.'],
    ],
    where: [
      ['Notarius', 'Davlat yoki xususiy notarius. Navbatga my.gov.uz orqali yozilish mumkin.'],
      ['e-notarius.uz', 'Ayrim notarial harakatlar onlayn: OneID, Face-ID, ERI yoki SMS bilan imzolash.'],
      ['Ma’lumot: 1008', 'e-notarius bo‘yicha call-markaz.'],
    ],
    bring: ['Pasport yoki ID karta (har ikki tomon)', 'Mulk hujjati (kadastr) yoki avtomobil texnik pasporti', 'Turmush o‘rtog‘ining roziligi (umumiy mulk bo‘lsa, notariusdan so‘rang)', 'Shartnoma loyihasi (Huquqchi’da tayyorlash mumkin)'],
    before: ['Notarial tasdiqlash narxi va davlat bojini notariusdan oldindan so‘rang', 'Loyihani oldindan tayyorlang: notariusda vaqt tejaladi'],
    lawyer: ['Bitim murakkab yoki summa katta', 'Mulkda bir nechta egalar yoki voyaga yetmagan bolalar ulushi bor'],
    laws: [LAW.k41, ['Fuqarolik kodeksi: bitimlar shakli', null], ['Oila kodeksi: nikoh shartnomasi va aliment kelishuvi', null], ['Notariat to‘g‘risidagi qonun', null]],
    caseHint: 'Huquqchi platformasida notarial hujjat loyihasini tayyorlab, notariusga tayyor holda borasiz.',
  },
]
