using Huquqchi.Application;
using Huquqchi.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Huquqchi.Api.Controllers;

[ApiController, Authorize, Route("api/v1/documents")]
public sealed class DocumentsController(DocumentService service) : ApiController
{
    [HttpGet] public IReadOnlyList<DocumentListItem> List([FromQuery] string? search, [FromQuery] DocumentOrigin? origin) => service.List(Actor, search, origin);
    [HttpGet("{id:guid}")] public DocumentListItem Get(Guid id) => service.Get(Actor, id);
    [HttpPost, RequestSizeLimit(25 * 1024 * 1024)]
    public async Task<ActionResult<DocumentListItem>> Upload(IFormFile file, [FromForm] DocumentOrigin origin = DocumentOrigin.Uploaded, CancellationToken ct = default)
    { await using var stream = file.OpenReadStream(); var result = await service.UploadAsync(Actor, stream, file.FileName, file.ContentType, file.Length, origin, ct); return CreatedAtAction(nameof(Get), new { id = result.Id }, result); }
    [HttpPatch("{id:guid}")] public async Task<IActionResult> Rename(Guid id, UpdateDocumentRequest request, CancellationToken ct) { await service.RenameAsync(Actor, id, request.Name, request.Tags, ct); return NoContent(); }
    [HttpDelete("{id:guid}")] public async Task<IActionResult> Delete(Guid id, CancellationToken ct) { await service.DeleteAsync(Actor, id, ct); return NoContent(); }
    [HttpGet("{id:guid}/download")] public async Task<IActionResult> Download(Guid id, CancellationToken ct) { var f = await service.DownloadAsync(Actor, id, ct); return File(f.Stream, f.ContentType, f.Name); }
    [HttpPost("{id:guid}/analyses")] public Task<AnalysisResult> Analyze(Guid id, StartAnalysisRequest request, CancellationToken ct) => service.StartAnalysisAsync(Actor, id, request.Purpose, request.UserRole, ct);
    [HttpGet("{id:guid}/analyses")] public IReadOnlyList<AnalysisResult> Analyses(Guid id) => service.Analyses(Actor, id);
}
public sealed record UpdateDocumentRequest(string Name, string? Tags);
public sealed record StartAnalysisRequest(string Purpose, string? UserRole);
