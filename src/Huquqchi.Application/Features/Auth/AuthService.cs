using Huquqchi.Domain;

namespace Huquqchi.Application;

public sealed class AuthService(
    IUnitOfWork unitOfWork,
    ITokenService tokenService,
    IRefreshTokenFactory refreshTokenFactory,
    IOneTimeCodeService oneTimeCodeService) : IAuthService
{
    public async Task<Result<AuthResponse>> VerifyAsync(VerifyCodeCommand command,
        CancellationToken cancellationToken)
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
            user = new User(normalizedPhone,
                string.IsNullOrWhiteSpace(command.Name) ? "Foydalanuvchi" : command.Name);
            workspace = new Workspace($"{user.Name} ish maydoni", command.WorkspaceKind);
            membership = new Membership(user.Id, workspace.Id, MemberRole.Owner);
            await users.AddAsync(user, cancellationToken);
            await unitOfWork.Repository<Workspace>().AddAsync(workspace, cancellationToken);
            await unitOfWork.Repository<Membership>().AddAsync(membership, cancellationToken);
            await unitOfWork.Repository<Consent>().AddAsync(
                new Consent(user.Id, "terms-and-privacy", "1.0"), cancellationToken);
        }
        else
        {
            membership = await unitOfWork.Repository<Membership>().FirstOrDefaultAsync(
                x => x.UserId == user.Id, cancellationToken: cancellationToken)
                ?? throw new InvalidOperationException("Foydalanuvchi membership yozuvisiz saqlangan.");
            workspace = await unitOfWork.Repository<Workspace>().GetByIdAsync(
                membership.WorkspaceId, cancellationToken: cancellationToken)
                ?? throw new InvalidOperationException("Membership ish maydoniga bog‘lanmagan.");
        }

        var response = await CreateSessionAsync(user.Id, workspace.Id, membership.Role.ToString(),
            Guid.NewGuid(), cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success(response);
    }

    public async Task<Result<AuthResponse>> RefreshAsync(RefreshTokenCommand command,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.RefreshToken))
            return Result.Failure<AuthResponse>(ApplicationErrors.Auth.InvalidRefreshToken);

        var now = DateTimeOffset.UtcNow;
        var tokenHash = refreshTokenFactory.Hash(command.RefreshToken);
        var sessions = unitOfWork.Repository<RefreshSession>();
        var current = await sessions.FirstOrDefaultAsync(x => x.TokenHash == tokenHash, true, cancellationToken);
        if (current is null) return Result.Failure<AuthResponse>(ApplicationErrors.Auth.InvalidRefreshToken);

        if (!current.IsActive(now))
        {
            if (current.ReplacedByTokenHash is not null)
            {
                var family = await sessions.ListAsync(x => x.FamilyId == current.FamilyId,
                    asTracking: true, cancellationToken: cancellationToken);
                foreach (var session in family.Where(x => x.IsActive(now))) session.Revoke(now);
                await unitOfWork.SaveChangesAsync(cancellationToken);
            }

            return Result.Failure<AuthResponse>(ApplicationErrors.Auth.InvalidRefreshToken);
        }

        var membership = await unitOfWork.Repository<Membership>().FirstOrDefaultAsync(
            x => x.UserId == current.UserId && x.WorkspaceId == current.WorkspaceId,
            cancellationToken: cancellationToken);
        if (membership is null) return Result.Failure<AuthResponse>(ApplicationErrors.Auth.InvalidRefreshToken);

        var replacement = refreshTokenFactory.Create();
        current.Rotate(replacement.TokenHash, now);
        await sessions.AddAsync(new RefreshSession(current.UserId, current.WorkspaceId, current.FamilyId,
            replacement.TokenHash, replacement.ExpiresAt), cancellationToken);

        var role = membership.Role.ToString();
        var access = tokenService.Create(current.UserId, current.WorkspaceId, role);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success(ToResponse(access, replacement, current.UserId, current.WorkspaceId, role));
    }

    public async Task<Result> LogoutAsync(LogoutCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.RefreshToken)) return Result.Success();
        var tokenHash = refreshTokenFactory.Hash(command.RefreshToken);
        var session = await unitOfWork.Repository<RefreshSession>().FirstOrDefaultAsync(
            x => x.TokenHash == tokenHash, true, cancellationToken);
        if (session is null) return Result.Success();
        session.Revoke(DateTimeOffset.UtcNow);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    private async Task<AuthResponse> CreateSessionAsync(Guid userId, Guid workspaceId, string role,
        Guid familyId, CancellationToken cancellationToken)
    {
        var access = tokenService.Create(userId, workspaceId, role);
        var refresh = refreshTokenFactory.Create();
        await unitOfWork.Repository<RefreshSession>().AddAsync(
            new RefreshSession(userId, workspaceId, familyId, refresh.TokenHash, refresh.ExpiresAt),
            cancellationToken);
        return ToResponse(access, refresh, userId, workspaceId, role);
    }

    private static AuthResponse ToResponse(IssuedAccessToken access, IssuedRefreshToken refresh,
        Guid userId, Guid workspaceId, string role) =>
        new(access.Token, access.ExpiresAt, refresh.Token, refresh.ExpiresAt, userId, workspaceId, role);
}
