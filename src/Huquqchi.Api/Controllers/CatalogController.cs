using Huquqchi.Application;
using Huquqchi.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Huquqchi.Api.Controllers;

[ApiController, Route("api/v1/legal-documents")]
public sealed class LegalDocumentsController(CatalogService service) : ControllerBase
{
    [HttpGet, AllowAnonymous] public IReadOnlyList<LegalSearchItem> Search([FromQuery] string? query) => service.Search(query);
    [HttpGet("{id:guid}"), AllowAnonymous] public object Details(Guid id) => service.Details(id);
}

[ApiController, Authorize, Route("api/v1/templates")]
public sealed class TemplatesController(DraftService service) : ApiController
{
    [HttpGet] public IReadOnlyList<Template> List() => service.Templates();
}

[ApiController, Authorize, Route("api/v1/drafts")]
public sealed class DraftsController(DraftService service) : ApiController
{
    [HttpGet] public IReadOnlyList<DraftItem> List() => service.List(Actor);
    [HttpPost] public async Task<ActionResult<DraftItem>> Create(CreateDraftRequest request, CancellationToken ct) { var d = await service.CreateAsync(Actor, request.TemplateId, request.Name, request.Fields, ct); return Created($"/api/v1/drafts/{d.Id}", d); }
}
public sealed record CreateDraftRequest(Guid TemplateId, string Name, Dictionary<string, string?> Fields);
