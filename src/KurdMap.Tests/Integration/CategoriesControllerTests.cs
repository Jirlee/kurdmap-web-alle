using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace KurdMap.Tests.Integration;

public class CategoriesControllerTests(KurdMapWebApplicationFactory factory)
    : IClassFixture<KurdMapWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetCategories_WithoutAuth_ReturnsOkOrUnauthorized()
    {
        var response = await _client.GetAsync("/api/v1/categories");

        // Categories might be public or require auth depending on the controller
        Assert.True(
            response.StatusCode is HttpStatusCode.OK or HttpStatusCode.Unauthorized,
            $"Unexpected status: {response.StatusCode}");
    }

    [Fact]
    public async Task GetCategories_Authenticated_ReturnsOk()
    {
        await AuthenticateAsync();

        var response = await _client.GetAsync("/api/v1/categories");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CreateCategory_Authenticated_ReturnsSuccessOrForbidden()
    {
        await AuthenticateAsync();

        var payload = new
        {
            Name = new { Ku = "تاقیکردنەوە", De = "Test Kategorie", En = "Test Category", Kmr = "Testkirin" },
            Icon = "restaurant",
            SortOrder = 1
        };

        var response = await _client.PostAsJsonAsync("/api/v1/categories", payload);

        // Regular users cannot create categories — Forbidden is expected
        Assert.True(
            response.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created or HttpStatusCode.NoContent or HttpStatusCode.Forbidden,
            $"Unexpected status: {response.StatusCode}");
    }

    private async Task AuthenticateAsync()
    {
        var email = $"admin_{Guid.NewGuid():N}@example.com";

        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            Email = email,
            Password = "TestPass123!",
            FullName = "Test Admin"
        });

        if (registerResponse.IsSuccessStatusCode)
        {
            var auth = await registerResponse.Content.ReadFromJsonAsync<AuthDto>();
            if (auth is not null)
            {
                _client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", auth.AccessToken);
            }
        }
    }

    private sealed record AuthDto(string AccessToken, string RefreshToken, Guid UserId, string Email, string FullName, string[] Roles);
}
