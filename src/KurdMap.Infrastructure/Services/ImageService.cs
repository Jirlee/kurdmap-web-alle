using KurdMap.Application.Common.Interfaces;
using KurdMap.Domain.Common;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace KurdMap.Infrastructure.Services;

public sealed class ImageService : IImageService
{
    private const long MaxFileSize = 5 * 1024 * 1024; // 5 MB
    private const string UploadFolder = "uploads/images";
    private const int ThumbnailWidth = 300;
    private const int MediumWidth = 800;
    private const int WebPQuality = 80;

    private static readonly Dictionary<string, byte[][]> AllowedSignatures = new(StringComparer.OrdinalIgnoreCase)
    {
        { ".jpg", [[ 0xFF, 0xD8, 0xFF ]] },
        { ".jpeg", [[ 0xFF, 0xD8, 0xFF ]] },
        { ".png", [[ 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A ]] },
        { ".webp", [[ 0x52, 0x49, 0x46, 0x46 ]] } // RIFF header
    };

    private static readonly HashSet<string> AllowedExtensions =
        new(AllowedSignatures.Keys, StringComparer.OrdinalIgnoreCase);

    public void ValidateImage(Stream imageStream, string fileName, long fileSize)
    {
        if (fileSize > MaxFileSize)
            throw new DomainException($"Image exceeds maximum size of {MaxFileSize / (1024 * 1024)} MB.");

        var extension = Path.GetExtension(fileName);
        if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
            throw new DomainException($"File type '{extension}' is not allowed. Allowed: {string.Join(", ", AllowedExtensions)}.");

        // Magic bytes validation
        if (!AllowedSignatures.TryGetValue(extension, out var signatures))
            throw new DomainException($"File type '{extension}' is not allowed.");

        var headerBuffer = new byte[8];
        var originalPosition = imageStream.Position;
        var bytesRead = imageStream.Read(headerBuffer, 0, headerBuffer.Length);
        imageStream.Position = originalPosition;

        if (bytesRead < 3)
            throw new DomainException("File is too small to be a valid image.");

        var matchesSignature = false;
        foreach (var signature in signatures)
        {
            if (bytesRead >= signature.Length && headerBuffer.AsSpan(0, signature.Length).SequenceEqual(signature))
            {
                matchesSignature = true;
                break;
            }
        }

        if (!matchesSignature)
            throw new DomainException("File content does not match its extension. Possible malicious file.");
    }

    public async Task<string> SaveImageAsync(Stream imageStream, string originalFileName, CancellationToken ct = default)
    {
        var extension = Path.GetExtension(originalFileName).ToLowerInvariant();
        var safeFileName = $"{Guid.NewGuid()}{extension}";

        // Group by year/month for organized storage
        var subFolder = DateTime.UtcNow.ToString("yyyy/MM");
        var relativePath = Path.Combine(UploadFolder, subFolder, safeFileName);
        var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relativePath);

        var directory = Path.GetDirectoryName(fullPath)!;
        if (!Directory.Exists(directory))
            Directory.CreateDirectory(directory);

        await using var fileStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None);
        await imageStream.CopyToAsync(fileStream, ct);

        // Return URL path (without wwwroot prefix)
        return $"/{relativePath.Replace('\\', '/')}";
    }

    public Task DeleteImageAsync(string imageUrl, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
            return Task.CompletedTask;

        var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", imageUrl.TrimStart('/'));

        // Prevent path traversal
        var wwwrootPath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"));
        var resolvedPath = Path.GetFullPath(fullPath);
        if (!resolvedPath.StartsWith(wwwrootPath, StringComparison.OrdinalIgnoreCase))
            return Task.CompletedTask;

        if (File.Exists(resolvedPath))
            File.Delete(resolvedPath);

        // Also delete thumbnail and medium variants
        var dir = Path.GetDirectoryName(resolvedPath)!;
        var nameWithoutExt = Path.GetFileNameWithoutExtension(resolvedPath);
        var ext = Path.GetExtension(resolvedPath);

        var thumbPath = Path.Combine(dir, $"{nameWithoutExt}_thumb{ext}");
        if (File.Exists(thumbPath)) File.Delete(thumbPath);

        var mediumPath = Path.Combine(dir, $"{nameWithoutExt}_medium{ext}");
        if (File.Exists(mediumPath)) File.Delete(mediumPath);

        // Delete WebP variant if original was not WebP
        if (!ext.Equals(".webp", StringComparison.OrdinalIgnoreCase))
        {
            var webpPath = Path.Combine(dir, $"{nameWithoutExt}.webp");
            if (File.Exists(webpPath)) File.Delete(webpPath);

            var webpThumbPath = Path.Combine(dir, $"{nameWithoutExt}_thumb.webp");
            if (File.Exists(webpThumbPath)) File.Delete(webpThumbPath);

            var webpMediumPath = Path.Combine(dir, $"{nameWithoutExt}_medium.webp");
            if (File.Exists(webpMediumPath)) File.Delete(webpMediumPath);
        }

        return Task.CompletedTask;
    }

    public async Task<string> SaveOptimizedImageAsync(Stream imageStream, string originalFileName, CancellationToken ct = default)
    {
        var safeFileName = $"{Guid.NewGuid()}";
        var subFolder = DateTime.UtcNow.ToString("yyyy/MM");
        var relativeDir = Path.Combine(UploadFolder, subFolder);
        var fullDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relativeDir);

        if (!Directory.Exists(fullDir))
            Directory.CreateDirectory(fullDir);

        using var image = await Image.LoadAsync(imageStream, ct);
        var encoder = new WebpEncoder { Quality = WebPQuality };

        // Save original as WebP
        var originalWebpPath = Path.Combine(fullDir, $"{safeFileName}.webp");
        await image.SaveAsync(originalWebpPath, encoder, ct);

        // Save medium (800px width)
        if (image.Width > MediumWidth)
        {
            using var medium = image.Clone(ctx => ctx.Resize(new ResizeOptions
            {
                Mode = ResizeMode.Max,
                Size = new Size(MediumWidth, 0)
            }));
            var mediumPath = Path.Combine(fullDir, $"{safeFileName}_medium.webp");
            await medium.SaveAsync(mediumPath, encoder, ct);
        }

        // Save thumbnail (300px width)
        if (image.Width > ThumbnailWidth)
        {
            using var thumb = image.Clone(ctx => ctx.Resize(new ResizeOptions
            {
                Mode = ResizeMode.Max,
                Size = new Size(ThumbnailWidth, 0)
            }));
            var thumbPath = Path.Combine(fullDir, $"{safeFileName}_thumb.webp");
            await thumb.SaveAsync(thumbPath, encoder, ct);
        }

        // Return URL path for the original WebP
        var relativePath = Path.Combine(relativeDir, $"{safeFileName}.webp");
        return $"/{relativePath.Replace('\\', '/')}";
    }
}
