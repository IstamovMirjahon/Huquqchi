using Huquqchi.Application;
using Huquqchi.Domain;
using Huquqchi.Infrastructure;

namespace Huquqchi.IntegrationTests;

public sealed class ArchitectureTests
{
    [Fact]
    public void Domain_has_no_dependencies_on_outer_layers()
    {
        var references = typeof(Entity).Assembly.GetReferencedAssemblies().Select(x => x.Name).ToHashSet();
        Assert.DoesNotContain("Huquqchi.Application", references);
        Assert.DoesNotContain("Huquqchi.Infrastructure", references);
        Assert.DoesNotContain("Huquqchi.Api", references);
    }

    [Fact]
    public void Application_has_no_dependencies_on_infrastructure_or_api()
    {
        var references = typeof(Result).Assembly.GetReferencedAssemblies().Select(x => x.Name).ToHashSet();
        Assert.DoesNotContain("Huquqchi.Infrastructure", references);
        Assert.DoesNotContain("Huquqchi.Api", references);
    }

    [Fact]
    public void Infrastructure_has_no_dependency_on_api()
    {
        var references = typeof(AppDbContext).Assembly.GetReferencedAssemblies().Select(x => x.Name).ToHashSet();
        Assert.DoesNotContain("Huquqchi.Api", references);
    }
}
