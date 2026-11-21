using Huquqchi.Domain;

namespace Huquqchi.Application;

public sealed record CategoryItem(string Code, string Name, string Icon, int LawyerCount);
public sealed record RegionItem(string Code, string Name);

public sealed record OrderTimeouts(int PaymentMinutes, int AcceptHours, int AutoCompleteHours);
public sealed record CommissionRates(decimal Standard, decimal Pro);

/// <summary>Client-facing platform settings (BACKEND_API.md §17). Bound from the <c>Platform</c> config section.</summary>
public sealed class PlatformSettings
{
    public int UploadMaxMb { get; init; } = 25;
    public string[] AllowedDocumentTypes { get; init; } = [".pdf", ".docx", ".jpg", ".jpeg", ".png"];
    public string[] PaymentProviders { get; init; } = ["payme", "click", "uzum"];
    public CommissionRates Commission { get; init; } = new(0.15m, 0.10m);
    public OrderTimeouts OrderTimeouts { get; init; } = new(30, 24, 72);
    public int MinPayout { get; init; } = 50_000;
    public string SupportTelegram { get; init; } = "https://t.me/huquqchi_support";
}

public sealed record PlatformConfigResponse(
    int UploadMaxMb,
    IReadOnlyList<string> AllowedDocumentTypes,
    IReadOnlyList<string> PaymentProviders,
    CommissionRates Commission,
    OrderTimeouts OrderTimeouts,
    int MinPayout,
    string SupportTelegram);

public interface IReferenceService
{
    Task<IReadOnlyList<CategoryItem>> GetCategoriesAsync(CancellationToken cancellationToken);
    IReadOnlyList<RegionItem> GetRegions();
    PlatformConfigResponse GetConfig();
}

public sealed class ReferenceService(PlatformSettings settings) : IReferenceService
{
    private static readonly (string Code, string Name, string Icon)[] Categories =
    [
        ("labor", "Mehnat huquqi", "briefcase"),
        ("family", "Oila huquqi", "users"),
        ("housing", "Uy-joy huquqi", "home"),
        ("consumer", "Iste’molchilar huquqi", "shopping-bag"),
        ("business", "Tadbirkorlik huquqi", "building"),
        ("tax", "Soliq huquqi", "receipt"),
        ("criminal", "Jinoyat huquqi", "shield"),
        ("administrative", "Ma’muriy huquq", "landmark"),
        ("inheritance", "Meros huquqi", "scroll"),
        ("land", "Yer huquqi", "map"),
        ("migration", "Migratsiya huquqi", "plane"),
        ("civil", "Fuqarolik huquqi", "scale"),
        ("other", "Boshqa", "help-circle")
    ];

    private static readonly IReadOnlyList<RegionItem> Regions =
    [
        new("tashkent_city", "Toshkent shahri"),
        new("tashkent", "Toshkent viloyati"),
        new("andijan", "Andijon viloyati"),
        new("bukhara", "Buxoro viloyati"),
        new("fergana", "Farg‘ona viloyati"),
        new("jizzakh", "Jizzax viloyati"),
        new("kashkadarya", "Qashqadaryo viloyati"),
        new("khorezm", "Xorazm viloyati"),
        new("namangan", "Namangan viloyati"),
        new("navoi", "Navoiy viloyati"),
        new("samarkand", "Samarqand viloyati"),
        new("surkhandarya", "Surxondaryo viloyati"),
        new("syrdarya", "Sirdaryo viloyati"),
        new("karakalpakstan", "Qoraqalpog‘iston Respublikasi")
    ];

    public static IReadOnlySet<string> CategoryCodes { get; } = Categories.Select(x => x.Code).ToHashSet();
    public static IReadOnlySet<string> RegionCodes { get; } = Regions.Select(x => x.Code).ToHashSet();

    public Task<IReadOnlyList<CategoryItem>> GetCategoriesAsync(CancellationToken cancellationToken)
    {
        // Lawyer categories are stored with lawyer profiles in phase 3; until then no verified lawyer exists.
        IReadOnlyList<CategoryItem> items = Categories.Select(x => new CategoryItem(x.Code, x.Name, x.Icon, 0)).ToList();
        return Task.FromResult(items);
    }

    public IReadOnlyList<RegionItem> GetRegions() => Regions;

    public PlatformConfigResponse GetConfig() => new(settings.UploadMaxMb, settings.AllowedDocumentTypes,
        settings.PaymentProviders, settings.Commission, settings.OrderTimeouts, settings.MinPayout,
        settings.SupportTelegram);
}
