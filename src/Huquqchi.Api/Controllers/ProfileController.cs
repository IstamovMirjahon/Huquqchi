using Huquqchi.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Huquqchi.Api.Controllers;

[ApiController, Authorize, Route("api/v1/profile")]
public sealed class ProfileController(IProfileService service) : ApiController
{
    [HttpGet] public async Task<ActionResult<ProfileResponse>> Get(CancellationToken ct) => (await service.GetAsync(Actor, ct)).ToActionResult(this);
    [HttpPatch]
    public async Task<IActionResult> Update(UpdateProfileRequest request, CancellationToken ct)
    {
        return (await service.UpdateAsync(Actor, new UpdateProfileCommand(request.Name, request.Language), ct)).ToNoContentResult(this);
    }
}
public sealed record UpdateProfileRequest(string Name, string Language = "uz-Latn");
