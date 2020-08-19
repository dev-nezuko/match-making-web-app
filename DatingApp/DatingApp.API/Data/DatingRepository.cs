using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DatingApp.API.Helpers;
using DatingApp.API.Models;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.API.Data
{
    public class DatingRepository : IDatingRepository
    {
        private readonly DataContext _context;

        public DatingRepository(DataContext context)
        {
            _context = context;
        }

        public void Add<T>(T entity) where T : class
        {
            _context.Add(entity);
        }

        public void Delete<T>(T entity) where T : class
        {
            _context.Remove(entity);
        }

        public async Task<bool> SaveAll()
        {
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<User> GetUser(int id)
        {
            return await _context.Users.Include(p => p.Photos).FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<PagedList<User>> GetUsers(UserParams userParams)
        {
            var me = userParams.UserId;
            var users = _context.Users.Include(p => p.Photos)
                .Where(u => u.Id != me && u.Gender == userParams.Gender);

            var blockedByMe = _context.Blocks.Where(b => b.BlockerId == me).Select(b => b.BlockeeId);

            if (userParams.Blockees)
            {
                users = users.Where(u => blockedByMe.Contains(u.Id));
            }
            else
            {
                // A block hides the two members from each other both ways.
                var blockedMe = _context.Blocks.Where(b => b.BlockeeId == me).Select(b => b.BlockerId);
                users = users.Where(u => !blockedByMe.Contains(u.Id) && !blockedMe.Contains(u.Id));
            }

            if (userParams.Likers)
                users = users.Where(u => _context.Likes.Any(l => l.LikeeId == me && l.LikerId == u.Id));

            if (userParams.Likees)
                users = users.Where(u => _context.Likes.Any(l => l.LikerId == me && l.LikeeId == u.Id));

            if (userParams.Dislikers)
                users = users.Where(u => _context.Dislikes.Any(d => d.DislikeeId == me && d.DislikerId == u.Id));

            if (userParams.Dislikees)
                users = users.Where(u => _context.Dislikes.Any(d => d.DislikerId == me && d.DislikeeId == u.Id));

            if (userParams.MinAge != 18 || userParams.MaxAge != 99)
            {
                // At least MinAge: born on or before today minus MinAge years.
                // At most MaxAge: born after today minus (MaxAge + 1) years.
                var minDob = DateTime.Today.AddYears(-userParams.MaxAge - 1);
                var maxDob = DateTime.Today.AddYears(-userParams.MinAge);

                users = users.Where(u => u.DateOfBirth > minDob && u.DateOfBirth <= maxDob);
            }

            users = userParams.OrderBy == "created"
                ? users.OrderByDescending(u => u.Created)
                : users.OrderByDescending(u => u.LastActive);

            return await PagedList<User>.CreateAsync(users, userParams.PageNumber, userParams.PageSize);
        }

        public async Task DeleteUserWithRelations(User user)
        {
            var id = user.Id;
            _context.Likes.RemoveRange(await _context.Likes.Where(l => l.LikerId == id || l.LikeeId == id).ToListAsync());
            _context.Dislikes.RemoveRange(await _context.Dislikes.Where(d => d.DislikerId == id || d.DislikeeId == id).ToListAsync());
            _context.Blocks.RemoveRange(await _context.Blocks.Where(b => b.BlockerId == id || b.BlockeeId == id).ToListAsync());
            _context.Messages.RemoveRange(await _context.Messages.Where(m => m.SenderId == id || m.RecipientId == id).ToListAsync());
            _context.Photos.RemoveRange(user.Photos);
            _context.Users.Remove(user);
        }

        public async Task<Photo> GetPhoto(int id)
        {
            return await _context.Photos.FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<Photo> GetMainPhotoForUser(int userId)
        {
            return await _context.Photos.FirstOrDefaultAsync(p => p.UserId == userId && p.IsMain);
        }

        public async Task<Like> GetLike(int userId, int recipientId)
        {
            return await _context.Likes.FirstOrDefaultAsync(l => l.LikerId == userId && l.LikeeId == recipientId);
        }

        public async Task<Dislike> GetDislike(int userId, int recipientId)
        {
            return await _context.Dislikes.FirstOrDefaultAsync(d => d.DislikerId == userId && d.DislikeeId == recipientId);
        }

        public async Task<Block> GetBlock(int userId, int recipientId)
        {
            return await _context.Blocks.FirstOrDefaultAsync(b => b.BlockerId == userId && b.BlockeeId == recipientId);
        }

        public async Task<bool> EitherBlocked(int userId, int otherId)
        {
            return await _context.Blocks.AnyAsync(b =>
                (b.BlockerId == userId && b.BlockeeId == otherId) ||
                (b.BlockerId == otherId && b.BlockeeId == userId));
        }

        public async Task<Message> GetMessage(int id)
        {
            return await _context.Messages
                .Include(u => u.Sender).ThenInclude(p => p.Photos)
                .Include(u => u.Recipient).ThenInclude(p => p.Photos)
                .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task<PagedList<Message>> GetMessagesForUser(MessageParams messageParams)
        {
            var messages = _context.Messages
                .Include(u => u.Sender).ThenInclude(p => p.Photos)
                .Include(u => u.Recipient).ThenInclude(p => p.Photos)
                .AsQueryable();

            switch (messageParams.MessageContainer)
            {
                case "Inbox":
                    messages = messages.Where(u => u.RecipientId == messageParams.UserId
                        && u.RecipientDeleted == false);
                    break;
                case "Outbox":
                    messages = messages.Where(u => u.SenderId == messageParams.UserId
                        && u.SenderDeleted == false);
                    break;
                default:
                    messages = messages.Where(u => u.RecipientId == messageParams.UserId
                        && u.RecipientDeleted == false && u.IsRead == false);
                    break;
            }

            messages = messages.OrderByDescending(d => d.MessageSent);

            return await PagedList<Message>.CreateAsync(messages, messageParams.PageNumber, messageParams.PageSize);
        }

        public async Task<IEnumerable<Message>> GetMessagesThread(int userId, int recipientId)
        {
            return await _context.Messages
                .Include(u => u.Sender).ThenInclude(p => p.Photos)
                .Include(u => u.Recipient).ThenInclude(p => p.Photos)
                .Where(m => (m.RecipientId == userId && m.SenderId == recipientId && !m.RecipientDeleted)
                         || (m.RecipientId == recipientId && m.SenderId == userId && !m.SenderDeleted))
                .OrderByDescending(m => m.MessageSent)
                .ToListAsync();
        }
    }
}
