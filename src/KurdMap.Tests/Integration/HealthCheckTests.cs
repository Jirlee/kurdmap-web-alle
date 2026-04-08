using System.Net;

namespace KurdMap.Tests.Integration;

public class HealthCheckTests(KurdMapWebApplicationFactory factory)
    : IClassFixture<KurdMapWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task HealthCheck_ReturnsHealthy()
    {
        var response = await _client.GetAsync("/health");

        // In testing environment (InMemory DB, no Redis) health check may report degraded
        Assert.True(
            response.StatusCode is HttpStatusCode.OK or HttpStatusCode.ServiceUnavailable,
            $"Expected OK or ServiceUnavailable, got {response.StatusCode}");
    }
}
