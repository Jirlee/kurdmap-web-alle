namespace KurdMap.Application.Common.Interfaces;

public interface IImageService
{
    Task<string> SaveImageAsync(Stream imageStream, string originalFileName, CancellationToken ct = default);
    Task DeleteImageAsync(string imageUrl, CancellationToken ct = default);
    void ValidateImage(Stream imageStream, string fileName, long fileSize);
    Task<string> SaveOptimizedImageAsync(Stream imageStream, string originalFileName, CancellationToken ct = default);
}
