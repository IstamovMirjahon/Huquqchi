using Huquqchi.Domain;

namespace Huquqchi.Application;

public sealed class LegalCatalogService(IUnitOfWork unitOfWork) : ILegalCatalogService
{
    public async Task<Result<IReadOnlyList<LegalSearchItem>>> SearchAsync(string? query, CancellationToken cancellationToken)
    {
        var normalized = query?.Trim().ToLowerInvariant();
        var documents = await unitOfWork.Repository<LegalDocument>().ListAsync(
            x => x.Status == ContentStatus.Published &&
                 (normalized == null || x.Title.ToLower().Contains(normalized) || x.Number.ToLower().Contains(normalized)),
            q => q.OrderBy(x => x.Title), cancellationToken: cancellationToken);
        return Result.Success<IReadOnlyList<LegalSearchItem>>(documents
            .Select(x => new LegalSearchItem(x.Id, x.Title, x.Type, x.Number, x.OfficialUrl)).ToList());
    }

    public async Task<Result<LegalDocumentDetails>> GetDetailsAsync(Guid id, CancellationToken cancellationToken)
    {
        var document = await unitOfWork.Repository<LegalDocument>().FirstOrDefaultAsync(
            x => x.Id == id && x.Status == ContentStatus.Published, cancellationToken: cancellationToken);
        if (document is null) return Result.Failure<LegalDocumentDetails>(ApplicationErrors.LegalDocuments.NotFound);
        var versions = await unitOfWork.Repository<LegalVersion>().ListAsync(x => x.LegalDocumentId == id,
            q => q.OrderByDescending(x => x.EffectiveFrom), cancellationToken: cancellationToken);
        var resultVersions = new List<LegalVersionItem>();
        foreach (var version in versions)
        {
            var sections = await unitOfWork.Repository<LegalSection>().ListAsync(x => x.LegalVersionId == version.Id,
                q => q.OrderBy(x => x.Number), cancellationToken: cancellationToken);
            resultVersions.Add(new LegalVersionItem(version.Id, version.EffectiveFrom, version.EffectiveTo, version.IsCurrent,
                version.SourceUrl, sections.Select(x => new LegalSectionItem(x.Id, x.Number, x.Title, x.Text)).ToList()));
        }
        return Result.Success(new LegalDocumentDetails(document.Id, document.Title, document.Type, document.Number,
            document.OfficialUrl, resultVersions));
    }
}
