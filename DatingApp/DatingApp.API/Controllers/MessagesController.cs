using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using DatingApp.API.Data;
using DatingApp.API.Dtos;
using DatingApp.API.Helpers;
using DatingApp.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DatingApp.API.Controllers
{
    [ServiceFilter(typeof(LogUserActivity))]
    [Authorize]
    [Route("users/{userId}/[controller]")]
    [ApiController]
    public class MessagesController : ControllerBase
    {
        private readonly IDatingRepository _repo;
        public MessagesController(IDatingRepository repo)
        {
            _repo = repo;
        }

        [HttpGet("{id}", Name = "GetMessage")]
        public async Task<IActionResult> GetMessage(int userId, int id)
        {
            if (userId != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();


            var messageFromRepo = await _repo.GetMessage(id);

            if (messageFromRepo == null)
                return NotFound();

            // Reading a message you are not part of is not yours to do.
            if (messageFromRepo.SenderId != userId && messageFromRepo.RecipientId != userId)
                return Unauthorized();

            // This returned the EF entity directly. Message -> Sender -> MessagesSent
            // -> Message is a cycle, so the serialiser threw and the endpoint
            // answered 500 every single time. Every other action here maps to a
            // DTO first; this one did not.
            return Ok(messageFromRepo.ToReturnDto());
        }



        [HttpGet]
        public async Task<IActionResult> GetMessagesForUser(int userId,
           [FromQuery] MessageParams messageParams)
        {
            if (userId != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();

            messageParams.UserId = userId;

            var messagesFromRepo = await _repo.GetMessagesForUser(messageParams);

            var messages = messagesFromRepo.ToReturnDtos();

            Response.AddPagination(messagesFromRepo.CurrentPage, messagesFromRepo.PageSize,
                messagesFromRepo.TotalCount, messagesFromRepo.TotalPages);

            return Ok(messages);
        }

        [HttpGet("thread/{recipientId}")]
        public async Task<IActionResult> GetMessageThread(int userId, int recipientId)
        {
            if (userId != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();

            var messagesFromRepo = await _repo.GetMessagesThread(userId, recipientId);

            var messageThread = messagesFromRepo.ToReturnDtos();

            return Ok(messageThread);
        }


        [HttpPost]
        public async Task<IActionResult> CreateMessage(int userId, MessageForCreationDto messageForCreationDto)
        {
            var Sender = await _repo.GetUser(userId);
            if (Sender.Id != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();


            messageForCreationDto.SenderId = userId;

            var recipient = await _repo.GetUser(messageForCreationDto.RecipientId);

            if (recipient == null)
                return BadRequest("Could not find user");

            var message = messageForCreationDto.ToMessage();

            _repo.Add(message);

            if (await _repo.SaveAll())
            {
                var messageToReturn = message.ToReturnDto();
                return CreatedAtRoute("GetMessage", new { id = message.Id }, messageToReturn);
            }

            throw new Exception("Creating the message failed on save");
        }


        [HttpPost("{id}")]
        public async Task<IActionResult> DeleteMessage(int id, int userId)
        {
            if (userId != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();

            var messageFromRepo = await _repo.GetMessage(id);

            if (messageFromRepo == null)
                return NotFound();

            if (messageFromRepo.SenderId != userId && messageFromRepo.RecipientId != userId)
                return Unauthorized();

            if (messageFromRepo.SenderId == userId)
                messageFromRepo.SenderDeleted = true;

            if (messageFromRepo.RecipientId == userId)
                messageFromRepo.RecipientDeleted = true;

            if (messageFromRepo.SenderDeleted && messageFromRepo.RecipientDeleted)
                _repo.Delete(messageFromRepo);

            if (await _repo.SaveAll())
                return NoContent();

            throw new Exception("Error deleting the message");
        }


        [HttpPost("{id}/both")]
        public async Task<IActionResult> DeleteMessages(int id, int userId)
        {
            if (userId != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();

            var messageFromRepo = await _repo.GetMessage(id);

            if (messageFromRepo == null)
                return NotFound();

            // `if (userId != null)` stood here. userId is an int, so it was
            // always true -- and it was the only thing between an authenticated
            // caller and a hard delete. Nothing checked that the caller was in
            // the conversation, so any signed-in user could permanently remove
            // any message in the database by passing its id.
            if (messageFromRepo.SenderId != userId && messageFromRepo.RecipientId != userId)
                return Unauthorized();

            messageFromRepo.SenderDeleted = true;
            messageFromRepo.RecipientDeleted = true;
            _repo.Delete(messageFromRepo);

            if (await _repo.SaveAll())
                return NoContent();

            throw new Exception("Error deleting the message");
        }


        [HttpPost("{id}/read")]
        public async Task<IActionResult> MarkMessageAsRead(int userId, int id)
        {
            if (userId != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();

            var message = await _repo.GetMessage(id);

            if (message.RecipientId != userId)
                return Unauthorized();

            message.IsRead = true;
            message.DateRead = DateTime.Now;

            await _repo.SaveAll();

            return NoContent();
        }



    }
}