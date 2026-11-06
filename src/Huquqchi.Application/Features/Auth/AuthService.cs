using Huquqchi.Domain;

namespace Huquqchi.Application;

public sealed class AuthService(IUnitOfWork unitOfWork, ITokenService tokenService) : IAuthService
{
    public async Task<Result<AuthResponse>> VerifyAsync(VerifyCodeCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.Phone)) return Result.Failure<AuthResponse>(ApplicationErrors.Auth.InvalidPhone);
        if (command.Code != command.ExpectedCode) return Result.Failure<AuthResponse>(ApplicationErrors.Auth.InvalidCode);

        var users = unitOfWork.Repository<User>();
        var user = await users.FirstOrDefaultAsync(x => x.Phone == command.Phone.Trim(), true, cancellationToken);
        Workspace workspace;
        Membership membership;

        if (user is null)
        {
            user = new User(command.Phone, string.IsNullOrWhiteSpace(command.Name) ? "Foydalanuvchi" : command.Name);
            workspace = new Workspace($"{user.Name} ish maydoni", command.WorkspaceKind);
            membership = new Membership(user.Id, workspace.Id, MemberRole.Owner);
            await users.AddAsync(user, cancellationToken);
            await unitOfWork.Repository<Workspace>().AddAsync(workspace, cancellationToken);
            await unitOfWork.Repository<Membership>().AddAsync(membership, cancellationToken);
            await unitOfWork.Repository<Consent>().AddAsync(new Consent(user.Id, "terms-and-privacy", "1.0"), cancellationToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        else
        {
            membership = await unitOfWork.Repository<Membership>().FirstOrDefaultAsync(x => x.UserId == user.Id, cancellationToken: cancellationToken)
                ?? throw new InvalidOperationException("Foydalanuvchi membership yozuvisiz saqlangan.");
            workspace = await unitOfWork.Repository<Workspace>().GetByIdAsync(membership.WorkspaceId, cancellationToken: cancellationToken)
                ?? throw new InvalidOperationException("Membership ish maydoniga bog‘lanmagan.");
        }

        var role = membership.Role.ToString();
        return Result.Success(new AuthResponse(tokenService.Create(user.Id, workspace.Id, role), user.Id, workspace.Id, role));
    }
}
