using Huquqchi.Domain;

namespace Huquqchi.Application;

public static class UsagePeriod
{
    public const string Day = "day";
    public const string Month = "month";
    /// <summary>Not periodic: a running total such as currently active services.</summary>
    public const string Total = "total";
}

public static class UsageMetric
{
    public const string AiQuestions = "ai_questions";
    public const string Analyses = "analyses";
    public const string Drafts = "drafts";
    public const string Services = "services";
    public const string Offers = "offers";
}

/// <param name="Limit"><c>null</c> means unlimited.</param>
public sealed record PlanLimit(int? Limit, string Period);

public sealed record PlanDefinition(string Code, UserRole Audience, string Name,
    IReadOnlyDictionary<string, PlanLimit> Limits);

/// <summary>
/// Free plans every account starts on (BACKEND_API.md §2.1, §9.3, §9.5). Paid plans and the
/// subscription lifecycle arrive with the Subscriptions module (phase 7); until then each user is on
/// the free plan of their audience.
/// </summary>
public static class PlanCatalog
{
    public static readonly PlanDefinition ClientFree = new("client_free", UserRole.Client, "Bepul",
        new Dictionary<string, PlanLimit>
        {
            [UsageMetric.AiQuestions] = new(5, UsagePeriod.Day),
            [UsageMetric.Analyses] = new(1, UsagePeriod.Month),
            [UsageMetric.Drafts] = new(1, UsagePeriod.Month)
        });

    public static readonly PlanDefinition LawyerFree = new("lawyer_free", UserRole.Lawyer, "Bepul",
        new Dictionary<string, PlanLimit>
        {
            [UsageMetric.Services] = new(5, UsagePeriod.Total),
            [UsageMetric.Offers] = new(20, UsagePeriod.Month)
        });

    public static PlanDefinition DefaultFor(UserRole role) => role == UserRole.Lawyer ? LawyerFree : ClientFree;
}
