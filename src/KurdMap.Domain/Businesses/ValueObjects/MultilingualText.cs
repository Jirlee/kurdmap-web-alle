namespace KurdMap.Domain.Businesses.ValueObjects;

public sealed record MultilingualText
{
    public string Ku { get; init; } = string.Empty;
    public string Kmr { get; init; } = string.Empty;
    public string De { get; init; } = string.Empty;
    public string En { get; init; } = string.Empty;

    private MultilingualText() { }

    public static MultilingualText Create(string ku, string de, string kmr = "", string en = "")
    {
        return new MultilingualText
        {
            Ku = ku.Trim(),
            Kmr = kmr.Trim(),
            De = de.Trim(),
            En = en.Trim()
        };
    }

    public string GetLocalized(string locale) => locale switch
    {
        "ku" or "ku-sor" => Ku,
        "kmr" or "ku-kmr" => Kmr,
        "de" => De,
        "en" => En,
        _ => De
    };
}
