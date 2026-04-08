using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace KurdMap.Tests.Integration;

public class BusinessesControllerTests(KurdMapWebApplicationFactory factory)
    : IClassFixture<KurdMapWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetBusinesses_ReturnsOkOrUnauthorized()
    {
        var response = await _client.GetAsync("/api/v1/businesses?pageNumber=1&pageSize=10");

        Assert.True(
            response.StatusCode is HttpStatusCode.OK or HttpStatusCode.Unauthorized,
            $"Unexpected status: {response.StatusCode}");
    }

    [Fact]
    public async Task GetBusinesses_Authenticated_ReturnsPaginatedList()
    {
        await AuthenticateAsync();

        var response = await _client.GetAsync("/api/v1/businesses?pageNumber=1&pageSize=10");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("items", content, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetNonExistentBusiness_ReturnsNotFound()
    {
        await AuthenticateAsync();

        var response = await _client.GetAsync("/api/v1/businesses/nonexistent-slug-12345");

        Assert.True(
            response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.BadRequest,
            $"Unexpected status: {response.StatusCode}");
    }

    [Fact]
    public async Task DeleteNonExistentBusiness_ReturnsNotFoundOrBadRequest()
    {
        await AuthenticateAsync();

        var response = await _client.DeleteAsync($"/api/v1/businesses/{Guid.NewGuid()}");

        Assert.True(
            response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.BadRequest or HttpStatusCode.Forbidden,
            $"Unexpected status: {response.StatusCode}");
    }

    private async Task AuthenticateAsync()
    {
        var email = $"biz_{Guid.NewGuid():N}@example.com";

        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            Email = email,
            Password = "TestPass123!",
            FullName = "Business Tester"
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
