namespace Huquqchi.Domain;

/// <summary>
/// Public lawyer profile. Created empty (status <see cref="LawyerStatus.Draft"/>) when a user
/// signs up with the lawyer role; filled in and verified in the Lawyers module (phase 3).
/// </summary>
public sealed class LawyerProfile : Entity
{
    private LawyerProfile() { }

    public LawyerProfile(Guid userId)
    {
        UserId = userId;
        Status = LawyerStatus.Draft;
    }

    public Guid UserId { get; private set; }
    public LawyerStatus Status { get; private set; }
}
