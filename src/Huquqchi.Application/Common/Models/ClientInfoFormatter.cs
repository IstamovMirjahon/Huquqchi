using System.Net;
using System.Net.Sockets;

namespace Huquqchi.Application;

/// <summary>Human-readable, privacy-preserving descriptions of a client for the session list.</summary>
public static class ClientInfoFormatter
{
    private const string Mask = "•••";

    /// <summary>"Chrome · Windows" style label from a User-Agent header.</summary>
    public static string? DescribeDevice(string? userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent)) return null;
        var ua = userAgent;
        var app = ua.Contains("Huquqchi", StringComparison.OrdinalIgnoreCase) ? "Huquqchi ilovasi"
            : ua.Contains("Edg/", StringComparison.Ordinal) ? "Edge"
            : ua.Contains("OPR/", StringComparison.Ordinal) ? "Opera"
            : ua.Contains("YaBrowser", StringComparison.Ordinal) ? "Yandex"
            : ua.Contains("Firefox/", StringComparison.Ordinal) ? "Firefox"
            : ua.Contains("Chrome/", StringComparison.Ordinal) ? "Chrome"
            : ua.Contains("Safari/", StringComparison.Ordinal) ? "Safari"
            : null;
        var os = ua.Contains("Windows", StringComparison.Ordinal) ? "Windows"
            : ua.Contains("Android", StringComparison.Ordinal) ? "Android"
            : ua.Contains("iPhone", StringComparison.Ordinal) || ua.Contains("iPad", StringComparison.Ordinal) ? "iOS"
            : ua.Contains("Mac OS X", StringComparison.Ordinal) ? "macOS"
            : ua.Contains("Linux", StringComparison.Ordinal) ? "Linux"
            : null;
        var label = string.Join(" · ", new[] { app, os }.Where(x => x is not null));
        return label.Length > 0 ? label : "Noma’lum qurilma";
    }

    /// <summary>"84.54.•••.•••" for IPv4, first two groups for IPv6.</summary>
    public static string? MaskIp(string? ip)
    {
        if (string.IsNullOrWhiteSpace(ip) || !IPAddress.TryParse(ip, out var address)) return null;
        if (address.IsIPv4MappedToIPv6) address = address.MapToIPv4();
        if (address.AddressFamily == AddressFamily.InterNetwork)
        {
            var parts = address.ToString().Split('.');
            return $"{parts[0]}.{parts[1]}.{Mask}.{Mask}";
        }

        var groups = address.ToString().Split(':', StringSplitOptions.RemoveEmptyEntries);
        return groups.Length >= 2 ? $"{groups[0]}:{groups[1]}:{Mask}" : Mask;
    }
}
