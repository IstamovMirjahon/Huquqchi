using Huquqchi.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Huquqchi.Api.Controllers;

[ApiController, Authorize, Route("api/v1/profile")]
public sealed class ProfileController(IAppDbContext db) : ApiController
{
    [HttpGet]
    public object Get()
    {
        var user = db.Users.First(x => x.Id == Actor.UserId);
        var workspace = db.Workspaces.First(x => x.Id == Actor.WorkspaceId);
        return new { user.Id, user.Name, user.Phone, user.Language, Workspace = new { workspace.Id, workspace.Name, workspace.Kind }, Actor.Role };
    }
    [HttpPatch]
    public async Task<IActionResult> Update(UpdateProfileRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) throw new ValidationException("Ism bo‘sh bo‘lmasligi kerak.");
        var user = db.Users.First(x => x.Id == Actor.UserId); user.UpdateProfile(request.Name, request.Language); await db.SaveChangesAsync(ct); return NoContent();
    }
}
public sealed record UpdateProfileRequest(string Name, string Language = "uz-Latn");
