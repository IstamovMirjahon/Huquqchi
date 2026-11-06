using Huquqchi.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Huquqchi.Api.Controllers;

[ApiController, Authorize]
[Route("api/v1/drafts")]
[Produces("application/json")]
public sealed class DraftsController(IDraftService service) : ApiController
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<DraftItem>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<DraftItem>>> List(CancellationToken ct) =>
        (await service.ListAsync(Actor, ct)).ToActionResult(this);

    [HttpPost]
    [ProducesResponseType(typeof(DraftItem), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DraftItem>> Create(CreateDraftRequest request, CancellationToken ct)
    {
        var result = await service.CreateAsync(Actor,
            new CreateDraftCommand(request.TemplateId, request.Name, request.Fields), ct);
        return result.IsFailure
            ? this.ToProblem(result.Error)
            : Created($"/api/v1/drafts/{result.Value.Id}", result.Value);
    }
}

public sealed record CreateDraftRequest(Guid TemplateId, string Name, Dictionary<string, string?> Fields);
