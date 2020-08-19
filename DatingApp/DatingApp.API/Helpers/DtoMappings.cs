using System.Collections.Generic;
using System.Linq;
using DatingApp.API.Dtos;
using DatingApp.API.Models;

namespace DatingApp.API.Helpers
{
    /// <summary>
    /// Entity/DTO conversions. These were AutoMapper profiles; AutoMapper 10
    /// crashes on .NET 7+ and later releases changed licence, and nine flat
    /// mappings do not need a reflection-based mapper.
    /// </summary>
    public static class DtoMappings
    {
        private static string MainPhotoUrl(User user) =>
            user?.Photos?.FirstOrDefault(p => p.IsMain)?.Url;

        public static UserForListDto ToListDto(this User user) => new UserForListDto
        {
            Id = user.Id,
            Username = user.Username,
            Gender = user.Gender,
            Age = user.DateOfBirth.CalculateAge(),
            KnownAs = user.KnownAs,
            Created = user.Created,
            LastActive = user.LastActive,
            City = user.City,
            Country = user.Country,
            PhotoUrl = MainPhotoUrl(user)
        };

        public static UserForDetailedDto ToDetailedDto(this User user) => new UserForDetailedDto
        {
            Id = user.Id,
            Username = user.Username,
            Gender = user.Gender,
            Age = user.DateOfBirth.CalculateAge(),
            KnownAs = user.KnownAs,
            Created = user.Created,
            LastActive = user.LastActive,
            Introduction = user.Introduction,
            LookingFor = user.LookingFor,
            Interests = user.Interests,
            City = user.City,
            Country = user.Country,
            Photos = (user.Photos ?? Enumerable.Empty<Photo>())
                .Select(p => new PhotosForDetailedDtos
                {
                    Id = p.Id,
                    Url = p.Url,
                    Description = p.Description,
                    DateAdded = p.DateAdded,
                    IsMain = p.IsMain
                })
                .ToList(),
            PhotoUrl = MainPhotoUrl(user)
        };

        public static void ApplyTo(this UserForUpdateDto update, User user)
        {
            user.Introduction = update.Introduction;
            user.LookingFor = update.LookingFor;
            user.Interests = update.Interests;
            user.City = update.City;
            user.Country = update.Country;
        }

        public static User ToUser(this UserForRegisterDtos dto) => new User
        {
            Username = dto.Username,
            Gender = dto.Gender,
            KnownAs = dto.KnownAs,
            DateOfBirth = dto.DateOfBirth,
            City = dto.City,
            Country = dto.Country,
            Created = dto.Created,
            LastActive = dto.LastActive
        };

        public static PhotoForReturnDto ToReturnDto(this Photo photo) => new PhotoForReturnDto
        {
            Id = photo.Id,
            Url = photo.Url,
            Description = photo.Description,
            DateAdded = photo.DateAdded,
            IsMain = photo.IsMain,
            PublicId = photo.PublicId
        };

        public static Photo ToPhoto(this PhotoForCreationDto dto) => new Photo
        {
            Url = dto.Url,
            Description = dto.Description,
            DateAdded = dto.DateAdded,
            PublicId = dto.PublicId
        };

        public static Message ToMessage(this MessageForCreationDto dto) => new Message
        {
            SenderId = dto.SenderId,
            RecipientId = dto.RecipientId,
            MessageSent = dto.MessageSent,
            Content = dto.Content
        };

        public static MessageToReturnDto ToReturnDto(this Message message) => new MessageToReturnDto
        {
            Id = message.Id,
            SenderId = message.SenderId,
            SenderKnownAs = message.Sender?.KnownAs,
            SenderPhotoUrl = MainPhotoUrl(message.Sender),
            RecipientId = message.RecipientId,
            RecipientKnownAs = message.Recipient?.KnownAs,
            RecipientPhotoUrl = MainPhotoUrl(message.Recipient),
            Content = message.Content,
            IsRead = message.IsRead,
            DateRead = message.DateRead,
            MessageSent = message.MessageSent
        };

        public static IEnumerable<MessageToReturnDto> ToReturnDtos(this IEnumerable<Message> messages) =>
            messages.Select(m => m.ToReturnDto()).ToList();
    }
}
