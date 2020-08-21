using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using AutoMapper;
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
    [ApiController]
    [Route("[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IDatingRepository _repo;
        private readonly IMapper _mapper;
        public UsersController(IDatingRepository repo, IMapper mapper)
        {
            _mapper = mapper;
            _repo = repo;
        }
        [HttpGet]
        public async Task<IActionResult> GetUsers([FromQuery] UserParams userParams)
        {
            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

            // Console.WriteLine("likee" + currentUserId);

            var userFromRepo = await _repo.GetUser(currentUserId);

            userParams.UserId = currentUserId;
            //  Console.WriteLine("hello iaam checking userParams " + userParams.Blockees);
            if (userParams.Blockees != true)
                userParams.Blockers = true;

            if (userParams.Blockees == true)
            {
                userParams.Blockers = false;
            }

            if (string.IsNullOrEmpty(userParams.Gender))
            {
                userParams.Gender = userFromRepo.Gender == "male" ? "female" : "male";
            }

            var users = await _repo.GetUsers(userParams);

            var usersToReturn = _mapper.Map<IEnumerable<UserForListDto>>(users);

            Response.AddPagination(users.CurrentPage, users.PageSize,
                users.TotalCount, users.TotalPages);

            return Ok(usersToReturn);
        }

        [HttpGet("{id}", Name = "GetUser")]
        public async Task<IActionResult> GetUser(int id)
        {
            var user = await _repo.GetUser(id);

            var userToReturn = _mapper.Map<UserForDetailedDto>(user);

            return Ok(userToReturn);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, UserForUpdateDto userForUpdateDto)
        {
            if (id != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();

            var userFromRepo = await _repo.GetUser(id);

            _mapper.Map(userForUpdateDto, userFromRepo);

            if (await _repo.SaveAll())
                return NoContent();

            throw new Exception($"Updating user {id} failed on save");
        }

        [HttpPost("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            if (id != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();
            var user = await _repo.GetUser(id);
            Console.WriteLine("user is " + user);
            if (user == null)
                return NotFound();

            //await _repo.DelUser(id);

            _repo.Delete<User>(user);

            if (await _repo.SaveAll())
                return Ok();

            return BadRequest("Failed to delete user");
        }
        [HttpPost("{id}/unblock/{recipientId}")]

        public async Task<IActionResult> UnblockUser(int id, int recipientId)
        {
            if (id != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();

            var block = await _repo.GetBlock(id, recipientId);

            if (block == null)
                return BadRequest("You have not blocked this user");

            if (await _repo.GetUser(recipientId) == null)
                return NotFound();

            await _repo.DelBlock(id, recipientId);

            return Ok();
        }



        [HttpPost("{id}/like/{recipientId}")]
        public async Task<IActionResult> LikeUser(int id, int recipientId)
        {
            if (id != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();

            var like = await _repo.GetLike(id, recipientId);

            if (like != null)
                return BadRequest("You already like this user");

            var dislike = await _repo.GetDislike(id, recipientId);

            if (dislike != null)
            {
                await _repo.DelDislike(id, recipientId);
                //return BadRequest("Your like has been removed. You now dislike it.");
            }
            if (await _repo.GetUser(recipientId) == null)
                return NotFound();

            like = new Like
            {
                LikerId = id,
                LikeeId = recipientId
            };

            _repo.Add<Like>(like);

            if (await _repo.SaveAll())
                return Ok();

            return BadRequest("Failed to like user");
        }

        [HttpPost("{id}/block/{recipientId}")]
        public async Task<IActionResult> BlockUser(int id, int recipientId)
        {
            if (id != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();

            var block = await _repo.GetBlock(id, recipientId);

            if (block != null)
                return BadRequest("You already blocked this user");

            if (await _repo.GetUser(recipientId) == null)
                return NotFound();

            block = new Block
            {
                BlockerId = id,
                BlockeeId = recipientId
            };

            _repo.Add<Block>(block);

            if (await _repo.SaveAll())
                return Ok();

            return BadRequest("Failed to block user");
        }



        [HttpPost("{id}/dislike/{recipientId}")]
        public async Task<IActionResult> DislikeUser(int id, int recipientId)
        {
            if (id != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();

            var dislike = await _repo.GetDislike(id, recipientId);

            if (dislike != null)
                return BadRequest("You already disliked this user");

            var like = await _repo.GetLike(id, recipientId);

            if (like != null)
            {
                await _repo.DelLike(id, recipientId);
                //return BadRequest("Your like has been removed. You now dislike it.");
            }
            if (await _repo.GetUser(recipientId) == null)
                return NotFound();

            dislike = new Dislike
            {
                DislikerId = id,
                DislikeeId = recipientId
            };

            _repo.Add<Dislike>(dislike);

            if (await _repo.SaveAll())
                return Ok();

            return BadRequest("Failed to Dislike user");
        }
    }

}