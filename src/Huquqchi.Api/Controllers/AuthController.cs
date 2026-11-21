using Huquqchi.Application;
using Huquqchi.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Huquqchi.Api.Controllers;

[ApiController, Route("api/v1/auth")]
[Produces("application/json")]
public sealed class AuthController(IAuthService service) : ApiController
{
    /// <summary>Starts sign-in. A phone already linked to the Telegram bot receives the code in Telegram right away.</summary>
    [HttpPost("request-code"), AllowAnonymous]
    [ProducesResponseType(typeof(RequestCodeResponse), StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> RequestCode(RequestCodeRequest request, CancellationToken ct)
    {
        var result = await service.RequestCodeAsync(new RequestCodeCommand(request.Phone, request.Channel), ct);
        return result.IsFailure ? this.ToProblem(result.Error) : Accepted(result.Value);
    }

    [HttpPost("verify"), AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AuthResponse>> Verify(VerifyCodeRequest request, CancellationToken ct) =>
        (await service.VerifyAsync(new VerifyCodeCommand(request.Phone, request.Code, request.Name,
            request.WorkspaceKind, request.Role, request.AcceptTerms, Client), ct)).ToActionResult(this);

    [HttpPost("refresh"), AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest request, CancellationToken ct) =>
        (await service.RefreshAsync(new RefreshTokenCommand(request.RefreshToken, Client), ct)).ToActionResult(this);

    [HttpPost("logout"), AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(RefreshRequest request, CancellationToken ct) =>
        (await service.LogoutAsync(new LogoutCommand(request.RefreshToken), ct)).ToNoContentResult(this);

    /// <summary>Signed-in devices; <c>isCurrent</c> marks the one making this request.</summary>
    [HttpGet("sessions"), Authorize]
    [ProducesResponseType(typeof(IReadOnlyList<SessionItem>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<SessionItem>>> Sessions(CancellationToken ct) =>
        (await service.ListSessionsAsync(Actor, ct)).ToActionResult(this);

    [HttpDelete("sessions/{id:guid}"), Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevokeSession(Guid id, CancellationToken ct) =>
        (await service.RevokeSessionAsync(Actor, id, ct)).ToNoContentResult(this);

    /// <summary>Signs out every device except the current one.</summary>
    [HttpPost("logout-all"), Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> LogoutAll(CancellationToken ct) =>
        (await service.LogoutAllAsync(Actor, ct)).ToNoContentResult(this);
}

public sealed record RequestCodeRequest(string Phone, string? Channel = null);

public sealed record VerifyCodeRequest(
    string Phone,
    string Code,
    string? Name = null,
    string? Role = null,
    WorkspaceKind WorkspaceKind = WorkspaceKind.Personal,
    bool AcceptTerms = false);

public sealed record RefreshRequest(string RefreshToken);
