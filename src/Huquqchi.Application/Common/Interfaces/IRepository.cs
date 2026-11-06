using System.Linq.Expressions;
using Huquqchi.Domain;

namespace Huquqchi.Application;

public interface IRepository<T> where T : Entity
{
    Task<T?> GetByIdAsync(Guid id, bool asTracking = false, CancellationToken cancellationToken = default);
    Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, bool asTracking = false, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<T>> ListAsync(
        Expression<Func<T, bool>>? predicate = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
        bool asTracking = false,
        CancellationToken cancellationToken = default);
    Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
    Task AddAsync(T entity, CancellationToken cancellationToken = default);
    void Remove(T entity);
}
