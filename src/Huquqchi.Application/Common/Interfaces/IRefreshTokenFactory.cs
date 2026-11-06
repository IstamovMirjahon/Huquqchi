namespace Huquqchi.Application;

public interface IRefreshTokenFactory
{
    IssuedRefreshToken Create();
    string Hash(string token);
}
