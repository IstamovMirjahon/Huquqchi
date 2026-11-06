using Huquqchi.Domain;

namespace Huquqchi.Application;

public sealed class ProfileService(IUnitOfWork unitOfWork) : IProfileService
{
    public async Task<Result<ProfileResponse>> GetAsync(Actor actor, CancellationToken cancellationToken)
    {
        var user = await unitOfWork.Repository<User>().GetByIdAsync(actor.UserId, cancellationToken: cancellationToken);
        if (user is null) return Result.Failure<ProfileResponse>(ApplicationErrors.Profile.UserNotFound);
        var workspace = await unitOfWork.Repository<Workspace>().GetByIdAsync(actor.WorkspaceId, cancellationToken: cancellationToken);
        if (workspace is null) return Result.Failure<ProfileResponse>(ApplicationErrors.Profile.WorkspaceNotFound);
        return Result.Success(new ProfileResponse(user.Id, user.Name, user.Phone, user.Language,
            new WorkspaceResponse(workspace.Id, workspace.Name, workspace.Kind), actor.Role));
    }

    public async Task<Result> UpdateAsync(Actor actor, UpdateProfileCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.Name)) return Result.Failure(ApplicationErrors.Profile.EmptyName);
        var user = await unitOfWork.Repository<User>().GetByIdAsync(actor.UserId, true, cancellationToken);
        if (user is null) return Result.Failure(ApplicationErrors.Profile.UserNotFound);
        user.UpdateProfile(command.Name, command.Language);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
