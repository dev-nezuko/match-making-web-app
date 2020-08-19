using System.Net;
using System.Net.Http.Headers;
using DatingApp.API.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;

namespace DatingApp.API.Tests;

public class SeedAndPhotoTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public SeedAndPhotoTests(ApiFactory factory)
    {
        _factory = factory;
        _factory.EnsureDatabase();
    }

    [Fact]
    public void Seeding_twice_adds_the_seed_users_once()
    {
        // Its own database: the shared fixture already has registered users,
        // and seeding rightly does nothing once any user exists.
        using var factory = new ApiFactory();
        factory.EnsureDatabase();
        var contentRoot = factory.Services.GetRequiredService<IWebHostEnvironment>().ContentRootPath;

        using (var context = factory.CreateContext())
            Seed.SeedUsers(context, contentRoot);
        using (var context = factory.CreateContext())
            Seed.SeedUsers(context, contentRoot);

        using var check = factory.CreateContext();
        Assert.Equal(10, check.Users.Count());
        Assert.Equal(10, check.Users.Select(u => u.Username).Distinct().Count());
    }

    [Fact]
    public async Task Uploading_without_cloudinary_says_so_instead_of_crashing()
    {
        var me = await _factory.RegisterAndLoginAsync();
        var form = new MultipartFormDataContent();
        var image = new ByteArrayContent(new byte[] { 0x89, 0x50, 0x4E, 0x47 });
        image.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        form.Add(image, "File", "me.png");

        var response = await _factory.ClientFor(me).PostAsync($"/users/{me.Id}/photos", form);

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

    [Fact]
    public async Task An_unknown_photo_is_not_found()
    {
        var me = await _factory.RegisterAndLoginAsync();

        var response = await _factory.ClientFor(me).GetAsync($"/users/{me.Id}/photos/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
