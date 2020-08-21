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

        public async Task<Like> GetLike(int userId, int recepientId)
        {
            return await _context.Likes.FirstOrDefaultAsync(u =>
           u.LikerId == userId & u.LikeeId == recepientId
             );
        }

        public async Task<Photo> GetMainPhotoForUser(int userId)
        {
            return await _context.Photos.Where(u => u.UserId == userId)
            .FirstOrDefaultAsync(p => p.IsMain);
        }

        public async Task<Photo> GetPhoto(int id)
        {
            var photo = await _context.Photos.FirstOrDefaultAsync(p => p.Id == id);
            return photo;
        }

        public async Task<User> GetUser(int id)
        {
            var user = await _context.Users.Include(p => p.Photos).FirstOrDefaultAsync(u => u.Id == id);

            return user;
        }

        private async Task<IEnumerable<int>> GetUserLikes(int id, bool likers)
        {
            var user = await _context.Users
                .Include(x => x.Likers)
                .Include(x => x.Likees)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (likers)
            {
                return user.Likers.Where(u => u.LikeeId == id).Select(i => i.LikerId);
            }
            else
            {
                return user.Likees.Where(u => u.LikerId == id).Select(i => i.LikeeId);
            }
        }
        public async Task<PagedList<User>> GetUsers(UserParams userParams)
        {
            var users = _context.Users.Include(p => p.Photos).OrderByDescending(u => u.LastActive).AsQueryable();

            users = users.Where(u => u.Id != userParams.UserId);

            users = users.Where(u => u.Gender == userParams.Gender);

            if (userParams.Likers)
            {
                var userLikers = await GetUserLikes(userParams.UserId, userParams.Likers);
                users = users.Where(u => userLikers.Contains(u.Id));
            }

            if (userParams.Likees)
            {
                var userLikees = await GetUserLikes(userParams.UserId, userParams.Likers);
                users = users.Where(u => userLikees.Contains(u.Id));
            }

            if (userParams.Blockers)
            {
                var userBlockers = await GetUserBlocks(userParams.UserId, userParams.Blockers);
                users = users.Where(u => !(userBlockers.Contains(u.Id)));
                Console.WriteLine("Blocker" + users);
            }

            if (userParams.Blockees)
            {
                var userBlockers = await GetUserBlocks(userParams.UserId, userParams.Blockers);
                users = users.Where(u => (userBlockers.Contains(u.Id)));
                Console.WriteLine("Blocker" + users);
            }

            if (userParams.Dislikers)
            {
                var userDislikers = await GetUserDislikes(userParams.UserId, userParams.Dislikers);
                users = users.Where(u => userDislikers.Contains(u.Id));
            }

            if (userParams.Dislikees)
            {
                var userDislikees = await GetUserDislikes(userParams.UserId, userParams.Dislikers);
                users = users.Where(u => userDislikees.Contains(u.Id));
            }

            if (userParams.MinAge != 18 || userParams.MaxAge != 99)
            {
                var minDob = DateTime.Today.AddYears(-userParams.MaxAge - 1);
                var maxDob = DateTime.Today.AddYears(-userParams.MinAge - 1);

                users = users.Where(users => users.DateOfBirth >= minDob && users.DateOfBirth <= maxDob);
            }

            if (!string.IsNullOrEmpty(userParams.OrderBy))
            {
                switch (userParams.OrderBy)
                {
                    case "created":
                        users = users.OrderByDescending(u => u.Created);
                        break;
                    default:
                        users = users.OrderByDescending(u => u.LastActive);
                        break;
                }
            }

            return await PagedList<User>.CreateAsync(users, userParams.PageNumber, userParams.PageSize);
        }



        private async Task<IEnumerable<int>> GetUserDislikes(int id, bool dislikers)
        {
            var user = await _context.Users
                .Include(x => x.Dislikers)
                .Include(x => x.Dislikees)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (dislikers)
            {
                return user.Dislikers.Where(u => u.DislikeeId == id).Select(i => i.DislikerId);
            }
            else
            {
                return user.Dislikees.Where(u => u.DislikerId == id).Select(i => i.DislikeeId);
            }
        }

        public Task GetUsers(object userParams)
        {
            throw new System.NotImplementedException();
        }

        public async Task<bool> SaveAll()
        {
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<Message> GetMessage(int id)
        {
            return await _context.Messages.FirstOrDefaultAsync(m => m.Id == id);
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
            var messages = await _context.Messages
                 .Include(u => u.Sender).ThenInclude(p => p.Photos)
                 .Include(u => u.Recipient).ThenInclude(p => p.Photos)
                 .Where(m => m.RecipientId == userId && m.RecipientDeleted == false
                     && m.SenderId == recipientId
                     || m.RecipientId == recipientId && m.SenderId == userId && m.SenderDeleted == false
                     )
                 .OrderByDescending(m => m.MessageSent)
                 .ToListAsync();

            return messages;
        }

        public async Task<Dislike> GetDislike(int userId, int recepientId)
        {
            return await _context.Dislikes.FirstOrDefaultAsync(u =>
           u.DislikerId == userId & u.DislikeeId == recepientId
             );
        }

        public async Task DelLike(int userId, int recepientId)
        {
            var user = await _context.Likes.FirstOrDefaultAsync(u =>
             u.LikerId == userId & u.LikeeId == recepientId
              );
            if (user != null)
                _context.Remove(user);
        }

        public async Task DelDislike(int userId, int recepientId)
        {
            var user = await _context.Dislikes.FirstOrDefaultAsync(u =>
             u.DislikerId == userId & u.DislikeeId == recepientId
              );
            if (user != null)
                _context.Remove(user);
        }

        public async Task DelUser(int userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u =>
            u.Id == userId
             );
            if (user != null)
                _context.Remove(user);
        }

        public async Task<Block> GetBlock(int userId, int recepientId)
        {
            return await _context.Blocks.FirstOrDefaultAsync(u =>
         u.BlockerId == userId & u.BlockeeId == recepientId
           );
        }
        public async Task<IEnumerable<int>> GetUserBlocks(int userId, bool blockers)
        {
            var user = await _context.Users
                .Include(x => x.Blockers)
                .Include(x => x.Blockees)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (blockers)
            {
                return user.Blockees.Where(u => u.BlockerId == userId).Select(i => i.BlockeeId);

            }
            else
            {
                return user.Blockees.Where(u => u.BlockerId == userId).Select(i => i.BlockeeId);
            }
        }

        public async Task DelBlock(int userId, int recepientId)
        {
            var block = await _context.Blocks.FirstOrDefaultAsync(u =>
            u.BlockerId == userId & u.BlockeeId == recepientId
             );
            if (block != null)
                _context.Remove(block);
        }
    }
}