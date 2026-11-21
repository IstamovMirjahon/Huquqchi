using System.Text;

namespace Huquqchi.Application;

/// <summary>
/// Converts new platform enums to the snake_case wire codes from BACKEND_API.md §C
/// (e.g. <c>LawyerType.LegalConsultant</c> ⇄ <c>"legal_consultant"</c>).
/// Legacy enums (WorkspaceKind, DocumentStatus, …) stay PascalCase and never pass through here.
/// </summary>
public static class EnumCode
{
    public static string ToCode<T>(this T value) where T : struct, Enum => ToSnakeCase(value.ToString());

    public static bool TryParse<T>(string? code, out T value) where T : struct, Enum
    {
        value = default;
        if (string.IsNullOrWhiteSpace(code)) return false;
        var normalized = code.Trim();
        foreach (var candidate in Enum.GetValues<T>())
        {
            if (!string.Equals(ToSnakeCase(candidate.ToString()), normalized, StringComparison.OrdinalIgnoreCase))
                continue;
            value = candidate;
            return true;
        }

        return false;
    }

    private static string ToSnakeCase(string value)
    {
        var builder = new StringBuilder(value.Length + 4);
        for (var i = 0; i < value.Length; i++)
        {
            var character = value[i];
            if (char.IsUpper(character) && i > 0) builder.Append('_');
            builder.Append(char.ToLowerInvariant(character));
        }

        return builder.ToString();
    }
}
