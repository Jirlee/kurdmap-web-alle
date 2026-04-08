namespace KurdMap.Shared;

public static class AppRoles
{
    public const string User = "User";
    public const string BusinessOwner = "BusinessOwner";
    public const string Moderator = "Moderator";
    public const string Admin = "Admin";
    public const string SuperAdmin = "SuperAdmin";

    public static readonly IReadOnlyList<string> All =
    [
        User,
        BusinessOwner,
        Moderator,
        Admin,
        SuperAdmin
    ];
}
