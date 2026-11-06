using Huquqchi.Application;
using Huquqchi.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Huquqchi.Api.Controllers;

[ApiController, Route("api/v1/auth")]
public sealed class AuthController(IAuthService service, IConfiguration config) : ControllerBase
{
    [HttpPost("request-code"), AllowAnonymous]
    public IActionResult RequestCode(RequestCodeRequest request)
    {
        if (PhoneNumber.Normalize(request.Phone) is null) return this.ToProblem(ApplicationErrors.Auth.InvalidPhone);
        return Accepted(new
        {
            message = "Tasdiqlash kodini Telegram bot orqali oling.",
            deliveryChannel = "telegram",
            telegramBotUrl = config["Telegram:BotUrl"]
        });
    }
    [HttpPost("verify"), AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Verify(VerifyCodeRequest request, CancellationToken ct)
    {
        var result = await service.VerifyAsync(new VerifyCodeCommand(
            request.Phone, request.Code, request.Name, request.WorkspaceKind), ct);
        return result.ToActionResult(this);
    }

    [HttpPost("refresh"), AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest request, CancellationToken ct) =>
        (await service.RefreshAsync(new RefreshTokenCommand(request.RefreshToken), ct)).ToActionResult(this);

    [HttpPost("logout"), AllowAnonymous]
    public async Task<IActionResult> Logout(RefreshRequest request, CancellationToken ct) =>
        (await service.LogoutAsync(new LogoutCommand(request.RefreshToken), ct)).ToNoContentResult(this);
}
public sealed record RequestCodeRequest(string Phone);
public sealed record VerifyCodeRequest(string Phone, string Code, string Name, WorkspaceKind WorkspaceKind = WorkspaceKind.Personal);
public sealed record RefreshRequest(string RefreshToken);
