using Huquqchi.Domain;

namespace Huquqchi.Application;

public interface IDocumentService
{
    Task<Result<IReadOnlyList<DocumentListItem>>> ListAsync(Actor actor, string? search, DocumentOrigin? origin, CancellationToken cancellationToken);
    Task<Result<DocumentListItem>> GetAsync(Actor actor, Guid id, CancellationToken cancellationToken);
    Task<Result<DocumentListItem>> UploadAsync(Actor actor, UploadDocumentCommand command, CancellationToken cancellationToken);
    Task<Result> UpdateAsync(Actor actor, Guid id, UpdateDocumentCommand command, CancellationToken cancellationToken);
    Task<Result> DeleteAsync(Actor actor, Guid id, CancellationToken cancellationToken);
    Task<Result<DocumentDownload>> DownloadAsync(Actor actor, Guid id, CancellationToken cancellationToken);
    Task<Result<AnalysisResult>> StartAnalysisAsync(Actor actor, Guid id, StartAnalysisCommand command, CancellationToken cancellationToken);
    Task<Result<IReadOnlyList<AnalysisResult>>> GetAnalysesAsync(Actor actor, Guid documentId, CancellationToken cancellationToken);
}
