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
            if (!Guid.TryParse(user, out var userId) || !Guid.TryParse(workspace, out var workspaceId)) throw new ForbiddenException("Token konteksti noto‘g‘ri.");
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
            var (status, title) = ex switch
            {
                ValidationException => (StatusCodes.Status400BadRequest, "Tekshiruv xatosi"),
                NotFoundException => (StatusCodes.Status404NotFound, "Topilmadi"),
                ForbiddenException => (StatusCodes.Status403Forbidden, "Ruxsat yo‘q"),
                _ => (StatusCodes.Status500InternalServerError, "Server xatosi")
            };
            if (status == 500) logger.LogError(ex, "Unhandled API error");
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsJsonAsync(new ProblemDetails { Status = status, Title = title, Detail = status == 500 ? "Kutilmagan xatolik yuz berdi." : ex.Message });
        }
    }
}
