using Huquqchi.Domain;

namespace Huquqchi.Application;

public sealed class AuthService(IUnitOfWork unitOfWork, ITokenService tokenService, IOneTimeCodeService oneTimeCodeService) : IAuthService
{
    public async Task<Result<AuthResponse>> VerifyAsync(VerifyCodeCommand command, CancellationToken cancellationToken)
    {
        var normalizedPhone = PhoneNumber.Normalize(command.Phone);
        if (normalizedPhone is null) return Result.Failure<AuthResponse>(ApplicationErrors.Auth.InvalidPhone);
        var verified = await oneTimeCodeService.VerifyAsync(normalizedPhone, command.Code, cancellationToken);
        if (verified.IsFailure) return Result.Failure<AuthResponse>(verified.Error);

        var users = unitOfWork.Repository<User>();
        var user = await users.FirstOrDefaultAsync(x => x.Phone == normalizedPhone, true, cancellationToken);
        Workspace workspace;
        Membership membership;

        if (user is null)
        {
            user = new User(normalizedPhone, string.IsNullOrWhiteSpace(command.Name) ? "Foydalanuvchi" : command.Name);
            workspace = new Workspace($"{user.Name} ish maydoni", command.WorkspaceKind);
            membership = new Membership(user.Id, workspace.Id, MemberRole.Owner);
            await users.AddAsync(user, cancellationToken);
            await unitOfWork.Repository<Workspace>().AddAsync(workspace, cancellationToken);
            await unitOfWork.Repository<Membership>().AddAsync(membership, cancellationToken);
            await unitOfWork.Repository<Consent>().AddAsync(new Consent(user.Id, "terms-and-privacy", "1.0"), cancellationToken);
        }
        else
        {
            membership = await unitOfWork.Repository<Membership>().FirstOrDefaultAsync(x => x.UserId == user.Id, cancellationToken: cancellationToken)
                ?? throw new InvalidOperationException("Foydalanuvchi membership yozuvisiz saqlangan.");
            workspace = await unitOfWork.Repository<Workspace>().GetByIdAsync(membership.WorkspaceId, cancellationToken: cancellationToken)
                ?? throw new InvalidOperationException("Membership ish maydoniga bog‘lanmagan.");
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        var role = membership.Role.ToString();
        return Result.Success(new AuthResponse(tokenService.Create(user.Id, workspace.Id, role), user.Id, workspace.Id, role));
    }
}
