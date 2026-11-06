namespace Huquqchi.Application;

public interface ILegalCatalogService
{
    Task<Result<IReadOnlyList<LegalSearchItem>>> SearchAsync(string? query, CancellationToken cancellationToken);
    Task<Result<LegalDocumentDetails>> GetDetailsAsync(Guid id, CancellationToken cancellationToken);
}
