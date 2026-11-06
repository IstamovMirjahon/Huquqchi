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
}
