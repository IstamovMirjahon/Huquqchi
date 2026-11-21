using Huquqchi.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Huquqchi.Api.Controllers;

/// <summary>Public reference data. Responses may be cached by clients and proxies for one hour.</summary>
[ApiController, AllowAnonymous, Route("api/v1/reference")]
[Produces("application/json")]
[ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any)]
public sealed class ReferenceController(IReferenceService service) : ControllerBase
{
    [HttpGet("categories")]
    [ProducesResponseType(typeof(IReadOnlyList<CategoryItem>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CategoryItem>>> Categories(CancellationToken ct) =>
        Ok(await service.GetCategoriesAsync(ct));

    [HttpGet("regions")]
    [ProducesResponseType(typeof(IReadOnlyList<RegionItem>), StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyList<RegionItem>> Regions() => Ok(service.GetRegions());

    [HttpGet("config")]
    [ProducesResponseType(typeof(PlatformConfigResponse), StatusCodes.Status200OK)]
    public ActionResult<PlatformConfigResponse> Config() => Ok(service.GetConfig());
}
