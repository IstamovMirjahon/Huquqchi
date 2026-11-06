using Huquqchi.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Huquqchi.Api.Controllers;

[ApiController]
[Route("api/v1/legal-documents")]
[Produces("application/json")]
public sealed class LegalDocumentsController(ILegalCatalogService service) : ControllerBase
{
    [HttpGet, AllowAnonymous]
    [ProducesResponseType(typeof(IReadOnlyList<LegalSearchItem>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<LegalSearchItem>>> Search([FromQuery] string? query, CancellationToken ct) =>
        (await service.SearchAsync(query, ct)).ToActionResult(this);

    [HttpGet("{id:guid}"), AllowAnonymous]
    [ProducesResponseType(typeof(LegalDocumentDetails), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LegalDocumentDetails>> Details(Guid id, CancellationToken ct) =>
        (await service.GetDetailsAsync(id, ct)).ToActionResult(this);
}
