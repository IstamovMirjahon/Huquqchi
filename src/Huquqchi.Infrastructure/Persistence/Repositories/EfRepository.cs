using System.Linq.Expressions;
using Huquqchi.Application;
using Huquqchi.Domain;
using Microsoft.EntityFrameworkCore;

namespace Huquqchi.Infrastructure;

internal sealed class EfRepository<T>(AppDbContext dbContext) : IRepository<T> where T : Entity
{
    private readonly DbSet<T> _set = dbContext.Set<T>();

    public Task<T?> GetByIdAsync(Guid id, bool asTracking = false, CancellationToken cancellationToken = default) =>
        Query(asTracking).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, bool asTracking = false,
        CancellationToken cancellationToken = default) => Query(asTracking).FirstOrDefaultAsync(predicate, cancellationToken);

    public async Task<IReadOnlyList<T>> ListAsync(Expression<Func<T, bool>>? predicate = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null, bool asTracking = false,
        CancellationToken cancellationToken = default)
    {
        IQueryable<T> query = Query(asTracking);
        if (predicate is not null) query = query.Where(predicate);
        if (orderBy is not null) query = orderBy(query);
        return await query.ToListAsync(cancellationToken);
    }

    public Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default) =>
        _set.AnyAsync(predicate, cancellationToken);

    public async Task AddAsync(T entity, CancellationToken cancellationToken = default) =>
        await _set.AddAsync(entity, cancellationToken);
    public void Remove(T entity) => _set.Remove(entity);
    private IQueryable<T> Query(bool tracking) => tracking ? _set : _set.AsNoTracking();
}
