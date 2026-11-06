using Huquqchi.Application;
using Huquqchi.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Huquqchi.Api.Controllers;

[ApiController, Authorize, Route("api/v1/documents")]
public sealed class DocumentsController(IDocumentService service) : ApiController
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DocumentListItem>>> List([FromQuery] string? search, [FromQuery] DocumentOrigin? origin, CancellationToken ct) =>
        (await service.ListAsync(Actor, search, origin, ct)).ToActionResult(this);

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DocumentListItem>> Get(Guid id, CancellationToken ct) =>
        (await service.GetAsync(Actor, id, ct)).ToActionResult(this);

    [HttpPost, RequestSizeLimit(25 * 1024 * 1024)]
    public async Task<ActionResult<DocumentListItem>> Upload(IFormFile file, [FromForm] DocumentOrigin origin = DocumentOrigin.Uploaded, CancellationToken ct = default)
    {
        await using var stream = file.OpenReadStream();
        var result = await service.UploadAsync(Actor, new UploadDocumentCommand(stream, file.FileName, file.ContentType, file.Length, origin), ct);
        return result.IsFailure ? this.ToProblem(result.Error) : CreatedAtAction(nameof(Get), new { id = result.Value.Id }, result.Value);
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateDocumentRequest request, CancellationToken ct) =>
        (await service.UpdateAsync(Actor, id, new UpdateDocumentCommand(request.Name, request.Tags), ct)).ToNoContentResult(this);

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        (await service.DeleteAsync(Actor, id, ct)).ToNoContentResult(this);

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(Guid id, CancellationToken ct)
    {
        var result = await service.DownloadAsync(Actor, id, ct);
        return result.IsFailure ? this.ToProblem(result.Error) : File(result.Value.Content, result.Value.ContentType, result.Value.Name);
    }

    [HttpPost("{id:guid}/analyses")]
    public async Task<ActionResult<AnalysisResult>> Analyze(Guid id, StartAnalysisRequest request, CancellationToken ct) =>
        (await service.StartAnalysisAsync(Actor, id, new StartAnalysisCommand(request.Purpose, request.UserRole), ct)).ToActionResult(this);

    [HttpGet("{id:guid}/analyses")]
    public async Task<ActionResult<IReadOnlyList<AnalysisResult>>> Analyses(Guid id, CancellationToken ct) =>
        (await service.GetAnalysesAsync(Actor, id, ct)).ToActionResult(this);
}
public sealed record UpdateDocumentRequest(string Name, string? Tags);
public sealed record StartAnalysisRequest(string Purpose, string? UserRole);
