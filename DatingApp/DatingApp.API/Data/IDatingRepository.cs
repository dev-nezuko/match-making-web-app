using System.Collections.Generic;
using System.Threading.Tasks;
using DatingApp.API.Helpers;
using DatingApp.API.Models;

namespace DatingApp.API.Data
{
    public interface IDatingRepository
    {
        void Add<T>(T entity) where T : class;
        void Delete<T>(T entity) where T : class;
        Task<bool> SaveAll();
        Task<PagedList<User>> GetUsers(UserParams userParams);
        Task<User> GetUser(int id);

        Task<Photo> GetPhoto(int id);

        Task<Photo> GetMainPhotoForUser(int userId);
        Task GetUsers(object userParams);

        Task<Like> GetLike(int userId, int recepientId);

        Task<Block> GetBlock(int userId, int recepientId);



        Task<IEnumerable<int>> GetUserBlocks(int userId, bool blockers);

        Task DelLike(int userId, int recepientId);

        Task DelDislike(int userId, int recepientId);


        Task DelBlock(int userId, int recepientId);
        Task DelUser(int userId);

        Task<Dislike> GetDislike(int userId, int recepientId);

        Task<Message> GetMessage(int id);
        Task<PagedList<Message>> GetMessagesForUser(MessageParams messageParams);

        Task<IEnumerable<Message>> GetMessagesThread(int userId, int recipientId);
    }
}