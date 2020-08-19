using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace DatingApp.API.Tests;

public class MessageTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public MessageTests(ApiFactory factory)
    {
        _factory = factory;
        _factory.EnsureDatabase();
    }

    private async Task<(TestUser Alice, TestUser Bob, TestUser Mallory, int MessageId)> ConversationAsync()
    {
        var alice = await _factory.RegisterAndLoginAsync("female");
        var bob = await _factory.RegisterAndLoginAsync("male");
        var mallory = await _factory.RegisterAndLoginAsync("male");

        var sent = await _factory.ClientFor(alice).PostAsJsonAsync(
            $"/users/{alice.Id}/messages", new { recipientId = bob.Id, content = "Coffee on Saturday?" });
        Assert.Equal(HttpStatusCode.Created, sent.StatusCode);
        var body = await sent.Content.ReadFromJsonAsync<JsonElement>();
        return (alice, bob, mallory, body.GetProperty("id").GetInt32());
    }

    [Fact]
    public async Task A_participant_can_read_a_message_with_both_names_filled_in()
    {
        var (alice, bob, _, id) = await ConversationAsync();

        var message = await _factory.ClientFor(bob)
            .GetFromJsonAsync<JsonElement>($"/users/{bob.Id}/messages/{id}");

        Assert.Equal(alice.Username, message.GetProperty("senderKnownAs").GetString());
        Assert.Equal(bob.Username, message.GetProperty("recipientKnownAs").GetString());
    }

    [Fact]
    public async Task An_outsider_can_neither_read_nor_delete_someone_elses_message()
    {
        var (_, bob, mallory, id) = await ConversationAsync();
        var asMallory = _factory.ClientFor(mallory);

        var read = await asMallory.GetAsync($"/users/{mallory.Id}/messages/{id}");
        var delete = await asMallory.PostEmptyAsync($"/users/{mallory.Id}/messages/{id}/both");

        Assert.Equal(HttpStatusCode.Unauthorized, read.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, delete.StatusCode);
        var stillThere = await _factory.ClientFor(bob).GetAsync($"/users/{bob.Id}/messages/{id}");
        Assert.Equal(HttpStatusCode.OK, stillThere.StatusCode);
    }

    [Fact]
    public async Task Deleting_for_everyone_removes_the_message()
    {
        var (_, bob, _, id) = await ConversationAsync();
        var asBob = _factory.ClientFor(bob);

        var delete = await asBob.PostEmptyAsync($"/users/{bob.Id}/messages/{id}/both");
        var after = await asBob.GetAsync($"/users/{bob.Id}/messages/{id}");

        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, after.StatusCode);
    }

    [Fact]
    public async Task The_thread_and_inbox_show_the_conversation()
    {
        var (alice, bob, _, id) = await ConversationAsync();
        var asBob = _factory.ClientFor(bob);

        var thread = await asBob.GetFromJsonAsync<JsonElement[]>($"/users/{bob.Id}/messages/thread/{alice.Id}");
        var unread = await asBob.GetAsync($"/users/{bob.Id}/messages?messageContainer=Unread");
        var unreadBody = await unread.Content.ReadFromJsonAsync<JsonElement[]>();

        Assert.Equal(id, Assert.Single(thread!).GetProperty("id").GetInt32());
        Assert.Equal(id, Assert.Single(unreadBody!).GetProperty("id").GetInt32());
        Assert.Contains("\"totalItems\":1", unread.Headers.GetValues("Pagination").Single());
    }

    [Fact]
    public async Task Marking_as_read_moves_a_message_out_of_unread()
    {
        var (_, bob, _, id) = await ConversationAsync();
        var asBob = _factory.ClientFor(bob);

        var mark = await asBob.PostEmptyAsync($"/users/{bob.Id}/messages/{id}/read");
        var unread = await asBob.GetFromJsonAsync<JsonElement[]>($"/users/{bob.Id}/messages?messageContainer=Unread");

        Assert.Equal(HttpStatusCode.NoContent, mark.StatusCode);
        Assert.Empty(unread!);
    }

    [Fact]
    public async Task Marking_a_missing_message_as_read_is_not_found()
    {
        var me = await _factory.RegisterAndLoginAsync();

        var response = await _factory.ClientFor(me).PostEmptyAsync($"/users/{me.Id}/messages/999999/read");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task An_empty_message_is_rejected()
    {
        var alice = await _factory.RegisterAndLoginAsync("female");
        var bob = await _factory.RegisterAndLoginAsync("male");

        var response = await _factory.ClientFor(alice).PostAsJsonAsync(
            $"/users/{alice.Id}/messages", new { recipientId = bob.Id, content = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
