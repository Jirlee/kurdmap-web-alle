using System.Net;
using System.Net.Http.Json;

namespace KurdMap.Tests.Integration;

public class AuthControllerTests(KurdMapWebApplicationFactory factory)
    : IClassFixture<KurdMapWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Register_WithValidData_ReturnsOk()
    {
        var request = new
        {
            Email = $"test_{Guid.NewGuid():N}@example.com",
            Password = "TestPass123!",
            FullName = "Test User"
        };

        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.IsSuccessStatusCode, $"Expected success but got {response.StatusCode}: {body}");

        var content = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(content);
        Assert.False(string.IsNullOrEmpty(content.AccessToken));
        Assert.Equal(request.Email, content.Email);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ReturnsBadRequest()
    {
        var email = $"dup_{Guid.NewGuid():N}@example.com";
        var request = new { Email = email, Password = "TestPass123!", FullName = "User" };

        // First registration
        await _client.PostAsJsonAsync("/api/auth/register", request);

        // Second registration with same email
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsTokens()
    {
        var email = $"login_{Guid.NewGuid():N}@example.com";
        var password = "TestPass123!";

        // Register first
        await _client.PostAsJsonAsync("/api/auth/register", new
        {
            Email = email,
            Password = password,
            FullName = "Login User"
        });

        // Login
        var response = await _client.PostAsJsonAsync("/api/auth/login", new { Email = email, Password = password });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(content);
        Assert.False(string.IsNullOrEmpty(content.AccessToken));
        Assert.False(string.IsNullOrEmpty(content.RefreshToken));
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "nonexistent@example.com",
            Password = "WrongPassword123!"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        var email = $"wrongpw_{Guid.NewGuid():N}@example.com";

        // Register
        await _client.PostAsJsonAsync("/api/auth/register", new
        {
            Email = email,
            Password = "CorrectPass123!",
            FullName = "Test"
        });

        // Login with wrong password
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = email,
            Password = "WrongPass123!"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private sealed record AuthResponseDto(
        string AccessToken,
        string RefreshToken,
        Guid UserId,
        string Email,
        string FullName,
        string[] Roles);
}
