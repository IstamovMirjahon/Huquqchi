namespace Huquqchi.Application;

/// <summary>Paged list envelope (BACKEND_API.md §B.1).</summary>
public sealed record Paged<T>(IReadOnlyList<T> Items, int Page, int PageSize, int Total);

public sealed record PageRequest
{
    public const int DefaultPageSize = 20;
    public const int MaxPageSize = 100;

    public PageRequest(int? page, int? pageSize)
    {
        Page = page is > 0 ? page.Value : 1;
        PageSize = pageSize is > 0 ? Math.Min(pageSize.Value, MaxPageSize) : DefaultPageSize;
    }

    public int Page { get; }
    public int PageSize { get; }
    public int Skip => (Page - 1) * PageSize;
}
