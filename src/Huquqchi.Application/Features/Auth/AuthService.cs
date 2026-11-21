using Huquqchi.Domain;

namespace Huquqchi.Application;

public sealed class AuthService(
    IUnitOfWork unitOfWork,
    ITokenService tokenService,
    IRefreshTokenFactory refreshTokenFactory,
    IOneTimeCodeService oneTimeCodeService,
    IMeService meService,
    AuthSettings settings,
    TimeProvider timeProvider) : IAuthService
{
    public const int ResendAfterSeconds = 60;
    public const int MaxCodesPerHour = 5;
    private static readonly TimeSpan RateWindow = TimeSpan.FromHours(1);
    private const string TermsPolicy = "terms-and-privacy";
    private const string TermsVersion = "1.0";

    public async Task<Result<RequestCodeResponse>> RequestCodeAsync(RequestCodeCommand command,
        CancellationToken cancellationToken)
    {
        var phone = PhoneNumber.Normalize(command.Phone);
        if (phone is null) return Result.Failure<RequestCodeResponse>(ApplicationErrors.Auth.InvalidPhone);

        var channel = OtpDeliveryChannel.Telegram;
        if (!string.IsNullOrWhiteSpace(command.Channel) && !EnumCode.TryParse(command.Channel, out channel))
            return Result.Failure<RequestCodeResponse>(ApplicationErrors.Common.InvalidRequest
                .WithField("channel", "Kanal faqat telegram yoki sms bo‘lishi mumkin."));

        var isNewUser = !await unitOfWork.Repository<User>().AnyAsync(x => x.Phone == phone, cancellationToken);

        if (channel == OtpDeliveryChannel.Sms)
        {
            if (!settings.SmsEnabled) return Result.Failure<RequestCodeResponse>(ApplicationErrors.Auth.ChannelUnavailable);
            var limited = await CheckRateLimitAsync(phone, cancellationToken);
            if (limited.IsFailure) return Result.Failure<RequestCodeResponse>(limited.Error);
            await EnqueueAsync(new OtpDeliveryRequest(phone, OtpDeliveryChannel.Sms, null), cancellationToken);
            return Result.Success(new RequestCodeResponse("Tasdiqlash kodi SMS orqali yuborildi.", "sms", null,
                isNewUser, ResendAfterSeconds, CodeSent: true));
        }

        // Telegram: push the code straight into the chat when the phone is already linked to the bot.
        // Otherwise the user has to open the bot once and share the contact (the bot then sends the code itself).
        var account = await unitOfWork.Repository<TelegramAccount>()
            .FirstOrDefaultAsync(x => x.Phone == phone, cancellationToken: cancellationToken);
        if (account is null)
            return Result.Success(new RequestCodeResponse(
                "Kodni olish uchun Telegram botni oching va telefon raqamingizni yuboring.", "telegram",
                settings.TelegramBotUrl, isNewUser, ResendAfterSeconds, CodeSent: false));

        var rate = await CheckRateLimitAsync(phone, cancellationToken);
        if (rate.IsFailure) return Result.Failure<RequestCodeResponse>(rate.Error);
        await EnqueueAsync(new OtpDeliveryRequest(phone, OtpDeliveryChannel.Telegram, account.TelegramUserId),
            cancellationToken);
        return Result.Success(new RequestCodeResponse("Tasdiqlash kodi Telegram orqali yuborildi.", "telegram",
            settings.TelegramBotUrl, isNewUser, ResendAfterSeconds, CodeSent: true));
    }

    public async Task<Result<AuthResponse>> VerifyAsync(VerifyCodeCommand command,
        CancellationToken cancellationToken)
    {
        var phone = PhoneNumber.Normalize(command.Phone);
        if (phone is null) return Result.Failure<AuthResponse>(ApplicationErrors.Auth.InvalidPhone);

        var users = unitOfWork.Repository<User>();
        var user = await users.FirstOrDefaultAsync(x => x.Phone == phone, true, cancellationToken);
        var role = UserRole.Client;

        // Validate sign-up fields before consuming the code, so the user can correct them and retry.
        if (user is null)
        {
            if (string.IsNullOrWhiteSpace(command.Name))
                return Result.Failure<AuthResponse>(ApplicationErrors.Auth.NameRequired);
            if (!command.AcceptTerms)
                return Result.Failure<AuthResponse>(ApplicationErrors.Auth.TermsRequired);
            if (!string.IsNullOrWhiteSpace(command.Role) &&
                (!EnumCode.TryParse(command.Role, out role) || role is not (UserRole.Client or UserRole.Lawyer)))
                return Result.Failure<AuthResponse>(ApplicationErrors.Auth.InvalidRole);
        }
        else if (!user.CanAuthenticate)
        {
            return Result.Failure<AuthResponse>(ApplicationErrors.Auth.Blocked);
        }

        var verified = await oneTimeCodeService.VerifyAsync(phone, command.Code, cancellationToken);
        if (verified.IsFailure) return Result.Failure<AuthResponse>(verified.Error);

        Guid workspaceId;
        LawyerProfile? lawyerProfile = null;
        if (user is null)
        {
            user = new User(phone, command.Name!, role);
            var workspace = new Workspace(command.WorkspaceKind == WorkspaceKind.Personal ? "Shaxsiy" : $"{user.Name} biznes",
                command.WorkspaceKind);
            workspaceId = workspace.Id;
            await users.AddAsync(user, cancellationToken);
            await unitOfWork.Repository<Workspace>().AddAsync(workspace, cancellationToken);
            await unitOfWork.Repository<Membership>().AddAsync(new Membership(user.Id, workspace.Id, MemberRole.Owner),
                cancellationToken);
            await unitOfWork.Repository<Consent>().AddAsync(new Consent(user.Id, TermsPolicy, TermsVersion),
                cancellationToken);
            if (role == UserRole.Lawyer)
            {
                lawyerProfile = new LawyerProfile(user.Id);
                await unitOfWork.Repository<LawyerProfile>().AddAsync(lawyerProfile, cancellationToken);
            }
        }
        else
        {
            var membership = await unitOfWork.Repository<Membership>().FirstOrDefaultAsync(
                    x => x.UserId == user.Id, cancellationToken: cancellationToken)
                ?? throw new InvalidOperationException("Foydalanuvchi membership yozuvisiz saqlangan.");
            workspaceId = membership.WorkspaceId;
            lawyerProfile = await GetLawyerProfileAsync(user, cancellationToken);
        }

        var session = await StartSessionAsync(user, workspaceId, lawyerProfile, Guid.NewGuid(), command.Client,
            null, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return await ToResponseAsync(session, user, workspaceId, cancellationToken);
    }

    public async Task<Result<AuthResponse>> RefreshAsync(RefreshTokenCommand command,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.RefreshToken))
            return Result.Failure<AuthResponse>(ApplicationErrors.Auth.InvalidRefreshToken);

        var now = timeProvider.GetUtcNow();
        var tokenHash = refreshTokenFactory.Hash(command.RefreshToken);
        var sessions = unitOfWork.Repository<RefreshSession>();
        var current = await sessions.FirstOrDefaultAsync(x => x.TokenHash == tokenHash, true, cancellationToken);
        if (current is null) return Result.Failure<AuthResponse>(ApplicationErrors.Auth.InvalidRefreshToken);

        if (!current.IsActive(now))
        {
            // A rotated token was presented again: treat it as stolen and end the whole device session.
            if (current.ReplacedByTokenHash is not null)
            {
                await RevokeAsync(x => x.FamilyId == current.FamilyId, now, cancellationToken);
                await unitOfWork.SaveChangesAsync(cancellationToken);
            }

            return Result.Failure<AuthResponse>(ApplicationErrors.Auth.InvalidRefreshToken);
        }

        var user = await unitOfWork.Repository<User>().GetByIdAsync(current.UserId, cancellationToken: cancellationToken);
        var isMember = user is not null && await unitOfWork.Repository<Membership>().AnyAsync(
            x => x.UserId == current.UserId && x.WorkspaceId == current.WorkspaceId, cancellationToken);
        if (user is null || !isMember || !user.CanAuthenticate)
        {
            current.Revoke(now);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return Result.Failure<AuthResponse>(user is { IsBlocked: true }
                ? ApplicationErrors.Auth.Blocked
                : ApplicationErrors.Auth.InvalidRefreshToken);
        }

        var lawyerProfile = await GetLawyerProfileAsync(user, cancellationToken);
        var issued = await StartSessionAsync(user, current.WorkspaceId, lawyerProfile, current.FamilyId,
            command.Client, current, cancellationToken);
        current.Rotate(issued.Refresh.TokenHash, now);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return await ToResponseAsync(issued, user, current.WorkspaceId, cancellationToken);
    }

    public async Task<Result> LogoutAsync(LogoutCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.RefreshToken)) return Result.Success();
        var tokenHash = refreshTokenFactory.Hash(command.RefreshToken);
        var session = await unitOfWork.Repository<RefreshSession>().FirstOrDefaultAsync(
            x => x.TokenHash == tokenHash, true, cancellationToken);
        if (session is null) return Result.Success();
        session.Revoke(timeProvider.GetUtcNow());
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    public async Task<Result<IReadOnlyList<SessionItem>>> ListSessionsAsync(Actor actor,
        CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow();
        var active = await unitOfWork.Repository<RefreshSession>().ListAsync(
            x => x.UserId == actor.UserId && x.RevokedAt == null && x.ExpiresAt > now,
            q => q.OrderByDescending(x => x.LastActiveAt), cancellationToken: cancellationToken);

        // Rotation keeps exactly one active row per family; guard anyway so a device never appears twice.
        var items = active
            .GroupBy(x => x.FamilyId)
            .Select(group => group.OrderByDescending(x => x.LastActiveAt).First())
            .Select(x => new SessionItem(x.FamilyId, x.Device, ClientInfoFormatter.MaskIp(x.IpAddress), null,
                x.SessionStartedAt, x.LastActiveAt, x.FamilyId == actor.SessionId))
            .OrderByDescending(x => x.IsCurrent).ThenByDescending(x => x.LastActiveAt)
            .ToList();
        return Result.Success<IReadOnlyList<SessionItem>>(items);
    }

    public async Task<Result> RevokeSessionAsync(Actor actor, Guid sessionId, CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow();
        var revoked = await RevokeAsync(x => x.UserId == actor.UserId && x.FamilyId == sessionId, now, cancellationToken);
        if (revoked == 0) return Result.Failure(ApplicationErrors.Auth.SessionNotFound);
        await unitOfWork.Repository<AuditEvent>().AddAsync(new AuditEvent(actor.UserId, actor.WorkspaceId,
            "session.revoked", nameof(RefreshSession), sessionId.ToString()), cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    public async Task<Result> LogoutAllAsync(Actor actor, CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow();
        var current = actor.SessionId;
        await RevokeAsync(x => x.UserId == actor.UserId && x.FamilyId != current, now, cancellationToken);
        await unitOfWork.Repository<AuditEvent>().AddAsync(new AuditEvent(actor.UserId, actor.WorkspaceId,
            "session.logout_all", nameof(RefreshSession), current?.ToString()), cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    private async Task<Result> CheckRateLimitAsync(string phone, CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow();
        var since = now - RateWindow;
        var issued = await unitOfWork.Repository<OtpChallenge>().ListAsync(
            x => x.Phone == phone && x.CreatedAt >= since, cancellationToken: cancellationToken);
        // Requests that are already sent produced a challenge above; count only the ones still in flight.
        var queued = await unitOfWork.Repository<OtpDeliveryRequest>().ListAsync(
            x => x.Phone == phone && x.CreatedAt >= since, cancellationToken: cancellationToken);

        var timestamps = issued.Select(x => x.CreatedAt).Concat(queued.Select(x => x.CreatedAt)).ToList();
        if (timestamps.Count == 0) return Result.Success();

        var cooldownEnds = timestamps.Max().AddSeconds(ResendAfterSeconds);
        if (cooldownEnds > now)
            return Result.Failure(ApplicationErrors.Auth.CodeRateLimited(SecondsUntil(cooldownEnds, now)));

        var inWindow = issued.Count + queued.Count(x => x.Status is OtpDeliveryStatus.Pending or OtpDeliveryStatus.Processing);
        if (inWindow >= MaxCodesPerHour)
            return Result.Failure(ApplicationErrors.Auth.CodeRateLimited(SecondsUntil(timestamps.Min() + RateWindow, now)));

        return Result.Success();
    }

    private async Task EnqueueAsync(OtpDeliveryRequest request, CancellationToken cancellationToken)
    {
        await unitOfWork.Repository<OtpDeliveryRequest>().AddAsync(request, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<IssuedSession> StartSessionAsync(User user, Guid workspaceId, LawyerProfile? lawyerProfile,
        Guid familyId, ClientInfo? client, RefreshSession? previous, CancellationToken cancellationToken)
    {
        var role = user.Role.ToCode();
        var access = tokenService.Create(new AccessTokenSubject(user.Id, workspaceId, role,
            lawyerProfile?.Status.ToCode(), familyId));
        var refresh = refreshTokenFactory.Create();
        var device = ClientInfoFormatter.DescribeDevice(client?.UserAgent) ?? previous?.Device;
        await unitOfWork.Repository<RefreshSession>().AddAsync(
            new RefreshSession(user.Id, workspaceId, familyId, refresh.TokenHash, refresh.ExpiresAt,
                device, client?.IpAddress ?? previous?.IpAddress, previous?.SessionStartedAt),
            cancellationToken);
        return new IssuedSession(access, refresh, role);
    }

    private async Task<Result<AuthResponse>> ToResponseAsync(IssuedSession session, User user, Guid workspaceId,
        CancellationToken cancellationToken)
    {
        var me = await meService.GetAsync(new Actor(user.Id, workspaceId, session.Role), cancellationToken);
        if (me.IsFailure) return Result.Failure<AuthResponse>(me.Error);
        return Result.Success(new AuthResponse(session.Access.Token, session.Access.ExpiresAt, session.Refresh.Token,
            session.Refresh.ExpiresAt, user.Id, workspaceId, session.Role, me.Value));
    }

    private Task<LawyerProfile?> GetLawyerProfileAsync(User user, CancellationToken cancellationToken) =>
        user.Role == UserRole.Lawyer
            ? unitOfWork.Repository<LawyerProfile>().FirstOrDefaultAsync(x => x.UserId == user.Id,
                cancellationToken: cancellationToken)
            : Task.FromResult<LawyerProfile?>(null);

    private async Task<int> RevokeAsync(System.Linq.Expressions.Expression<Func<RefreshSession, bool>> predicate,
        DateTimeOffset now, CancellationToken cancellationToken)
    {
        var rows = await unitOfWork.Repository<RefreshSession>().ListAsync(predicate, asTracking: true,
            cancellationToken: cancellationToken);
        foreach (var row in rows.Where(x => x.IsActive(now))) row.Revoke(now);
        return rows.Count;
    }

    private static int SecondsUntil(DateTimeOffset moment, DateTimeOffset now) =>
        Math.Max(1, (int)Math.Ceiling((moment - now).TotalSeconds));

    private sealed record IssuedSession(IssuedAccessToken Access, IssuedRefreshToken Refresh, string Role);
}
