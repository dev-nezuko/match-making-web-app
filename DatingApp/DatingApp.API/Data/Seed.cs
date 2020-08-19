using System.Collections.Generic;
using DatingApp.API.Models;
using System.Text.Json;

namespace DatingApp.API.Data
{
    public class Seed
    {
        public static void SeedUsers(DataContext context, string contentRoot)
        {
            var userData = System.IO.File.ReadAllText(
                System.IO.Path.Combine(contentRoot, "Data", "UserSeedData.json"));
            var users = JsonSerializer.Deserialize<List<User>>(userData,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            foreach (var user in users)
            {
                byte[] passwordHash, passwordSalt;
                CreatePasswordHash("password", out passwordHash, out passwordSalt);

                user.PasswordHash = passwordHash;
                user.PasswordSalt = passwordSalt;
                user.Username = user.Username.ToLower();

                context.Users.Add(user);
            }

            context.SaveChanges();
        }

        private static void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
        {
            using (var hmac = new System.Security.Cryptography.HMACSHA512())
            {
                passwordSalt = hmac.Key;
                passwordHash = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
            }
        }
    }
}