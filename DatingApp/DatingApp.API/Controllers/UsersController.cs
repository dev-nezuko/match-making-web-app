using System;
using System.Linq;
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
    [ApiController]
    [Route("[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IDatingRepository _repo;

        public UsersController(IDatingRepository repo)
        {
            _repo = repo;
        }

        private int CallerId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

        [HttpGet]
        public async Task<IActionResult> GetUsers([FromQuery] UserParams userParams)
        {
            var userFromRepo = await _repo.GetUser(CallerId);
            if (userFromRepo == null)
                return Unauthorized();

            userParams.UserId = CallerId;

            if (string.IsNullOrEmpty(userParams.Gender))
                userParams.Gender = userFromRepo.Gender == "male" ? "female" : "male";

            var users = await _repo.GetUsers(userParams);

            Response.AddPagination(users.CurrentPage, users.PageSize,
                users.TotalCount, users.TotalPages);

            return Ok(users.Select(u => u.ToListDto()).ToList());
        }

        [HttpGet("{id}", Name = "GetUser")]
        public async Task<IActionResult> GetUser(int id)
        {
            var user = await _repo.GetUser(id);

            if (user == null)
                return NotFound();

            return Ok(user.ToDetailedDto());
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, UserForUpdateDto userForUpdateDto)
        {
            if (id != CallerId)
                return Unauthorized();

            var userFromRepo = await _repo.GetUser(id);

            userForUpdateDto.ApplyTo(userFromRepo);

            if (await _repo.SaveAll())
                return NoContent();

            throw new Exception($"Updating user {id} failed on save");
        }

        [HttpPost("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            if (id != CallerId)
                return Unauthorized();

            var user = await _repo.GetUser(id);
            if (user == null)
                return NotFound();

            // Likes, blocks and messages reference the user with Restrict
            // foreign keys, so deleting the row alone always failed.
            await _repo.DeleteUserWithRelations(user);

            if (await _repo.SaveAll())
                return Ok();

            return BadRequest("Failed to delete user");
        }

        [HttpPost("{id}/unblock/{recipientId}")]
        public async Task<IActionResult> UnblockUser(int id, int recipientId)
        {
            if (id != CallerId)
                return Unauthorized();

            var block = await _repo.GetBlock(id, recipientId);

            if (block == null)
                return BadRequest("You have not blocked this user");

            _repo.Delete(block);

            if (await _repo.SaveAll())
                return Ok();

            return BadRequest("Failed to unblock user");
        }

        [HttpPost("{id}/like/{recipientId}")]
        public async Task<IActionResult> LikeUser(int id, int recipientId)
        {
            if (id != CallerId)
                return Unauthorized();

            if (id == recipientId)
                return BadRequest("You cannot like yourself");

            if (await _repo.GetLike(id, recipientId) != null)
                return BadRequest("You already like this user");

            if (await _repo.GetUser(recipientId) == null)
                return NotFound();

            var dislike = await _repo.GetDislike(id, recipientId);
            if (dislike != null)
                _repo.Delete(dislike);

            _repo.Add(new Like { LikerId = id, LikeeId = recipientId });

            if (await _repo.SaveAll())
                return Ok();

            return BadRequest("Failed to like user");
        }

        [HttpPost("{id}/dislike/{recipientId}")]
        public async Task<IActionResult> DislikeUser(int id, int recipientId)
        {
            if (id != CallerId)
                return Unauthorized();

            if (id == recipientId)
                return BadRequest("You cannot dislike yourself");

            if (await _repo.GetDislike(id, recipientId) != null)
                return BadRequest("You already disliked this user");

            if (await _repo.GetUser(recipientId) == null)
                return NotFound();

            var like = await _repo.GetLike(id, recipientId);
            if (like != null)
                _repo.Delete(like);

            _repo.Add(new Dislike { DislikerId = id, DislikeeId = recipientId });

            if (await _repo.SaveAll())
                return Ok();

            return BadRequest("Failed to dislike user");
        }

        [HttpPost("{id}/block/{recipientId}")]
        public async Task<IActionResult> BlockUser(int id, int recipientId)
        {
            if (id != CallerId)
                return Unauthorized();

            if (id == recipientId)
                return BadRequest("You cannot block yourself");

            if (await _repo.GetBlock(id, recipientId) != null)
                return BadRequest("You already blocked this user");

            if (await _repo.GetUser(recipientId) == null)
                return NotFound();

            _repo.Add(new Block { BlockerId = id, BlockeeId = recipientId });

            if (await _repo.SaveAll())
                return Ok();

            return BadRequest("Failed to block user");
        }
    }
}
