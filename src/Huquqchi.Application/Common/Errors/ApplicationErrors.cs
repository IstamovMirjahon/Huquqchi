namespace Huquqchi.Application;

public static class ApplicationErrors
{
    public static class Auth
    {
        public static readonly Error InvalidCode = new("auth.invalid_code", "Telefon yoki bir martalik kod noto‘g‘ri.", ErrorType.Unauthorized);
        public static readonly Error InvalidPhone = new("auth.invalid_phone", "Telefon raqamini kiriting.", ErrorType.Validation);
        public static readonly Error CodeRateLimited = new("auth.code_rate_limited", "Yangi kod olishdan oldin 60 soniya kuting.", ErrorType.Conflict);
        public static readonly Error OtpNotConfigured = new("auth.otp_not_configured", "OTP xavfsizlik konfiguratsiyasi mavjud emas.", ErrorType.Failure);
        public static readonly Error InvalidRefreshToken = new("auth.invalid_refresh_token", "Refresh token noto‘g‘ri yoki muddati tugagan.", ErrorType.Unauthorized);
        public static readonly Error PhoneAlreadyLinked = new("auth.phone_already_linked", "Bu telefon raqami boshqa Telegram akkauntiga bog‘langan.", ErrorType.Conflict);
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
