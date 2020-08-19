using Microsoft.EntityFrameworkCore;

namespace DatingApp.API.Data
{
    public static class DatabaseSetup
    {
        public static void MigrateAndSeed(DataContext context, string contentRoot)
        {
            context.Database.Migrate();
            Seed.SeedUsers(context, contentRoot);
        }
    }
}
