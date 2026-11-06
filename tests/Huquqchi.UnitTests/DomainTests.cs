using Huquqchi.Domain;

namespace Huquqchi.UnitTests;

public sealed class DomainTests
{
    [Fact]
    public void Uploaded_document_moves_through_analysis_states()
    {
        var document = new UploadedDocument(Guid.NewGuid(), Guid.NewGuid(), "contract.pdf", "application/pdf", 42, DocumentOrigin.Uploaded);
        Assert.Equal(DocumentStatus.Saved, document.Status);
        document.MarkProcessing();
        Assert.Equal(DocumentStatus.Processing, document.Status);
        document.MarkReady();
        Assert.Equal(DocumentStatus.Ready, document.Status);
        Assert.NotNull(document.LastAnalyzedAt);
    }

    [Fact]
    public void Draft_document_starts_as_draft()
    {
        var document = new UploadedDocument(Guid.NewGuid(), Guid.NewGuid(), "draft.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 42, DocumentOrigin.Generated);
        Assert.Equal(DocumentStatus.Draft, document.Status);
    }

    [Fact]
    public void Refresh_session_is_rotated_and_revoked()
    {
        var now = DateTimeOffset.UtcNow;
        var session = new RefreshSession(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "hash",
            now.AddDays(30));
        Assert.True(session.IsActive(now));

        session.Rotate("replacement", now);

        Assert.False(session.IsActive(now));
        Assert.Equal("replacement", session.ReplacedByTokenHash);
        Assert.Equal(now, session.RevokedAt);
    }
}
