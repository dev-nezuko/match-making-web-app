# Member profiles, likes and messaging

An Angular 10 client and an ASP.NET Core 3.1 API for a dating-style member directory. The project explores filtered profile browsing, likes/dislikes, blocking, photo uploads, and conversations.

This is an older learning project. It has no AI matching model, and its maps preview was a placeholder rather than a member-location implementation. It is not ready to accept real profiles or messages on a public service.

## Project map

| Path | Responsibility |
| --- | --- |
| `DatingApp/DatingApp-SPA` | Angular routes, forms, member cards, messages |
| `DatingApp/DatingApp.API` | ASP.NET controllers, JWT authentication, EF Core SQLite |
| `DatingApp/DatingApp.API/Data` | Repository layer and ten seed profiles |
| `DatingApp/DatingApp.API/Controllers/MessagesController.cs` | Participant checks and per-user deletion |

The client sends bearer tokens to the API. EF Core stores members and messages in SQLite; Cloudinary is an optional external photo provider. The map and social-login integrations are incomplete and should not be presented as verified features.

## Local configuration, without shared credentials

The original toolchains are Angular 10/TypeScript 3.9 and .NET Core 3.1. Use an isolated environment compatible with those declarations. Framework modernization is separate work; the current machine had no .NET SDK, so there is no claim of a successful API build.

In `DatingApp/DatingApp.API`, copy `appsettings.example.json` to ignored `appsettings.json`. Fill `AppSettings:Token` with a private random value of at least 64 UTF-8 bytes. The spelling `ConnectionStrings:DeafultConnection` matches the existing code. Configure Cloudinary only in local ignored configuration if you own the account.

The API defaults to `http://127.0.0.1:5000`. `FrontendOrigin` defaults to `http://localhost:4200`. In a compatible SDK environment:

```sh
dotnet restore
dotnet run
```

Startup does **not** migrate or seed by default. To initialize an empty disposable SQLite database, explicitly set `INITIALIZE_DEMO_DATABASE=true` and a private `DEMO_SEED_PASSWORD` of at least 12 characters before starting. That operation writes fixture records and should never target a real member database. A nonempty user table is left unseeded.

In `DatingApp/DatingApp-SPA`, inspect the lockfile and use a compatible Node/npm installation:

```sh
npm ci --ignore-scripts
npm start
```

Both Angular environments now declare the API URL. Adjust that URL and JWT allowed domains together if changing the API origin. The browser Maps key was removed; do not reinsert the old value. The location button is disabled because the old code geocoded a fixed sample address and displayed unrelated default coordinates. Implement a consent-based, approximate location feature before enabling it. The frontend key field is public configuration, not secret storage.

## Security changes and their limits

Message-by-ID reads now require the caller to be a participant and return a DTO. Ordinary deletion requires participant ownership and changes the caller's copy. The unsafe `POST /users/{userId}/messages/{id}/both` route returns 410 pending a decision about deleting for everyone; it can no longer remove unrelated conversations. Missing message IDs are handled before dereferencing.

The API requires a private signing key, explicitly checks token lifetime, returns generic production errors, restricts CORS to the configured frontend, and bounds photo requests to one JPEG/PNG media type of at most 5 MiB. A claimed MIME type is not full image validation: provider decoding, quotas and error handling still need integration tests. Upload/delete operations can affect an external Cloudinary account, so they were not executed.

The old shared seed password is gone from current source. The committed Maps key was removed from reachable history; cached objects and other copies may remain. Ownership and provider-side restriction/rotation are unresolved.

## What was verified

Read-only working-tree and all-object inspection covered the isolated clone before execution. No confirmed malware or listed fingerprint matches were found. JSON configuration, project XML and whitespace checks passed. Source changes were reviewed as text.

No dependencies were installed and no project code, .NET build, Angular build, database migration, seed, real login, Cloudinary operation, Google request or social login was run for this repository. No screenshots of the seeded people were created.

Before selecting this as a portfolio pin, add API authorization tests using unrelated users, compile and run both applications, replace the obsolete toolchains, review blocking/privacy rules across every message route, and finish keyboard/mobile behavior and accessible forms. Password storage uses the older keyed SHA-512 scheme and needs a deliberate password-hashing migration. Session revocation, moderation, rate limits, retention, and end-to-end consent/privacy controls remain. A working profile/messaging integration is more valuable than additional decorative claims.
