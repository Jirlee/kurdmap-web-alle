namespace KurdMap.Shared;

public static class SupportedLanguages
{
    public const string KurdishSorani = "ku";
    public const string KurdishKurmanji = "kmr";
    public const string German = "de";
    public const string English = "en";

    public static readonly IReadOnlyList<string> All = [KurdishSorani, KurdishKurmanji, German, English];
}
