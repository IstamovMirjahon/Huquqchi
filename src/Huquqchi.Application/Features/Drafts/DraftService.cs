using System.Text.Json;
using Huquqchi.Domain;

namespace Huquqchi.Application;

public sealed class DraftService(IUnitOfWork unitOfWork) : IDraftService
{
    public async Task<Result<IReadOnlyList<TemplateItem>>> GetTemplatesAsync(CancellationToken cancellationToken)
    {
        var templates = await unitOfWork.Repository<Template>().ListAsync(x => x.Status == ContentStatus.Published,
            q => q.OrderBy(x => x.Name), cancellationToken: cancellationToken);
        return Result.Success<IReadOnlyList<TemplateItem>>(templates
            .Select(x => new TemplateItem(x.Id, x.Code, x.Name, x.Category, x.SchemaJson)).ToList());
    }

    public async Task<Result<IReadOnlyList<DraftItem>>> ListAsync(Actor actor, CancellationToken cancellationToken)
    {
        var drafts = await unitOfWork.Repository<Draft>().ListAsync(x => x.WorkspaceId == actor.WorkspaceId,
            q => q.OrderByDescending(x => x.CreatedAt), cancellationToken: cancellationToken);
        return Result.Success<IReadOnlyList<DraftItem>>(drafts.Select(Map).ToList());
    }

    public async Task<Result<DraftItem>> CreateAsync(Actor actor, CreateDraftCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.Name)) return Result.Failure<DraftItem>(ApplicationErrors.Templates.EmptyName);
        var template = await unitOfWork.Repository<Template>().FirstOrDefaultAsync(
            x => x.Id == command.TemplateId && x.Status == ContentStatus.Published, cancellationToken: cancellationToken);
        if (template is null) return Result.Failure<DraftItem>(ApplicationErrors.Templates.NotFound);

        var content = template.Body;
        foreach (var field in command.Fields)
            content = content.Replace("{{" + field.Key + "}}",
                string.IsNullOrWhiteSpace(field.Value) ? $"[TO‘LDIRING: {field.Key}]" : field.Value);
        var draft = new Draft(actor.WorkspaceId, actor.UserId, command.TemplateId, command.Name,
            JsonSerializer.Serialize(command.Fields), content);
        await unitOfWork.Repository<Draft>().AddAsync(draft, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success(Map(draft));
    }

    private static DraftItem Map(Draft value) => new(value.Id, value.TemplateId, value.Name,
        value.DataJson, value.RenderedContent, value.CreatedAt);
}
