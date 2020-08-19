using System;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace DatingApp.API.Helpers
{
    /// <summary>
    /// The HMAC-SHA512 key every JWT this API issues is signed with. Startup
    /// and AuthController both read it from here so they cannot disagree on
    /// encoding or validation.
    /// </summary>
    public static class TokenKey
    {
        // HS512 needs a key of at least 512 bits; Microsoft.IdentityModel 7+
        // refuses to sign with anything shorter (IDX10720).
        public const int MinimumLength = 64;

        public static SymmetricSecurityKey From(IConfiguration configuration)
        {
            var secret = configuration["AppSettings:Token"];

            if (string.IsNullOrWhiteSpace(secret))
                throw new InvalidOperationException(
                    "AppSettings:Token is not set. Supply it with the AppSettings__Token " +
                    "environment variable (APP_TOKEN_KEY in DatingApp/.env). See README.md.");

            if (secret.Length < MinimumLength)
                throw new InvalidOperationException(
                    $"AppSettings:Token is {secret.Length} characters. Use at least {MinimumLength}: " +
                    "HMAC-SHA512 needs a 512-bit key, and a short key lets anyone forge tokens.");

            return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        }
    }
}
