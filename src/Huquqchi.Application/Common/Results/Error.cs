namespace Huquqchi.Application;

public enum ErrorType { Validation, NotFound, Conflict, Forbidden, Unauthorized, Failure }

public sealed record Error(string Code, string Message, ErrorType Type)
{
    public static readonly Error None = new(string.Empty, string.Empty, ErrorType.Failure);
}
