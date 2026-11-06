using System.Collections.Concurrent;
using Huquqchi.Application;
using Huquqchi.Domain;

namespace Huquqchi.Infrastructure;

public sealed class UnitOfWork(AppDbContext dbContext) : IUnitOfWork
{
    private readonly ConcurrentDictionary<Type, object> _repositories = new();

    public IRepository<T> Repository<T>() where T : Entity =>
        (IRepository<T>)_repositories.GetOrAdd(typeof(T), _ => new EfRepository<T>(dbContext));

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        dbContext.SaveChangesAsync(cancellationToken);
}
