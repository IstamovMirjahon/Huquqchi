using Huquqchi.Domain;

namespace Huquqchi.Application;

public sealed class DocumentService(IUnitOfWork unitOfWork, IFileStorage fileStorage) : IDocumentService
{
    private const long MaxFileSize = 25 * 1024 * 1024;
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        { ".pdf", ".docx", ".jpg", ".jpeg", ".png" };

    public async Task<Result<IReadOnlyList<DocumentListItem>>> ListAsync(
        Actor actor, string? search, DocumentOrigin? origin, CancellationToken cancellationToken)
    {
        var normalizedSearch = search?.Trim().ToLowerInvariant();
        var entities = await unitOfWork.Repository<UploadedDocument>().ListAsync(
            x => x.WorkspaceId == actor.WorkspaceId && !x.IsDeleted &&
                 (origin == null || x.Origin == origin) &&
                 (normalizedSearch == null || x.Name.ToLower().Contains(normalizedSearch) ||
                  x.Tags != null && x.Tags.ToLower().Contains(normalizedSearch)),
            q => q.OrderByDescending(x => x.CreatedAt), cancellationToken: cancellationToken);
        return Result.Success<IReadOnlyList<DocumentListItem>>(entities.Select(Map).ToList());
    }

    public async Task<Result<DocumentListItem>> GetAsync(Actor actor, Guid id, CancellationToken cancellationToken)
    {
        var owned = await GetOwnedAsync(actor, id, cancellationToken);
        return owned.IsFailure ? Result.Failure<DocumentListItem>(owned.Error) : Result.Success(Map(owned.Value));
    }

    public async Task<Result<DocumentListItem>> UploadAsync(Actor actor, UploadDocumentCommand command, CancellationToken cancellationToken)
    {
        var extension = Path.GetExtension(command.FileName);
        if (!AllowedExtensions.Contains(extension)) return Result.Failure<DocumentListItem>(ApplicationErrors.Documents.InvalidType);
        if (command.Length <= 0 || command.Length > MaxFileSize) return Result.Failure<DocumentListItem>(ApplicationErrors.Documents.InvalidSize);

        var saved = await fileStorage.SaveAsync(command.Content, extension, cancellationToken);
        try
        {
            var sameHashVersions = await unitOfWork.Repository<DocumentVersion>().ListAsync(
                x => x.Sha256 == saved.Sha256, cancellationToken: cancellationToken);
            foreach (var version in sameHashVersions)
            {
                var existing = await unitOfWork.Repository<UploadedDocument>().GetByIdAsync(version.DocumentId, cancellationToken: cancellationToken);
                if (existing is not null && existing.WorkspaceId == actor.WorkspaceId && !existing.IsDeleted)
                {
                    await fileStorage.DeleteAsync(saved.Key, cancellationToken);
                    return Result.Failure<DocumentListItem>(ApplicationErrors.Documents.Duplicate(existing.Id));
                }
            }

            var document = new UploadedDocument(actor.WorkspaceId, actor.UserId, command.FileName, command.ContentType, command.Length, command.Origin);
            await unitOfWork.Repository<UploadedDocument>().AddAsync(document, cancellationToken);
            await unitOfWork.Repository<DocumentVersion>().AddAsync(new DocumentVersion(document.Id, 1, saved.Key, saved.Sha256), cancellationToken);
            await unitOfWork.Repository<AuditEvent>().AddAsync(new AuditEvent(actor.UserId, actor.WorkspaceId, "document.uploaded", nameof(UploadedDocument), document.Id.ToString()), cancellationToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return Result.Success(Map(document));
        }
        catch
        {
            await fileStorage.DeleteAsync(saved.Key, cancellationToken);
            throw;
        }
    }

    public async Task<Result> UpdateAsync(Actor actor, Guid id, UpdateDocumentCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.Name)) return Result.Failure(ApplicationErrors.Documents.EmptyName);
        var owned = await GetOwnedAsync(actor, id, cancellationToken, true);
        if (owned.IsFailure) return Result.Failure(owned.Error);
        owned.Value.Rename(command.Name);
        owned.Value.SetTags(command.Tags);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    public async Task<Result> DeleteAsync(Actor actor, Guid id, CancellationToken cancellationToken)
    {
        var owned = await GetOwnedAsync(actor, id, cancellationToken, true);
        if (owned.IsFailure) return Result.Failure(owned.Error);
        owned.Value.Delete();
        await unitOfWork.Repository<AuditEvent>().AddAsync(new AuditEvent(actor.UserId, actor.WorkspaceId, "document.deleted", nameof(UploadedDocument), id.ToString()), cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    public async Task<Result<DocumentDownload>> DownloadAsync(Actor actor, Guid id, CancellationToken cancellationToken)
    {
        var owned = await GetOwnedAsync(actor, id, cancellationToken);
        if (owned.IsFailure) return Result.Failure<DocumentDownload>(owned.Error);
        var versions = await unitOfWork.Repository<DocumentVersion>().ListAsync(x => x.DocumentId == id,
            q => q.OrderByDescending(x => x.Version), cancellationToken: cancellationToken);
        if (versions.Count == 0) return Result.Failure<DocumentDownload>(ApplicationErrors.Documents.NotFound);
        var stream = await fileStorage.OpenReadAsync(versions[0].StorageKey, cancellationToken);
        return Result.Success(new DocumentDownload(stream, owned.Value.Name, owned.Value.ContentType));
    }

    public async Task<Result<AnalysisResult>> StartAnalysisAsync(Actor actor, Guid id, StartAnalysisCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.Purpose)) return Result.Failure<AnalysisResult>(ApplicationErrors.Documents.EmptyPurpose);
        var owned = await GetOwnedAsync(actor, id, cancellationToken, true);
        if (owned.IsFailure) return Result.Failure<AnalysisResult>(owned.Error);
        var versions = await unitOfWork.Repository<DocumentVersion>().ListAsync(x => x.DocumentId == id,
            q => q.OrderByDescending(x => x.Version), cancellationToken: cancellationToken);
        if (versions.Count == 0) return Result.Failure<AnalysisResult>(ApplicationErrors.Documents.NotFound);

        owned.Value.MarkProcessing();
        var analysis = new Analysis(actor.WorkspaceId, versions[0].Id, command.Purpose, command.UserRole);
        await unitOfWork.Repository<Analysis>().AddAsync(analysis, cancellationToken);
        analysis.Complete("Hujjat saqlandi va tahlil so‘rovi qabul qilindi. AI/OCR provayderi ulanmaguncha avtomatik huquqiy xulosa berilmaydi.");
        await unitOfWork.Repository<Finding>().AddAsync(new Finding(analysis.Id, "Provayder integratsiyasi kutilmoqda",
            FindingSeverity.Information, "Hujjat xavfsiz saqlandi; tasdiqlangan provaydersiz huquqiy xulosa to‘qilmadi."), cancellationToken);
        owned.Value.MarkReady();
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return await GetAnalysisAsync(actor, analysis.Id, cancellationToken);
    }

    public async Task<Result<IReadOnlyList<AnalysisResult>>> GetAnalysesAsync(Actor actor, Guid documentId, CancellationToken cancellationToken)
    {
        var owned = await GetOwnedAsync(actor, documentId, cancellationToken);
        if (owned.IsFailure) return Result.Failure<IReadOnlyList<AnalysisResult>>(owned.Error);
        var versions = await unitOfWork.Repository<DocumentVersion>().ListAsync(x => x.DocumentId == documentId, cancellationToken: cancellationToken);
        var versionIds = versions.Select(x => x.Id).ToHashSet();
        var analyses = await unitOfWork.Repository<Analysis>().ListAsync(x => x.WorkspaceId == actor.WorkspaceId,
            q => q.OrderByDescending(x => x.CreatedAt), cancellationToken: cancellationToken);
        var response = new List<AnalysisResult>();
        foreach (var analysis in analyses.Where(x => versionIds.Contains(x.DocumentVersionId)))
        {
            var mapped = await GetAnalysisAsync(actor, analysis.Id, cancellationToken);
            if (mapped.IsSuccess) response.Add(mapped.Value);
        }
        return Result.Success<IReadOnlyList<AnalysisResult>>(response);
    }

    private async Task<Result<AnalysisResult>> GetAnalysisAsync(Actor actor, Guid id, CancellationToken cancellationToken)
    {
        var analysis = await unitOfWork.Repository<Analysis>().FirstOrDefaultAsync(
            x => x.Id == id && x.WorkspaceId == actor.WorkspaceId, cancellationToken: cancellationToken);
        if (analysis is null) return Result.Failure<AnalysisResult>(ApplicationErrors.Analyses.NotFound);
        var findings = await unitOfWork.Repository<Finding>().ListAsync(x => x.AnalysisId == id,
            q => q.OrderBy(x => x.CreatedAt), cancellationToken: cancellationToken);
        return Result.Success(new AnalysisResult(analysis.Id, analysis.Status, analysis.Purpose, analysis.UserRole,
            analysis.Summary, analysis.Error, analysis.CreatedAt,
            findings.Select(x => new FindingItem(x.Title, x.Severity, x.Explanation, x.Excerpt, x.Locator)).ToList()));
    }

    private async Task<Result<UploadedDocument>> GetOwnedAsync(Actor actor, Guid id, CancellationToken cancellationToken, bool tracking = false)
    {
        var document = await unitOfWork.Repository<UploadedDocument>().FirstOrDefaultAsync(
            x => x.Id == id && x.WorkspaceId == actor.WorkspaceId && !x.IsDeleted, tracking, cancellationToken);
        return document is null ? Result.Failure<UploadedDocument>(ApplicationErrors.Documents.NotFound) : Result.Success(document);
    }

    private static DocumentListItem Map(UploadedDocument document) => new(document.Id, document.Name, document.ContentType,
        document.Size, document.Origin, document.Status, document.Tags, document.CreatedAt, document.LastAnalyzedAt);
}
