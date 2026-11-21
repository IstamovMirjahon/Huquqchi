using Huquqchi.Domain;

namespace Huquqchi.Application;

public interface IFileService
{
    Task<Result<FileRef>> UploadAsync(Actor actor, FileUpload upload, CancellationToken cancellationToken);
    Task<Result<FileRef>> UploadAsync(Actor actor, FileUpload upload, FilePurpose purpose, CancellationToken cancellationToken);
    Task<Result<FileRef>> GetAsync(Actor actor, Guid id, CancellationToken cancellationToken);
    Task<Result<FileDownload>> OpenSignedAsync(Guid id, long expires, string? signature, CancellationToken cancellationToken);
    string CreateUrl(Guid fileId);
}

public sealed class FileService(
    IUnitOfWork unitOfWork,
    IFileStorage fileStorage,
    IMalwareScanner malwareScanner,
    IFileUrlSigner urlSigner,
    TimeProvider timeProvider) : IFileService
{
    public Task<Result<FileRef>> UploadAsync(Actor actor, FileUpload upload, CancellationToken cancellationToken) =>
        EnumCode.TryParse<FilePurpose>(upload.Purpose, out var purpose)
            ? UploadAsync(actor, upload, purpose, cancellationToken)
            : Task.FromResult(Result.Failure<FileRef>(ApplicationErrors.Files.InvalidPurpose
                .WithField("purpose", "order_message, kyc, job_attachment, delivery yoki avatar bo‘lishi kerak.")));

    public async Task<Result<FileRef>> UploadAsync(Actor actor, FileUpload upload, FilePurpose purpose,
        CancellationToken cancellationToken)
    {
        var rule = FilePolicy.For(purpose);
        var extension = Path.GetExtension(upload.FileName).ToLowerInvariant();
        if (!rule.Extensions.Contains(extension))
            return Result.Failure<FileRef>(ApplicationErrors.Files.InvalidType(rule.Extensions.Where(x => x != ".jpeg")));
        if (upload.Length > rule.MaxBytes) return Result.Failure<FileRef>(ApplicationErrors.Files.TooLarge(rule.MaxBytes));
        if (upload.Length <= 0) return Result.Failure<FileRef>(ApplicationErrors.Files.Empty);

        await using var content = await SeekableAsync(upload.Content, rule.MaxBytes, cancellationToken);
        if (content.Length > rule.MaxBytes) return Result.Failure<FileRef>(ApplicationErrors.Files.TooLarge(rule.MaxBytes));

        var header = new byte[FilePolicy.SignatureLength];
        var read = await content.ReadAtLeastAsync(header, header.Length, throwOnEndOfStream: false, cancellationToken);
        if (!FilePolicy.SignatureMatches(extension, header.AsSpan(0, read)))
            return Result.Failure<FileRef>(ApplicationErrors.Files.InvalidType(rule.Extensions.Where(x => x != ".jpeg")));

        content.Position = 0;
        var scan = await malwareScanner.ScanAsync(content, cancellationToken);
        if (scan.Status == MalwareScanStatus.Infected) return Result.Failure<FileRef>(ApplicationErrors.Files.Infected);
        if (scan.Status == MalwareScanStatus.Failed) return Result.Failure<FileRef>(ApplicationErrors.Files.ScanUnavailable);

        content.Position = 0;
        var saved = await fileStorage.SaveAsync(content, extension, cancellationToken);
        try
        {
            var file = new StoredFile(actor.UserId, actor.WorkspaceId, purpose, FilePolicy.SafeName(upload.FileName),
                FilePolicy.MimeFor(extension), content.Length, saved.Key, saved.Sha256,
                scan.Status == MalwareScanStatus.Clean ? FileScanStatus.Clean : FileScanStatus.Skipped);
            await unitOfWork.Repository<StoredFile>().AddAsync(file, cancellationToken);
            await unitOfWork.Repository<AuditEvent>().AddAsync(new AuditEvent(actor.UserId, actor.WorkspaceId,
                "file.uploaded", nameof(StoredFile), file.Id.ToString()), cancellationToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return Result.Success(Map(file));
        }
        catch
        {
            await fileStorage.DeleteAsync(saved.Key, CancellationToken.None);
            throw;
        }
    }

    public async Task<Result<FileRef>> GetAsync(Actor actor, Guid id, CancellationToken cancellationToken)
    {
        // Order participants get access in phase 4; until then only the uploader may see a file.
        var file = await unitOfWork.Repository<StoredFile>().FirstOrDefaultAsync(
            x => x.Id == id && x.OwnerId == actor.UserId && !x.IsDeleted, cancellationToken: cancellationToken);
        return file is null ? Result.Failure<FileRef>(ApplicationErrors.Files.NotFound) : Result.Success(Map(file));
    }

    public async Task<Result<FileDownload>> OpenSignedAsync(Guid id, long expires, string? signature,
        CancellationToken cancellationToken)
    {
        if (!urlSigner.IsValid(id, expires, signature, timeProvider.GetUtcNow()))
            return Result.Failure<FileDownload>(ApplicationErrors.Files.NotFound);
        var file = await unitOfWork.Repository<StoredFile>().FirstOrDefaultAsync(
            x => x.Id == id && !x.IsDeleted, cancellationToken: cancellationToken);
        if (file is null) return Result.Failure<FileDownload>(ApplicationErrors.Files.NotFound);
        var stream = await fileStorage.OpenReadAsync(file.StorageKey, cancellationToken);
        return Result.Success(new FileDownload(stream, file.Name, file.Mime));
    }

    public string CreateUrl(Guid fileId) => urlSigner.CreateUrl(fileId, timeProvider.GetUtcNow());

    private FileRef Map(StoredFile file) => new(file.Id, file.Name, file.Mime, file.Size, CreateUrl(file.Id));

    /// <summary>Signature check, antivirus and storage each read the content, so it must be rewindable.</summary>
    private static async Task<Stream> SeekableAsync(Stream source, long maxBytes, CancellationToken cancellationToken)
    {
        if (source.CanSeek)
        {
            source.Position = 0;
            return new NonClosingStream(source);
        }

        var buffer = new MemoryStream();
        await source.CopyToAsync(buffer, cancellationToken);
        if (buffer.Length > maxBytes + 1) buffer.SetLength(maxBytes + 1);
        buffer.Position = 0;
        return buffer;
    }

    /// <summary>Lets us dispose our wrapper without closing the caller's stream.</summary>
    private sealed class NonClosingStream(Stream inner) : Stream
    {
        public override bool CanRead => inner.CanRead;
        public override bool CanSeek => inner.CanSeek;
        public override bool CanWrite => false;
        public override long Length => inner.Length;
        public override long Position { get => inner.Position; set => inner.Position = value; }
        public override void Flush() { }
        public override int Read(byte[] buffer, int offset, int count) => inner.Read(buffer, offset, count);
        public override ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default) =>
            inner.ReadAsync(buffer, cancellationToken);
        public override Task<int> ReadAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken) =>
            inner.ReadAsync(buffer, offset, count, cancellationToken);
        public override long Seek(long offset, SeekOrigin origin) => inner.Seek(offset, origin);
        public override void SetLength(long value) => throw new NotSupportedException();
        public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();
    }
}
