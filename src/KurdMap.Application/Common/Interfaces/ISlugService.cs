namespace KurdMap.Application.Common.Interfaces;

public interface ISlugService
{
    string GenerateSlug(string germanName);
    Task<string> GenerateUniqueSlugAsync(string germanName, CancellationToken ct = default);
}
