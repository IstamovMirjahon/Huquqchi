namespace Huquqchi.Domain;

public sealed class Template : Entity
{
    private Template() { }
    public Template(string code, string name, string category, string schemaJson, string body)
    {
        Code = code;
        Name = name;
        Category = category;
        SchemaJson = schemaJson;
        Body = body;
    }

    public string Code { get; private set; } = "";
    public string Name { get; private set; } = "";
    public string Category { get; private set; } = "";
    public string SchemaJson { get; private set; } = "{}";
    public string Body { get; private set; } = "";
    public ContentStatus Status { get; private set; } = ContentStatus.Published;
}
