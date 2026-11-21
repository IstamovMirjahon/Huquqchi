namespace Huquqchi.Application;

/// <summary>
/// Error category. The API layer maps each category to one HTTP status code
/// (see BACKEND_API.md §B.2), so services never deal with HTTP directly.
/// </summary>
public enum ErrorType
{
    Validation,           // 400
    Unauthorized,         // 401
    PaymentRequired,      // 402 — tariff limit or subscription required
    Forbidden,            // 403
    NotFound,             // 404 — also used for resources the caller may not see
    Conflict,             // 409
    PayloadTooLarge,      // 413
    UnsupportedMediaType, // 415
    BusinessRule,         // 422
    TooManyRequests,      // 429
    Unavailable,          // 503
    Failure               // 500
}

public sealed record Error(string Code, string Message, ErrorType Type)
{
    public static readonly Error None = new(string.Empty, string.Empty, ErrorType.Failure);

    /// <summary>Extra ProblemDetails members, e.g. <c>resetsAt</c> or <c>upgradePlanCode</c>.</summary>
    public IReadOnlyDictionary<string, object?> Extensions { get; init; } = EmptyExtensions;

    /// <summary>Field-level validation messages rendered as ProblemDetails <c>errors</c>.</summary>
    public IReadOnlyDictionary<string, string[]>? FieldErrors { get; init; }

    /// <summary>Seconds the client should wait; rendered as the <c>Retry-After</c> header.</summary>
    public int? RetryAfterSeconds { get; init; }

    public Error WithField(string field, string message) => this with
    {
        FieldErrors = new Dictionary<string, string[]> { [field] = [message] }
    };

    public Error WithExtension(string key, object? value) => this with
    {
        Extensions = new Dictionary<string, object?>(Extensions) { [key] = value }
    };

    private static readonly IReadOnlyDictionary<string, object?> EmptyExtensions =
        new Dictionary<string, object?>();
}
