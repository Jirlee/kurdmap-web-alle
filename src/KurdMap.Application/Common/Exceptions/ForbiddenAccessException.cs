namespace KurdMap.Application.Common.Exceptions;

public sealed class ForbiddenAccessException : Exception
{
    public ForbiddenAccessException() : base("You do not have permission to access this resource.") { }
}
