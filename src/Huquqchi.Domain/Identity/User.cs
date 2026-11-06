namespace Huquqchi.Domain;

public sealed class User : Entity
{
    private User() { }
    public User(string phone, string name, string language = "uz-Latn")
    {
        Phone = phone.Trim();
        Name = name.Trim();
        Language = language;
    }

    public string Phone { get; private set; } = "";
    public string Name { get; private set; } = "";
    public string Language { get; private set; } = "uz-Latn";
    public bool IsActive { get; private set; } = true;

    public void UpdateProfile(string name, string language)
    {
        Name = name.Trim();
        Language = language;
        Touch();
    }
}
