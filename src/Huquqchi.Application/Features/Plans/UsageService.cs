using Huquqchi.Domain;

namespace Huquqchi.Application;

public sealed record UsageItem(string Metric, int Used, int? Limit, string Period, DateTimeOffset? ResetsAt);

public interface IUsageService
{
    Task<IReadOnlyList<UsageItem>> GetAsync(Actor actor, PlanDefinition plan, CancellationToken cancellationToken);
}

/// <summary>
/// Counts usage straight from the source tables. Periods follow Asia/Tashkent time (UTC+5, no DST),
/// which is when limits reset for users.
/// </summary>
public sealed class UsageService(IUnitOfWork unitOfWork, TimeProvider timeProvider) : IUsageService
{
    public static readonly TimeSpan TashkentOffset = TimeSpan.FromHours(5);

    public async Task<IReadOnlyList<UsageItem>> GetAsync(Actor actor, PlanDefinition plan,
        CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow().ToOffset(TashkentOffset);
        var dayStart = new DateTimeOffset(now.Year, now.Month, now.Day, 0, 0, 0, TashkentOffset);
        var monthStart = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TashkentOffset);

        var items = new List<UsageItem>();
        foreach (var (metric, limit) in plan.Limits)
        {
            var periodStart = limit.Period == UsagePeriod.Day ? dayStart : monthStart;
            var resetsAt = limit.Period switch
            {
                UsagePeriod.Day => dayStart.AddDays(1),
                UsagePeriod.Month => monthStart.AddMonths(1),
                _ => (DateTimeOffset?)null
            };
            var used = await CountAsync(actor, metric, periodStart.ToUniversalTime(), cancellationToken);
            items.Add(new UsageItem(metric, used, limit.Limit, limit.Period, resetsAt));
        }

        return items;
    }

    private async Task<int> CountAsync(Actor actor, string metric, DateTimeOffset since,
        CancellationToken cancellationToken)
    {
        switch (metric)
        {
            case UsageMetric.AiQuestions:
                var conversationIds = (await unitOfWork.Repository<Conversation>().ListAsync(
                        x => x.WorkspaceId == actor.WorkspaceId, cancellationToken: cancellationToken))
                    .Select(x => x.Id).ToList();
                return conversationIds.Count == 0
                    ? 0
                    : await unitOfWork.Repository<Message>().CountAsync(
                        x => conversationIds.Contains(x.ConversationId) && x.Role == MessageRole.User && x.CreatedAt >= since,
                        cancellationToken);
            case UsageMetric.Analyses:
                return await unitOfWork.Repository<Analysis>().CountAsync(
                    x => x.WorkspaceId == actor.WorkspaceId && x.CreatedAt >= since, cancellationToken);
            case UsageMetric.Drafts:
                return await unitOfWork.Repository<Draft>().CountAsync(
                    x => x.WorkspaceId == actor.WorkspaceId && x.CreatedAt >= since, cancellationToken);
            default:
                // Services and offers belong to modules that are not built yet (phases 3 and 5): nothing exists to count.
                return 0;
        }
    }
}
