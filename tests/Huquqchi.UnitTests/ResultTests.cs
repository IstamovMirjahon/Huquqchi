using Huquqchi.Application;

namespace Huquqchi.UnitTests;

public sealed class ResultTests
{
    [Fact]
    public void Success_exposes_value()
    {
        var result = Result.Success(42);
        Assert.True(result.IsSuccess);
        Assert.Equal(42, result.Value);
        Assert.Equal(Error.None, result.Error);
    }

    [Fact]
    public void Failure_exposes_typed_error_and_blocks_value()
    {
        var error = ApplicationErrors.Documents.NotFound;
        var result = Result.Failure<string>(error);
        Assert.True(result.IsFailure);
        Assert.Equal("documents.not_found", result.Error.Code);
        Assert.Throws<InvalidOperationException>(() => _ = result.Value);
    }
}
