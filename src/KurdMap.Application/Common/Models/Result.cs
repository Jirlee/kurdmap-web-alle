namespace KurdMap.Application.Common.Models;

public class Result<T>
{
    public T? Value { get; }
    public bool IsSuccess { get; }
    public string? Error { get; }

    private Result(T value) { Value = value; IsSuccess = true; }
    private Result(string error) { Error = error; IsSuccess = false; }

    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(string error) => new(error);

    public static implicit operator Result<T>(T value) => Success(value);
}

public class Result
{
    public bool IsSuccess { get; }
    public string? Error { get; }

    private Result(bool isSuccess, string? error = null) { IsSuccess = isSuccess; Error = error; }

    public static Result Success() => new(true);
    public static Result Failure(string error) => new(false, error);
}
