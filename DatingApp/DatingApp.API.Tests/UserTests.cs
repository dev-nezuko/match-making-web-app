using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace DatingApp.API.Tests;

public class UserTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public UserTests(ApiFactory factory)
    {
        _factory = factory;
        _factory.EnsureDatabase();
    }

    private static async Task<int[]> IdsAsync(HttpClient client, string query)
    {
        var users = await client.GetFromJsonAsync<JsonElement[]>($"/users?pageSize=50&{query}");
        return users!.Select(u => u.GetProperty("id").GetInt32()).ToArray();
    }

    [Fact]
    public async Task The_member_list_defaults_to_the_other_gender_and_leaves_you_out()
    {
        var me = await _factory.RegisterAndLoginAsync("female");
        var man = await _factory.RegisterAndLoginAsync("male");
        var woman = await _factory.RegisterAndLoginAsync("female");

        var ids = await IdsAsync(_factory.ClientFor(me), "");

        Assert.Contains(man.Id, ids);
        Assert.DoesNotContain(woman.Id, ids);
        Assert.DoesNotContain(me.Id, ids);
    }

    [Fact]
    public async Task Disliking_someone_you_liked_moves_them_between_lists()
    {
        var me = await _factory.RegisterAndLoginAsync("female");
        var him = await _factory.RegisterAndLoginAsync("male");
        var client = _factory.ClientFor(me);

        await client.PostEmptyAsync($"/users/{me.Id}/like/{him.Id}");
        Assert.Contains(him.Id, await IdsAsync(client, "likees=true"));

        await client.PostEmptyAsync($"/users/{me.Id}/dislike/{him.Id}");
        Assert.DoesNotContain(him.Id, await IdsAsync(client, "likees=true"));
        Assert.Contains(him.Id, await IdsAsync(client, "dislikees=true"));
    }

    [Fact]
    public async Task Liking_twice_is_rejected()
    {
        var me = await _factory.RegisterAndLoginAsync("female");
        var him = await _factory.RegisterAndLoginAsync("male");
        var client = _factory.ClientFor(me);

        await client.PostEmptyAsync($"/users/{me.Id}/like/{him.Id}");
        var again = await client.PostEmptyAsync($"/users/{me.Id}/like/{him.Id}");

        Assert.Equal(HttpStatusCode.BadRequest, again.StatusCode);
    }

    [Fact]
    public async Task A_blocked_member_leaves_the_list_and_appears_under_blocked()
    {
        var me = await _factory.RegisterAndLoginAsync("female");
        var him = await _factory.RegisterAndLoginAsync("male");
        var client = _factory.ClientFor(me);

        var block = await client.PostEmptyAsync($"/users/{me.Id}/block/{him.Id}");

        Assert.Equal(HttpStatusCode.OK, block.StatusCode);
        Assert.DoesNotContain(him.Id, await IdsAsync(client, ""));
        Assert.Contains(him.Id, await IdsAsync(client, "blockees=true"));

        await client.PostEmptyAsync($"/users/{me.Id}/unblock/{him.Id}");
        Assert.Contains(him.Id, await IdsAsync(client, ""));
    }

    [Fact]
    public async Task You_cannot_edit_someone_elses_profile()
    {
        var me = await _factory.RegisterAndLoginAsync("female");
        var him = await _factory.RegisterAndLoginAsync("male");

        var response = await _factory.ClientFor(me).PutAsJsonAsync($"/users/{him.Id}",
            new { introduction = "hijacked", lookingFor = "", interests = "", city = "", country = "" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Editing_your_profile_is_saved()
    {
        var me = await _factory.RegisterAndLoginAsync("female");
        var client = _factory.ClientFor(me);

        var put = await client.PutAsJsonAsync($"/users/{me.Id}",
            new { introduction = "Hiker", lookingFor = "Someone kind", interests = "Maps", city = "Bergen", country = "Norway" });
        var profile = await client.GetFromJsonAsync<JsonElement>($"/users/{me.Id}");

        Assert.Equal(HttpStatusCode.NoContent, put.StatusCode);
        Assert.Equal("Bergen", profile.GetProperty("city").GetString());
        Assert.Equal("Hiker", profile.GetProperty("introduction").GetString());
    }
}
