using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using DatingApp.API;
using DatingApp.API.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DatingApp.API.Tests;

/// <summary>
/// Runs the real API in-process against a throwaway SQLite file, migrated
/// but not seeded, so every test creates exactly the users it talks about.
/// </summary>
public class ApiFactory : WebApplicationFactory<Program>
{
    public string DatabasePath { get; } =
        Path.Combine(Path.GetTempPath(), $"datingapp-test-{Guid.NewGuid():N}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = $"Data Source={DatabasePath}",
                ["AppSettings:Token"] = new string('k', 64),
            }));
    }

    public DataContext CreateContext() =>
        Services.CreateScope().ServiceProvider.GetRequiredService<DataContext>();

    public void EnsureDatabase()
    {
        using var scope = Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<DataContext>().Database.Migrate();
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
        File.Delete(DatabasePath);
    }
}

public record TestUser(int Id, string Username, string Token);

public static class ApiClientExtensions
{
    public const string Password = "correct-horse-battery";

    public static async Task<TestUser> RegisterAndLoginAsync(this ApiFactory factory,
        string gender = "female", DateTime? dateOfBirth = null, string? username = null)
    {
        var client = factory.CreateClient();
        username ??= "u" + Guid.NewGuid().ToString("N")[..10];

        var register = await client.PostAsJsonAsync("/auth/register", new
        {
            username,
            password = Password,
            gender,
            knownAs = username,
            dateOfBirth = dateOfBirth ?? new DateTime(1995, 6, 15),
            city = "Testville",
            country = "Nowhere",
        });
        register.EnsureSuccessStatusCode();

        var login = await client.PostAsJsonAsync("/auth/login", new { username, password = Password });
        login.EnsureSuccessStatusCode();
        var body = await login.Content.ReadFromJsonAsync<JsonElement>();
        var user = body.GetProperty("user");
        return new TestUser(user.GetProperty("id").GetInt32(), username, body.GetProperty("token").GetString()!);
    }

    public static HttpClient ClientFor(this ApiFactory factory, TestUser user)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user.Token);
        return client;
    }

    public static Task<HttpResponseMessage> PostEmptyAsync(this HttpClient client, string url) =>
        client.PostAsync(url, new StringContent("{}", Encoding.UTF8, "application/json"));

    public static JsonElement JwtPayload(string token)
    {
        var part = token.Split('.')[1].Replace('-', '+').Replace('_', '/');
        part = part.PadRight(part.Length + (4 - part.Length % 4) % 4, '=');
        return JsonDocument.Parse(Convert.FromBase64String(part)).RootElement;
    }
}
