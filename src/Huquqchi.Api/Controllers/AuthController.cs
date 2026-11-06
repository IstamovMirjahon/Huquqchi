using Huquqchi.Application;
using Huquqchi.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Huquqchi.Api.Controllers;

[ApiController, Route("api/v1/auth")]
public sealed class AuthController(AuthService service, IConfiguration config, IWebHostEnvironment environment) : ControllerBase
{
    [HttpPost("request-code"), AllowAnonymous]
    public IActionResult RequestCode(RequestCodeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Phone)) throw new ValidationException("Telefon raqamini kiriting.");
        return Accepted(new { message = "Tasdiqlash kodi yuborildi.", developmentCode = environment.IsDevelopment() ? config["Otp:Code"] : null });
    }
    [HttpPost("verify"), AllowAnonymous]
    public Task<AuthResult> Verify(VerifyCodeRequest request, CancellationToken ct) => service.VerifyAsync(request.Phone, request.Code, request.Name, request.WorkspaceKind, config["Otp:Code"] ?? "111111", ct);
}
public sealed record RequestCodeRequest(string Phone);
public sealed record VerifyCodeRequest(string Phone, string Code, string Name, WorkspaceKind WorkspaceKind = WorkspaceKind.Personal);
