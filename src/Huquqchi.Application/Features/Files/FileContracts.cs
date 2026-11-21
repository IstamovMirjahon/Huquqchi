using Huquqchi.Domain;

namespace Huquqchi.Application;

/// <param name="Purpose">Wire code (<c>order_message</c>, <c>kyc</c>, …); validated by the service.</param>
public sealed record FileUpload(Stream Content, string FileName, long Length, string? Purpose = null);

/// <summary>File reference returned to clients (BACKEND_API.md §B.3). <see cref="Url"/> is signed and short-lived.</summary>
public sealed record FileRef(Guid Id, string Name, string Mime, long Size, string Url);

public sealed record FileDownload(Stream Content, string Name, string Mime);

/// <summary>Upload rules per purpose. Type is decided from the extension and confirmed by the file signature.</summary>
public static class FilePolicy
{
    private const long Mb = 1024 * 1024;

    private static readonly IReadOnlyDictionary<string, string> MimeByExtension =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [".pdf"] = "application/pdf",
            [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            [".doc"] = "application/msword",
            [".xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".png"] = "image/png",
            [".zip"] = "application/zip"
        };

    private static readonly byte[] Pdf = "%PDF-"u8.ToArray();
    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    private static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF];
    private static readonly byte[] Zip = [0x50, 0x4B, 0x03, 0x04];
    private static readonly byte[] Ole = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1];

    public const int SignatureLength = 8;

    public sealed record Rule(IReadOnlyList<string> Extensions, long MaxBytes);

    private static readonly Rule General = new([".pdf", ".docx", ".doc", ".xlsx", ".jpg", ".jpeg", ".png", ".zip"], 25 * Mb);
    private static readonly Rule Kyc = new([".jpg", ".jpeg", ".png", ".pdf"], 10 * Mb);
    private static readonly Rule Avatar = new([".jpg", ".jpeg", ".png"], 5 * Mb);

    public static Rule For(FilePurpose purpose) => purpose switch
    {
        FilePurpose.Kyc => Kyc,
        FilePurpose.Avatar => Avatar,
        _ => General
    };

    public static string MimeFor(string extension) => MimeByExtension[extension];

    /// <summary>Checks the leading bytes so that a renamed executable is not accepted as a PDF or image.</summary>
    public static bool SignatureMatches(string extension, ReadOnlySpan<byte> header) =>
        extension.ToLowerInvariant() switch
        {
            ".pdf" => header.StartsWith(Pdf),
            ".png" => header.StartsWith(Png),
            ".jpg" or ".jpeg" => header.StartsWith(Jpeg),
            ".docx" or ".xlsx" or ".zip" => header.StartsWith(Zip),
            ".doc" => header.StartsWith(Ole),
            _ => false
        };

    /// <summary>Display name only: no directories, no control characters, at most 255 characters.</summary>
    public static string SafeName(string fileName)
    {
        var name = new string(Path.GetFileName(fileName.Replace('\\', '/')).Where(c => !char.IsControl(c)).ToArray()).Trim();
        if (name.Length == 0) name = "fayl";
        return name.Length <= 255 ? name : name[^255..];
    }
}
