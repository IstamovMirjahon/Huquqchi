namespace Huquqchi.Application;

public interface IMeService
{
    Task<Result<MeResponse>> GetAsync(Actor actor, CancellationToken cancellationToken);
    Task<Result<MeResponse>> UpdateAsync(Actor actor, UpdateMeCommand command, CancellationToken cancellationToken);
    Task<Result<AvatarResponse>> UploadAvatarAsync(Actor actor, FileUpload upload, CancellationToken cancellationToken);
    Task<Result<NotificationSettingsDto>> GetNotificationSettingsAsync(Actor actor, CancellationToken cancellationToken);
    Task<Result<NotificationSettingsDto>> UpdateNotificationSettingsAsync(Actor actor, NotificationSettingsDto command, CancellationToken cancellationToken);
    Task<Result<DataExportResponse>> RequestExportAsync(Actor actor, CancellationToken cancellationToken);
    Task<Result> DeleteAsync(Actor actor, DeleteAccountCommand command, CancellationToken cancellationToken);
}
