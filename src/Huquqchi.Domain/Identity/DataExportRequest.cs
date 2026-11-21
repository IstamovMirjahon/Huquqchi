namespace Huquqchi.Domain;

/// <summary>Personal data export request (BACKEND_API.md §2.5). Processed by a background job.</summary>
public sealed class DataExportRequest : Entity
{
    private DataExportRequest() { }

    public DataExportRequest(Guid userId)
    {
        UserId = userId;
        Status = DataExportStatus.Requested;
    }

    public Guid UserId { get; private set; }
    public DataExportStatus Status { get; private set; }
}
