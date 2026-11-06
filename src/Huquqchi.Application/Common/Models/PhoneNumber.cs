namespace Huquqchi.Application;

public static class PhoneNumber
{
    public static string? Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var digits = new string(value.Where(char.IsDigit).ToArray());
        if (digits.Length == 9) digits = "998" + digits;
        return digits.Length is >= 12 and <= 15 ? "+" + digits : null;
    }
}
