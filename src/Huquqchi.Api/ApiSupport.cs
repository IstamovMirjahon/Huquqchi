using System.Globalization;
using System.Security.Claims;
using Huquqchi.Application;
using Huquqchi.Infrastructure;
using Microsoft.AspNetCore.Mvc;

namespace Huquqchi.Api;

public abstract class ApiController : ControllerBase
{
    protected Actor Actor
    {
        get
        {
            var user = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            var workspace = User.FindFirstValue(JwtTokenService.WorkspaceClaim);
            var role = User.FindFirstValue(ClaimTypes.Role) ?? "client";
            if (!Guid.TryParse(user, out var userId) || !Guid.TryParse(workspace, out var workspaceId))
                throw new UnauthorizedAccessException("Token konteksti noto‘g‘ri.");
            Guid? sessionId = Guid.TryParse(User.FindFirstValue(JwtTokenService.SessionClaim), out var sid) ? sid : null;
            return new Actor(userId, workspaceId, role, sessionId);
        }
    }

    protected ClientInfo Client => new(Request.Headers.UserAgent.ToString() is { Length: > 0 } ua ? ua[..Math.Min(ua.Length, 512)] : null,
        HttpContext.Connection.RemoteIpAddress?.ToString());

    protected ActionResult Created<T>(Result<T> result, Func<T, string> location) =>
        result.IsFailure ? this.ToProblem(result.Error) : Created(location(result.Value), result.Value);
}

/// <summary>Builds RFC 7807 bodies with the stable <c>code</c> member (BACKEND_API.md §B.2).</summary>
public static class Problems
{
    public static int StatusFor(ErrorType type) => type switch
    {
        ErrorType.Validation => StatusCodes.Status400BadRequest,
        ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
        ErrorType.PaymentRequired => StatusCodes.Status402PaymentRequired,
        ErrorType.Forbidden => StatusCodes.Status403Forbidden,
        ErrorType.NotFound => StatusCodes.Status404NotFound,
        ErrorType.Conflict => StatusCodes.Status409Conflict,
        ErrorType.PayloadTooLarge => StatusCodes.Status413PayloadTooLarge,
        ErrorType.UnsupportedMediaType => StatusCodes.Status415UnsupportedMediaType,
        ErrorType.BusinessRule => StatusCodes.Status422UnprocessableEntity,
        ErrorType.TooManyRequests => StatusCodes.Status429TooManyRequests,
        ErrorType.Unavailable => StatusCodes.Status503ServiceUnavailable,
        _ => StatusCodes.Status500InternalServerError
    };

    public static ProblemDetails Create(Error error)
    {
        var status = StatusFor(error.Type);
        var problem = new ProblemDetails
        {
            Status = status,
            Title = ReasonPhrase(status),
            Detail = error.Message,
            Type = $"https://httpstatuses.com/{status}"
        };
        problem.Extensions["code"] = error.Code;
        if (error.FieldErrors is { Count: > 0 }) problem.Extensions["errors"] = error.FieldErrors;
        foreach (var (key, value) in error.Extensions) problem.Extensions[key] = value;
        return problem;
    }

    public static async Task WriteAsync(HttpContext context, Error error)
    {
        var problem = Create(error);
        if (error.RetryAfterSeconds is { } retry)
            context.Response.Headers.RetryAfter = retry.ToString(CultureInfo.InvariantCulture);
        context.Response.StatusCode = problem.Status!.Value;
        await context.Response.WriteAsJsonAsync(problem, (System.Text.Json.JsonSerializerOptions?)null,
            "application/problem+json", context.RequestAborted);
    }

    private static string ReasonPhrase(int status) =>
        Microsoft.AspNetCore.WebUtilities.ReasonPhrases.GetReasonPhrase(status) is { Length: > 0 } phrase ? phrase : "Error";
}

public sealed class ApiExceptionMiddleware(RequestDelegate next, ILogger<ApiExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try { await next(context); }
        catch (UnauthorizedAccessException ex)
        {
            await Problems.WriteAsync(context, new Error("auth.unauthorized", ex.Message, ErrorType.Unauthorized));
        }
        catch (BadHttpRequestException ex) when (ex.StatusCode == StatusCodes.Status413PayloadTooLarge)
        {
            await Problems.WriteAsync(context, new Error("common.payload_too_large", "So‘rov hajmi juda katta.", ErrorType.PayloadTooLarge));
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            // Client disconnected; nothing to send.
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled API error");
            if (context.Response.HasStarted) throw;
            await Problems.WriteAsync(context, new Error("common.server_error", "Kutilmagan xatolik yuz berdi.", ErrorType.Failure));
        }
    }
}

public static class ResultExtensions
{
    public static ActionResult<T> ToActionResult<T>(this Result<T> result, ControllerBase controller) =>
        controller.ToActionResult(result);

    public static IActionResult ToNoContentResult(this Result result, ControllerBase controller) =>
        controller.ToNoContentResult(result);

    public static ActionResult<T> ToActionResult<T>(this ControllerBase controller, Result<T> result) =>
        result.IsSuccess ? controller.Ok(result.Value) : controller.ToProblem(result.Error);

    public static IActionResult ToNoContentResult(this ControllerBase controller, Result result) =>
        result.IsSuccess ? controller.NoContent() : controller.ToProblem(result.Error);

    public static ActionResult ToProblem(this ControllerBase controller, Error error) => new ProblemResult(error);
}

/// <summary>
/// Writes the problem body itself, so controller-level <c>[Produces("application/json")]</c>
/// cannot replace the <c>application/problem+json</c> media type.
/// </summary>
public sealed class ProblemResult(Error error) : ActionResult
{
    public Error Error { get; } = error;

    public override Task ExecuteResultAsync(ActionContext context) => Problems.WriteAsync(context.HttpContext, Error);
}
