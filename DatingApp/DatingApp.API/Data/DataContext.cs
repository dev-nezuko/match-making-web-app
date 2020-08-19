
using DatingApp.API.Models;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.API.Data
{
    public class DataContext : DbContext
    {
        public DataContext(DbContextOptions<DataContext> options) : base(options) { }

        public DbSet<Value> Values { get; set; }
        public DbSet<User> Users { get; set; }

        public DbSet<Photo> Photos { get; set; }

        public DbSet<Like> Likes { get; set; }


        public DbSet<Dislike> Dislikes { get; set; }

        public DbSet<Message> Messages { get; set; }
        public DbSet<Block> Blocks { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            builder.Entity<Like>()
                .HasKey(k => new { k.LikerId, k.LikeeId });

            builder.Entity<Like>()
                .HasOne(u => u.Likee)
                .WithMany(u => u.Likers)
                .HasForeignKey(u => u.LikeeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Like>()
                .HasOne(u => u.Liker)
                .WithMany(u => u.Likees)
                .HasForeignKey(u => u.LikerId)
                .OnDelete(DeleteBehavior.Restrict);


            builder.Entity<Block>()
                .HasKey(k => new { k.BlockerId, k.BlockeeId });

            builder.Entity<Block>()
                .HasOne(u => u.Blockee)
                .WithMany(u => u.Blockers)
                .HasForeignKey(u => u.BlockeeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Block>()
                .HasOne(u => u.Blocker)
                .WithMany(u => u.Blockees)
                .HasForeignKey(u => u.BlockerId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Dislike>()
            .HasKey(k => new { k.DislikerId, k.DislikeeId });

            builder.Entity<Dislike>()
                .HasOne(u => u.Dislikee)
                .WithMany(u => u.Dislikers)
                .HasForeignKey(u => u.DislikeeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Dislike>()
                .HasOne(u => u.Disliker)
                .WithMany(u => u.Dislikees)
                .HasForeignKey(u => u.DislikerId)
                .OnDelete(DeleteBehavior.Restrict);


            builder.Entity<Message>()
                 .HasOne(u => u.Sender)
                 .WithMany(m => m.MessagesSent)
                 .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Message>()
                .HasOne(u => u.Recipient)
                .WithMany(m => m.MessagesReceived)
                .OnDelete(DeleteBehavior.Restrict);
        }

    }
}