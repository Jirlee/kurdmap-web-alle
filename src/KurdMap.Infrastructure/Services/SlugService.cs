using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using KurdMap.Application.Common.Interfaces;
using KurdMap.Domain.Businesses;

namespace KurdMap.Infrastructure.Services;

public sealed partial class SlugService(IBusinessRepository businessRepository) : ISlugService
{
    public string GenerateSlug(string germanName)
    {
        if (string.IsNullOrWhiteSpace(germanName))
            return string.Empty;

        // Normalize and remove diacritics
        var normalized = germanName.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();

        foreach (var c in normalized)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(c);
            if (category != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }

        var slug = sb.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();

        // German-specific replacements
        slug = slug.Replace("ä", "ae")
                   .Replace("ö", "oe")
                   .Replace("ü", "ue")
                   .Replace("ß", "ss");

        // Replace non-alphanumeric with hyphens
        slug = NonAlphanumericRegex().Replace(slug, "-");

        // Collapse multiple hyphens and trim
        slug = MultipleHyphensRegex().Replace(slug, "-").Trim('-');

        return slug;
    }

    public async Task<string> GenerateUniqueSlugAsync(string germanName, CancellationToken ct = default)
    {
        var baseSlug = GenerateSlug(germanName);
        var slug = baseSlug;
        var counter = 1;

        while (await businessRepository.GetBySlugAsync(slug, ct) is not null)
        {
            slug = $"{baseSlug}-{counter}";
            counter++;
        }

        return slug;
    }

    [GeneratedRegex(@"[^a-z0-9]+")]
    private static partial Regex NonAlphanumericRegex();

    [GeneratedRegex(@"-{2,}")]
    private static partial Regex MultipleHyphensRegex();
}
