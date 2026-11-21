using Huquqchi.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Huquqchi.Api.Controllers;

[ApiController, Authorize, Route("api/v1/me")]
[Produces("application/json")]
public sealed class MeController(IMeService service) : ApiController
{
    [HttpGet]
    [ProducesResponseType(typeof(MeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<MeResponse>> Get(CancellationToken ct) =>
        (await service.GetAsync(Actor, ct)).ToActionResult(this);

    [HttpPatch]
    [ProducesResponseType(typeof(MeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MeResponse>> Update(UpdateMeRequest request, CancellationToken ct) =>
        (await service.UpdateAsync(Actor, new UpdateMeCommand(request.Name, request.Email, request.Language), ct))
        .ToActionResult(this);

    /// <summary>JPG or PNG up to 5 MB.</summary>
    [HttpPost("avatar"), RequestSizeLimit(6 * 1024 * 1024)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(AvatarResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status413PayloadTooLarge)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status415UnsupportedMediaType)]
    public async Task<ActionResult<AvatarResponse>> UploadAvatar(IFormFile file, CancellationToken ct)
    {
        await using var stream = file.OpenReadStream();
        return (await service.UploadAvatarAsync(Actor, new FileUpload(stream, file.FileName, file.Length), ct))
            .ToActionResult(this);
    }

    [HttpGet("notification-settings")]
    [ProducesResponseType(typeof(NotificationSettingsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<NotificationSettingsDto>> GetNotificationSettings(CancellationToken ct) =>
        (await service.GetNotificationSettingsAsync(Actor, ct)).ToActionResult(this);

    [HttpPut("notification-settings")]
    [ProducesResponseType(typeof(NotificationSettingsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<NotificationSettingsDto>> UpdateNotificationSettings(
        NotificationSettingsRequest request, CancellationToken ct) =>
        (await service.UpdateNotificationSettingsAsync(Actor, new NotificationSettingsDto(
            request.Channels ?? new Dictionary<string, bool>(), request.Types ?? new Dictionary<string, bool>()), ct))
        .ToActionResult(this);

    [HttpPost("export")]
    [ProducesResponseType(typeof(DataExportResponse), StatusCodes.Status202Accepted)]
    public async Task<IActionResult> Export(CancellationToken ct)
    {
        var result = await service.RequestExportAsync(Actor, ct);
        return result.IsFailure ? this.ToProblem(result.Error) : Accepted(result.Value);
    }

    /// <summary>Deletes the account. Body must contain <c>"confirm": "O‘CHIRISH"</c>.</summary>
    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Delete([FromBody] DeleteAccountRequest request, CancellationToken ct) =>
        (await service.DeleteAsync(Actor, new DeleteAccountCommand(request.Confirm, request.Reason), ct))
        .ToNoContentResult(this);
}

public sealed record UpdateMeRequest(string? Name = null, string? Email = null, string? Language = null);
public sealed record NotificationSettingsRequest(Dictionary<string, bool>? Channels, Dictionary<string, bool>? Types);
public sealed record DeleteAccountRequest(string? Confirm, string? Reason = null);
