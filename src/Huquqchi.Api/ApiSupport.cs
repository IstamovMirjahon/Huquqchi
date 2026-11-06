using System.Security.Claims;
using Huquqchi.Application;
using Microsoft.AspNetCore.Mvc;

namespace Huquqchi.Api;

public abstract class ApiController : ControllerBase
{
    protected Actor Actor
    {
        get
        {
            var user = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            var workspace = User.FindFirstValue("workspace_id");
            var role = User.FindFirstValue(ClaimTypes.Role) ?? "Member";
            if (!Guid.TryParse(user, out var userId) || !Guid.TryParse(workspace, out var workspaceId))
                throw new UnauthorizedAccessException("Token konteksti noto‘g‘ri.");
            return new Actor(userId, workspaceId, role);
        }
    }
}

public sealed class ApiExceptionMiddleware(RequestDelegate next, ILogger<ApiExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try { await next(context); }
        catch (Exception ex)
        {
            var (status, title) = ex is UnauthorizedAccessException
                ? (StatusCodes.Status401Unauthorized, "Autentifikatsiya talab qilinadi")
                : (StatusCodes.Status500InternalServerError, "Server xatosi");
            if (status == 500) logger.LogError(ex, "Unhandled API error");
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsJsonAsync(new ProblemDetails { Status = status, Title = title, Detail = status == 500 ? "Kutilmagan xatolik yuz berdi." : ex.Message });
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

    public static ObjectResult ToProblem(this ControllerBase controller, Error error)
    {
        var status = error.Type switch
        {
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            ErrorType.Forbidden => StatusCodes.Status403Forbidden,
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status500InternalServerError
        };
        var problem = new ProblemDetails
        {
            Status = status,
            Title = error.Type.ToString(),
            Detail = error.Message,
            Type = $"https://httpstatuses.com/{status}"
        };
        problem.Extensions["code"] = error.Code;
        return controller.StatusCode(status, problem);
    }
}
