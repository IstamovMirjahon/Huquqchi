using Huquqchi.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Huquqchi.Api.Controllers;

[ApiController, Authorize, Route("api/v1/files")]
[Produces("application/json")]
public sealed class FilesController(IFileService service) : ApiController
{
    /// <summary>
    /// Upload for order chat, KYC, job attachments, deliveries or avatar. PDF, DOCX, DOC, XLSX, JPG, PNG, ZIP up to
    /// 25 MB; KYC accepts JPG/PNG/PDF up to 10 MB. The returned <c>url</c> is valid for 5 minutes.
    /// </summary>
    [HttpPost, RequestSizeLimit(26 * 1024 * 1024)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(FileRef), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status413PayloadTooLarge)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status415UnsupportedMediaType)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult> Upload(IFormFile file, [FromForm] string? purpose, CancellationToken ct)
    {
        await using var stream = file.OpenReadStream();
        var result = await service.UploadAsync(Actor, new FileUpload(stream, file.FileName, file.Length, purpose), ct);
        return Created(result, x => $"/api/v1/files/{x.Id}");
    }

    /// <summary>File metadata with a fresh signed <c>url</c>.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(FileRef), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FileRef>> Get(Guid id, CancellationToken ct) =>
        (await service.GetAsync(Actor, id, ct)).ToActionResult(this);

    /// <summary>Downloads the file through a signed link. No bearer token: the signature is the credential.</summary>
    [HttpGet("{id:guid}/content"), AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Content(Guid id, [FromQuery] long expires, [FromQuery] string? sig, CancellationToken ct)
    {
        var result = await service.OpenSignedAsync(id, expires, sig, ct);
        if (result.IsFailure) return this.ToProblem(result.Error);
        Response.Headers.CacheControl = "private, no-store";
        Response.Headers.XContentTypeOptions = "nosniff";
        return File(result.Value.Content, result.Value.Mime, result.Value.Name);
    }
}
