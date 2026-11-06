namespace Huquqchi.Application;

public interface IDraftService
{
    Task<Result<IReadOnlyList<TemplateItem>>> GetTemplatesAsync(CancellationToken cancellationToken);
    Task<Result<IReadOnlyList<DraftItem>>> ListAsync(Actor actor, CancellationToken cancellationToken);
    Task<Result<DraftItem>> CreateAsync(Actor actor, CreateDraftCommand command, CancellationToken cancellationToken);
}
