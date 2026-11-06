using Huquqchi.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Huquqchi.Api.Controllers;

[ApiController, Authorize]
[Route("api/v1/templates")]
[Produces("application/json")]
public sealed class TemplatesController(IDraftService service) : ApiController
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<TemplateItem>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<TemplateItem>>> List(CancellationToken ct) =>
        (await service.GetTemplatesAsync(ct)).ToActionResult(this);
}
