using System.Net.Mail;
using Huquqchi.Domain;

namespace Huquqchi.Application;

public sealed class MeService(
    IUnitOfWork unitOfWork,
    IUsageService usageService,
    IFileService fileService,
    TimeProvider timeProvider) : IMeService
{
    public const string DeleteConfirmation = "O‘CHIRISH";

    public async Task<Result<MeResponse>> GetAsync(Actor actor, CancellationToken cancellationToken)
    {
        var user = await unitOfWork.Repository<User>().GetByIdAsync(actor.UserId, cancellationToken: cancellationToken);
        if (user is null || user.IsDeleted) return Result.Failure<MeResponse>(ApplicationErrors.Profile.UserNotFound);
        var workspace = await unitOfWork.Repository<Workspace>().GetByIdAsync(actor.WorkspaceId, cancellationToken: cancellationToken);
        if (workspace is null) return Result.Failure<MeResponse>(ApplicationErrors.Profile.WorkspaceNotFound);

        var lawyer = user.Role == UserRole.Lawyer
            ? await unitOfWork.Repository<LawyerProfile>().FirstOrDefaultAsync(x => x.UserId == user.Id,
                cancellationToken: cancellationToken)
            : null;
        var plan = PlanCatalog.DefaultFor(user.Role);
        var usage = await usageService.GetAsync(actor, plan, cancellationToken);

        return Result.Success(new MeResponse(
            user.Id,
            user.Name,
            user.Phone,
            user.Email,
            user.AvatarFileId is { } avatarId ? fileService.CreateUrl(avatarId) : null,
            user.Language,
            user.Role.ToCode(),
            lawyer?.Status.ToCode(),
            lawyer?.Id,
            new WorkspaceResponse(workspace.Id, workspace.Name, workspace.Kind),
            new SubscriptionSummary(plan.Code, plan.Name, "active", null, false),
            usage,
            UnreadNotifications: 0, // Notifications module arrives in phase 7; no notifications exist yet.
            user.CreatedAt));
    }

    public async Task<Result<MeResponse>> UpdateAsync(Actor actor, UpdateMeCommand command,
        CancellationToken cancellationToken)
    {
        if (command.Name is not null && string.IsNullOrWhiteSpace(command.Name))
            return Result.Failure<MeResponse>(ApplicationErrors.Me.EmptyName.WithField("name", ApplicationErrors.Me.EmptyName.Message));
        if (command.Name is { Length: > 160 })
            return Result.Failure<MeResponse>(ApplicationErrors.Me.EmptyName.WithField("name", "Ism 160 belgidan oshmasin."));
        if (command.Language is not null && !SupportedLanguages.All.Contains(command.Language))
            return Result.Failure<MeResponse>(ApplicationErrors.Me.InvalidLanguage);
        if (!string.IsNullOrWhiteSpace(command.Email) && !IsValidEmail(command.Email))
            return Result.Failure<MeResponse>(ApplicationErrors.Me.InvalidEmail);

        var user = await GetTrackedUserAsync(actor, cancellationToken);
        if (user is null) return Result.Failure<MeResponse>(ApplicationErrors.Profile.UserNotFound);
        if (command.Name is not null) user.Rename(command.Name);
        if (command.Email is not null) user.ChangeEmail(command.Email);
        if (command.Language is not null) user.ChangeLanguage(command.Language);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return await GetAsync(actor, cancellationToken);
    }

    public async Task<Result<AvatarResponse>> UploadAvatarAsync(Actor actor, FileUpload upload,
        CancellationToken cancellationToken)
    {
        var user = await GetTrackedUserAsync(actor, cancellationToken);
        if (user is null) return Result.Failure<AvatarResponse>(ApplicationErrors.Profile.UserNotFound);
        var file = await fileService.UploadAsync(actor, upload, FilePurpose.Avatar, cancellationToken);
        if (file.IsFailure) return Result.Failure<AvatarResponse>(file.Error);
        user.SetAvatar(file.Value.Id);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success(new AvatarResponse(file.Value.Url));
    }

    public async Task<Result<NotificationSettingsDto>> GetNotificationSettingsAsync(Actor actor,
        CancellationToken cancellationToken)
    {
        var settings = await unitOfWork.Repository<NotificationPreference>().FirstOrDefaultAsync(
            x => x.UserId == actor.UserId, cancellationToken: cancellationToken) ?? new NotificationPreference(actor.UserId);
        return Result.Success(Map(settings));
    }

    public async Task<Result<NotificationSettingsDto>> UpdateNotificationSettingsAsync(Actor actor,
        NotificationSettingsDto command, CancellationToken cancellationToken)
    {
        var unknown = command.Channels.Keys.Where(x => !NotificationPreference.Channels.Contains(x))
            .Concat(command.Types.Keys.Where(x => !NotificationPreference.Types.Contains(x))).ToList();
        if (unknown.Count > 0)
            return Result.Failure<NotificationSettingsDto>(ApplicationErrors.Me.InvalidNotificationKey
                .WithField(unknown[0], ApplicationErrors.Me.InvalidNotificationKey.Message));

        var repository = unitOfWork.Repository<NotificationPreference>();
        var settings = await repository.FirstOrDefaultAsync(x => x.UserId == actor.UserId, true, cancellationToken);
        if (settings is null)
        {
            settings = new NotificationPreference(actor.UserId);
            await repository.AddAsync(settings, cancellationToken);
        }

        settings.Update(command.Channels, command.Types);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success(Map(settings));
    }

    public async Task<Result<DataExportResponse>> RequestExportAsync(Actor actor, CancellationToken cancellationToken)
    {
        var request = new DataExportRequest(actor.UserId);
        await unitOfWork.Repository<DataExportRequest>().AddAsync(request, cancellationToken);
        await unitOfWork.Repository<AuditEvent>().AddAsync(new AuditEvent(actor.UserId, actor.WorkspaceId,
            "account.export_requested", nameof(DataExportRequest), request.Id.ToString()), cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success(new DataExportResponse(request.Id, "Tayyor bo‘lganda bildirishnoma keladi."));
    }

    public async Task<Result> DeleteAsync(Actor actor, DeleteAccountCommand command, CancellationToken cancellationToken)
    {
        if (!IsDeleteConfirmed(command.Confirm)) return Result.Failure(ApplicationErrors.Me.ConfirmationRequired);
        // Active orders and wallet balance (me.has_active_orders / me.wallet_not_empty) are checked here
        // once the Orders (phase 4) and Wallet (phase 6) modules exist.

        var user = await GetTrackedUserAsync(actor, cancellationToken);
        if (user is null) return Result.Failure(ApplicationErrors.Profile.UserNotFound);
        var now = timeProvider.GetUtcNow();
        var phone = user.Phone;

        var sessions = await unitOfWork.Repository<RefreshSession>().ListAsync(
            x => x.UserId == user.Id && x.RevokedAt == null, asTracking: true, cancellationToken: cancellationToken);
        foreach (var session in sessions) session.Revoke(now);

        var telegram = unitOfWork.Repository<TelegramAccount>();
        var link = await telegram.FirstOrDefaultAsync(x => x.Phone == phone, true, cancellationToken);
        if (link is not null) telegram.Remove(link);

        user.Delete(now);
        await unitOfWork.Repository<AuditEvent>().AddAsync(new AuditEvent(actor.UserId, actor.WorkspaceId,
            "account.deleted", nameof(User), user.Id.ToString()), cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    private async Task<User?> GetTrackedUserAsync(Actor actor, CancellationToken cancellationToken)
    {
        var user = await unitOfWork.Repository<User>().GetByIdAsync(actor.UserId, true, cancellationToken);
        return user is { IsDeleted: false } ? user : null;
    }

    /// <summary>Accepts the common apostrophe variants users type for «‘» in O‘CHIRISH.</summary>
    private static bool IsDeleteConfirmed(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        var normalized = value.Trim().Replace('\'', '‘').Replace('’', '‘').Replace('ʻ', '‘').Replace('`', '‘');
        return string.Equals(normalized, DeleteConfirmation, StringComparison.Ordinal);
    }

    private static bool IsValidEmail(string email) =>
        email.Length <= 254 && MailAddress.TryCreate(email.Trim(), out var parsed) &&
        string.Equals(parsed.Address, email.Trim(), StringComparison.OrdinalIgnoreCase);

    private static NotificationSettingsDto Map(NotificationPreference settings) =>
        new(settings.ChannelSettings, settings.TypeSettings);
}
