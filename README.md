# DatingApp

A dating site: profiles, photos, likes, blocks and private messaging. ASP.NET
Core Web API with Entity Framework and SQLite, and an Angular single-page
frontend. About 7,700 lines.

## Running it

```bash
cd DatingApp
cp .env.example .env   # then set APP_TOKEN_KEY
docker compose up --build
```

The API is on `:5050` and the site on `:4200`. (Port 5000, which the code
originally assumed, is taken by AirPlay on macOS.)

`APP_TOKEN_KEY` is the signing key for every JWT the API issues. Any random
value of 64 or more characters works locally; compose refuses to start without it.

## Neither half started

**The API threw before it could listen.** `appsettings.json` was never
committed — and it is not in `.gitignore` either, so it was simply absent. Two
things then failed:

```csharp
services.AddDbContext<DataContext>(x =>
    x.UseSqlite(Configuration.GetConnectionString("DeafultConnection")));
```

`DeafultConnection` is a typo, and there was no configuration file for it to
read from under either spelling:

```
System.ArgumentNullException: Value cannot be null. (Parameter 'connectionString')
   at DatingApp.API.Startup.<ConfigureServices>b__4_0(DbContextOptionsBuilder x) in Startup.cs:line 41
```

Just below it, the JWT signing key was read straight into
`Encoding.ASCII.GetBytes(...)`, so an unset value threw from inside the
authentication setup rather than saying what was missing. There is now an
`appsettings.json`, the spelling is fixed, and a missing or too-short key fails
with a sentence explaining what to set.

**The Angular app did not compile.** Four separate reasons:

- `environment.prod.ts` contained only `production: true`. Every service reads
  `environment.apiUrl`, so `ng build --prod` failed on all of them. Only the
  development file had it.
- Five files imported `PaginatedResult` from
  `../../../../DatingApp.API/Models/pagination` — a TypeScript file that had
  been put inside the **C# project's** `Models` folder, outside the Angular
  source root, where the compiler cannot reach it. Moved to
  `src/app/_models/` with the other models.
- `ngx-bootstrap@5.6.1` fails Angular 10's stricter `ModuleWithProviders`
  check across eight of its own declaration files. Those are third-party
  `.d.ts` files, so `skipLibCheck` is the right answer rather than pinning
  every transitive dependency to match.
- **The dependencies were free to drift.** `package-lock.json` is out of sync
  with `package.json` — `npm ci` refuses it outright — so a fresh install
  resolves carets forward. `@auth0/angular-jwt@^5.0.1` lands on a build
  compiled for Angular 12, and the app is on 10:

  ```
  error TS2694: Namespace '@angular/core' has no exported member 'ɵɵFactoryDeclaration'
  ```

  `@auth0/angular-jwt` and `@agm/core` are pinned exactly now, which is what
  the lockfile was supposed to be doing.

Both halves run together, and the site is usable end to end:


The compose file puts nginx in front of both, proxying `/auth` and `/users` to
the API so the SPA and API share an origin and there is no CORS to configure.

## Any signed-in user could delete anybody's messages

```csharp
[HttpPost("{id}/both")]
public async Task<IActionResult> DeleteMessages(int id, int userId)
{
    if (userId != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
        return Unauthorized();

    var messageFromRepo = await _repo.GetMessage(id);
    ...
    if (userId != null)          // userId is an int. Always true.
    {
        messageFromRepo.SenderDeleted = true;
        messageFromRepo.RecipientDeleted = true;
        _repo.Delete(messageFromRepo);
    }
```

The check at the top confirms you are who your token says — it does not check
that the message is anything to do with you. `if (userId != null)` was the only
thing standing between that and a hard delete, and an `int` is never null. The
compiler said so:

```
warning CS0472: The result of the expression is always 'true' since a value of
type 'int' is never equal to 'null' of type 'int?'
```

So any authenticated user could permanently remove any message in the database
by its id, including a conversation between two strangers.

Three accounts, live against the running API:

```
alice(11) -> bob(12), message id 1

GET  message as bob (a participant)                      200
GET  message as mallory (not a participant)              401
POST .../both as mallory   (before: destroyed it)        401
GET  message as bob, after mallory's attempt             200      <- still there
POST .../both as bob (a participant)                     204
GET  message as bob, after his own delete                404
```

The single-sided delete had the same missing check, less dangerously: a
non-participant set no flags and saved nothing. It checks now too.

## Reading a message always failed

```csharp
return Ok(messageFromRepo);
```

That returns the EF entity, and `Message → Sender → MessagesSent → Message` is
a cycle:

```
System.Text.Json.JsonException: A possible object cycle was detected
```

Every other action in the controller maps to `MessageToReturnDto` first. This
one never did, so `GET /users/{userId}/messages/{id}` answered 500 every time —
and it is the route `CreatedAtRoute` points at, so the `Location` header
returned when you send a message pointed at a broken endpoint.

The repository query behind it also skipped the `Include`s every other message
query has, so both participants' names and photos came back null.

## Passwords

```csharp
[StringLength(8, MinimumLength = 4,
    ErrorMessage = "You must specify a password between 4 and 8 characters")]
```

A **maximum** of eight characters, and a minimum of four. The password is hashed
with HMACSHA512 into a fixed 64 bytes, so nothing downstream cared how long it
was — the cap only removed entropy. Now 8 to 128.

The hash comparison also returned on the first mismatching byte, so how long a
login took leaked how much of the hash was right. It uses
`CryptographicOperations.FixedTimeEquals` now.

## The Google Maps key

It was hardcoded in four places. Two were `<script src="http://...">` — plain
HTTP, which a browser blocks as mixed content from an HTTPS page. Two of those
tags were inside an Angular component template, where Angular strips `<script>`
entirely, so they had never run at all.

There is one copy now, in `environment.ts`. Maps keys are meant to ship in the
page; the thing that matters is restricting them by domain in the Google
console, which `.env`-style comments now say.

## Also

- `Console.WriteLine("I am callled")` in `Startup.ConfigureServices`. Removed.
- The API targets .NET 10 (LTS). Angular 10 went out of support in 2021.
  The SPA still builds and runs on it; moving it forward is a separate job.

## Layout

```
DatingApp/
  DatingApp.API/          ASP.NET Core Web API
    Controllers/          Auth, Users, Messages, Photos
    Data/                 EF context, repositories, seed
    Dtos/  Models/  Helpers/
  DatingApp-SPA/          Angular 10
    src/app/_services/    API clients
    src/app/_models/      including the pagination model moved out of the C# project
    src/app/members/      profile list, detail, editing
```
