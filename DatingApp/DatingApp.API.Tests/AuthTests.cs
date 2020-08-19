using System.Net;
using System.Net.Http.Json;
using DatingApp.API.Helpers;
using Microsoft.Extensions.Configuration;

namespace DatingApp.API.Tests;

public class AuthTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public AuthTests(ApiFactory factory)
    {
        _factory = factory;
        _factory.EnsureDatabase();
    }

    [Fact]
    public async Task Login_returns_a_token_naming_the_registered_user()
    {
        var user = await _factory.RegisterAndLoginAsync();

        var payload = ApiClientExtensions.JwtPayload(user.Token);
        Assert.Equal(user.Id.ToString(), payload.GetProperty("nameid").GetString());
        Assert.Equal(user.Username, payload.GetProperty("unique_name").GetString());
    }

    [Fact]
    public async Task Login_with_the_wrong_password_is_unauthorized()
    {
        var user = await _factory.RegisterAndLoginAsync();

        var response = await _factory.CreateClient().PostAsJsonAsync("/auth/login",
            new { username = user.Username, password = "not-the-password" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Registering_a_taken_username_is_rejected()
    {
        var user = await _factory.RegisterAndLoginAsync();

        var response = await _factory.CreateClient().PostAsJsonAsync("/auth/register", new
        {
            username = user.Username.ToUpperInvariant(),
            password = ApiClientExtensions.Password,
            gender = "male",
            knownAs = "Copy",
            dateOfBirth = new DateTime(1990, 1, 1),
            city = "X",
            country = "Y",
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Registering_with_a_short_password_is_rejected()
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/auth/register", new
        {
            username = "shorty",
            password = "abc",
            gender = "male",
            knownAs = "Shorty",
            dateOfBirth = new DateTime(1990, 1, 1),
            city = "X",
            country = "Y",
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Member_endpoints_need_a_token()
    {
        var response = await _factory.CreateClient().GetAsync("/users");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("too-short-for-hs512")]
    public void A_missing_or_short_signing_key_fails_with_an_explanation(string? key)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["AppSettings:Token"] = key })
            .Build();

        var error = Assert.Throws<InvalidOperationException>(() => TokenKey.From(config));
        Assert.Contains("AppSettings:Token", error.Message);
    }

    [Fact]
    public async Task Logging_in_without_a_username_is_a_bad_request()
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/auth/login", new { password = "whatever" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
