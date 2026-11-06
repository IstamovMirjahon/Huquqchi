namespace Huquqchi.Application;

public interface IProfileService
{
    Task<Result<ProfileResponse>> GetAsync(Actor actor, CancellationToken cancellationToken);
    Task<Result> UpdateAsync(Actor actor, UpdateProfileCommand command, CancellationToken cancellationToken);
}
