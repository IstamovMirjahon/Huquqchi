namespace Huquqchi.Application;

/// <summary>
/// Stable error codes. The frontend branches on <see cref="Error.Code"/>, so codes must never change;
/// see BACKEND_API.md §21 for the contract.
/// </summary>
public static class ApplicationErrors
{
    public static class Common
    {
        public static Error RateLimited(int retryAfterSeconds) =>
            new("common.rate_limited", "So‘rovlar soni oshib ketdi. Birozdan keyin qayta urinib ko‘ring.",
                ErrorType.TooManyRequests) { RetryAfterSeconds = retryAfterSeconds };

        public static readonly Error InvalidRequest =
            new("common.invalid_request", "So‘rov maydonlari noto‘g‘ri.", ErrorType.Validation);
    }

    public static class Auth
    {
        public static readonly Error InvalidCode = new("auth.invalid_code", "Telefon yoki bir martalik kod noto‘g‘ri.", ErrorType.Unauthorized);
        public static readonly Error CodeExpired = new("auth.code_expired", "Kod muddati tugagan. Yangi kod oling.", ErrorType.Unauthorized);
        public static readonly Error InvalidPhone = new("auth.invalid_phone", "Telefon raqamini to‘g‘ri kiriting.", ErrorType.Validation);
        public static readonly Error NameRequired = new("auth.name_required", "Ismingizni kiriting.", ErrorType.Validation);
        public static readonly Error TermsRequired = new("auth.terms_required", "Foydalanish shartlari va maxfiylik siyosatiga rozilik bering.", ErrorType.Validation);
        public static readonly Error InvalidRole = new("auth.invalid_role", "Rol faqat client yoki lawyer bo‘lishi mumkin.", ErrorType.Validation);
        public static readonly Error OtpNotConfigured = new("auth.otp_not_configured", "OTP xavfsizlik konfiguratsiyasi mavjud emas.", ErrorType.Failure);
        public static readonly Error InvalidRefreshToken = new("auth.invalid_refresh_token", "Refresh token noto‘g‘ri yoki muddati tugagan.", ErrorType.Unauthorized);
        public static readonly Error PhoneAlreadyLinked = new("auth.phone_already_linked", "Bu telefon raqami boshqa Telegram akkauntiga bog‘langan.", ErrorType.Conflict);
        public static readonly Error ForbiddenRole = new("auth.forbidden_role", "Bu amal uchun rolingiz yetarli emas.", ErrorType.Forbidden);
        public static readonly Error Blocked = new("auth.blocked", "Hisobingiz bloklangan. Yordam xizmatiga murojaat qiling.", ErrorType.Forbidden);
        public static readonly Error SessionNotFound = new("auth.session_not_found", "Sessiya topilmadi.", ErrorType.NotFound);
        public static readonly Error ChannelUnavailable = new("auth.channel_unavailable", "Bu kanal orqali kod yuborish hozircha mavjud emas. Telegram orqali kiring.", ErrorType.Unavailable);

        public static Error CodeRateLimited(int retryAfterSeconds) =>
            new("auth.code_rate_limited", $"Kod so‘rash limiti tugadi. {retryAfterSeconds} soniyadan keyin qayta urinib ko‘ring.",
                ErrorType.TooManyRequests) { RetryAfterSeconds = retryAfterSeconds };

        public static readonly Error TooManyAttempts =
            new("auth.code_rate_limited", "Noto‘g‘ri urinishlar ko‘p. Yangi kod oling.", ErrorType.TooManyRequests) { RetryAfterSeconds = 60 };
    }

    public static class Me
    {
        public static readonly Error EmptyName = new("me.empty_name", "Ism bo‘sh bo‘lmasligi kerak.", ErrorType.Validation);
        public static readonly Error InvalidEmail = new("me.invalid_email", "Email manzili noto‘g‘ri.", ErrorType.Validation);
        public static readonly Error InvalidLanguage = new("me.invalid_language", "Til faqat uz-Latn, uz-Cyrl yoki ru bo‘lishi mumkin.", ErrorType.Validation);
        public static readonly Error InvalidNotificationKey = new("me.invalid_notification_setting", "Bildirishnoma sozlamasi noma’lum.", ErrorType.Validation);
        public static readonly Error ConfirmationRequired = new("me.confirmation_required", "Hisobni o‘chirish uchun «O‘CHIRISH» so‘zini yozing.", ErrorType.Validation);
        public static readonly Error HasActiveOrders = new("me.has_active_orders", "Faol buyurtmalar tugamaguncha hisobni o‘chirib bo‘lmaydi.", ErrorType.BusinessRule);
        public static readonly Error WalletNotEmpty = new("me.wallet_not_empty", "Hamyonda mablag‘ bor. Avval uni yeching.", ErrorType.BusinessRule);
    }

    public static class Files
    {
        public static readonly Error NotFound = new("files.not_found", "Fayl topilmadi.", ErrorType.NotFound);
        public static readonly Error InvalidPurpose = new("files.invalid_purpose", "Fayl maqsadi noto‘g‘ri.", ErrorType.Validation);
        public static readonly Error Empty = new("files.empty", "Fayl bo‘sh.", ErrorType.Validation);
        public static readonly Error Infected = new("files.infected", "Faylda zararli dastur aniqlandi.", ErrorType.BusinessRule);
        public static readonly Error ScanUnavailable = new("files.scan_unavailable", "Faylni antivirus tekshiruvidan o‘tkazib bo‘lmadi. Birozdan keyin urinib ko‘ring.", ErrorType.Unavailable);

        public static Error InvalidType(IEnumerable<string> allowed) =>
            new("files.invalid_type", $"Bu turdagi fayl qabul qilinmaydi. Ruxsat etilgan: {string.Join(", ", allowed)}.",
                ErrorType.UnsupportedMediaType);

        public static Error TooLarge(long maxBytes) =>
            new("files.too_large", $"Fayl hajmi {maxBytes / (1024 * 1024)} MB dan oshmasligi kerak.", ErrorType.PayloadTooLarge);
    }

    public static class Documents
    {
        public static readonly Error NotFound = new("documents.not_found", "Hujjat topilmadi.", ErrorType.NotFound);
        public static readonly Error InvalidType = new("documents.invalid_type", "Faqat PDF, DOCX, JPG va PNG fayllar qabul qilinadi.", ErrorType.Validation);
        public static readonly Error InvalidSize = new("documents.invalid_size", "Fayl hajmi 1 baytdan 25 MB gacha bo‘lishi kerak.", ErrorType.Validation);
        public static readonly Error EmptyName = new("documents.empty_name", "Hujjat nomi bo‘sh bo‘lmasligi kerak.", ErrorType.Validation);
        public static readonly Error EmptyPurpose = new("documents.empty_analysis_purpose", "Tahlil maqsadini kiriting.", ErrorType.Validation);
        public static Error Duplicate(Guid id) => new("documents.duplicate", $"Bu fayl avval yuklangan. Mavjud documentId: {id}", ErrorType.Conflict);
    }

    public static class Analyses
    {
        public static readonly Error NotFound = new("analyses.not_found", "Tahlil topilmadi.", ErrorType.NotFound);
    }

    public static class Conversations
    {
        public static readonly Error NotFound = new("conversations.not_found", "Suhbat topilmadi.", ErrorType.NotFound);
        public static readonly Error EmptyMessage = new("conversations.empty_message", "Xabar bo‘sh bo‘lmasligi kerak.", ErrorType.Validation);
    }

    public static class LegalDocuments
    {
        public static readonly Error NotFound = new("legal_documents.not_found", "Huquqiy hujjat topilmadi.", ErrorType.NotFound);
    }

    public static class Templates
    {
        public static readonly Error NotFound = new("templates.not_found", "Shablon topilmadi.", ErrorType.NotFound);
        public static readonly Error EmptyName = new("drafts.empty_name", "Loyiha nomi bo‘sh bo‘lmasligi kerak.", ErrorType.Validation);
    }

    public static class Profile
    {
        public static readonly Error UserNotFound = new("profile.user_not_found", "Foydalanuvchi topilmadi.", ErrorType.NotFound);
        public static readonly Error WorkspaceNotFound = new("profile.workspace_not_found", "Ish maydoni topilmadi.", ErrorType.NotFound);
        public static readonly Error EmptyName = new("profile.empty_name", "Ism bo‘sh bo‘lmasligi kerak.", ErrorType.Validation);
    }
}
