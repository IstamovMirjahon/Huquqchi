using Huquqchi.Domain;

namespace Huquqchi.Application;

public interface IUnitOfWork
{
    IRepository<T> Repository<T>() where T : Entity;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
