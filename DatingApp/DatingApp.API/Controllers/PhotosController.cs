using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using DatingApp.API.Data;
using DatingApp.API.Dtos;
using DatingApp.API.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace DatingApp.API.Controllers
{
    [Authorize]
    [Route("users/{userId}/photos")]
    [ApiController]
    public class PhotosController : ControllerBase
    {
        private readonly IDatingRepository _repo;
        private readonly CloudinarySettings _cloudinarySettings;

        public PhotosController(IDatingRepository repo, IOptions<CloudinarySettings> cloudinaryConfig)
        {
            _repo = repo;
            _cloudinarySettings = cloudinaryConfig.Value;
        }

        // Created on demand so that reading photos works without Cloudinary.
        private Cloudinary CreateCloudinary() => new Cloudinary(new Account(
            _cloudinarySettings.CloudName, _cloudinarySettings.ApiKey, _cloudinarySettings.ApiSecret));

        private bool CloudinaryConfigured =>
            !string.IsNullOrWhiteSpace(_cloudinarySettings.CloudName)
            && !string.IsNullOrWhiteSpace(_cloudinarySettings.ApiKey)
            && !string.IsNullOrWhiteSpace(_cloudinarySettings.ApiSecret);

        private bool IsCaller(int userId) =>
            userId == int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

        [HttpGet("{id}", Name = "GetPhoto")]
        public async Task<IActionResult> GetPhoto(int id)
        {
            var photoFromRepo = await _repo.GetPhoto(id);

            if (photoFromRepo == null)
                return NotFound();

            return Ok(photoFromRepo.ToReturnDto());
        }

        [HttpPost]
        public async Task<IActionResult> AddPhotoForUser(int userId,
            [FromForm] PhotoForCreationDto photoForCreationDto)
        {
            if (!IsCaller(userId))
                return Unauthorized();

            if (!CloudinaryConfigured)
                return StatusCode(StatusCodes.Status503ServiceUnavailable,
                    "Photo uploads need Cloudinary credentials (CloudinarySettings__* environment variables).");

            var file = photoForCreationDto.File;
            if (file == null || file.Length == 0)
                return BadRequest("Choose an image to upload");

            ImageUploadResult uploadResult;
            using (var stream = file.OpenReadStream())
            {
                var uploadParams = new ImageUploadParams()
                {
                    File = new FileDescription(file.FileName, stream),
                    Transformation = new Transformation()
                        .Width(500).Height(500).Crop("fill").Gravity("face")
                };

                uploadResult = await CreateCloudinary().UploadAsync(uploadParams);
            }

            if (uploadResult.Error != null || uploadResult.SecureUrl == null)
                return BadRequest("The image could not be uploaded: " + uploadResult.Error?.Message);

            photoForCreationDto.Url = uploadResult.SecureUrl.ToString();
            photoForCreationDto.PublicId = uploadResult.PublicId;

            var userFromRepo = await _repo.GetUser(userId);
            var photo = photoForCreationDto.ToPhoto();

            if (!userFromRepo.Photos.Any(u => u.IsMain))
                photo.IsMain = true;

            userFromRepo.Photos.Add(photo);

            if (await _repo.SaveAll())
                return CreatedAtRoute("GetPhoto", new { userId, id = photo.Id }, photo.ToReturnDto());

            return BadRequest("Could not add the photo");
        }

        [HttpPost("{id}/set")]
        public async Task<IActionResult> SetMainPhoto(int userId, int id)
        {
            if (!IsCaller(userId))
                return Unauthorized();

            var user = await _repo.GetUser(userId);

            var photoFromRepo = user.Photos.FirstOrDefault(p => p.Id == id);
            if (photoFromRepo == null)
                return Unauthorized();

            if (photoFromRepo.IsMain)
                return BadRequest("This is already the main photo");

            var currentMainPhoto = await _repo.GetMainPhotoForUser(userId);
            if (currentMainPhoto != null)
                currentMainPhoto.IsMain = false;

            photoFromRepo.IsMain = true;

            if (await _repo.SaveAll())
                return NoContent();

            return BadRequest("Could not set photo to main");
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePhoto(int userId, int id)
        {
            if (!IsCaller(userId))
                return Unauthorized();

            var user = await _repo.GetUser(userId);

            var photoFromRepo = user.Photos.FirstOrDefault(p => p.Id == id);
            if (photoFromRepo == null)
                return Unauthorized();

            if (photoFromRepo.IsMain)
                return BadRequest("You cannot delete your main photo");

            if (photoFromRepo.PublicId != null)
            {
                if (!CloudinaryConfigured)
                    return StatusCode(StatusCodes.Status503ServiceUnavailable,
                        "Deleting an uploaded photo needs Cloudinary credentials.");

                var result = await CreateCloudinary().DestroyAsync(new DeletionParams(photoFromRepo.PublicId));
                if (result.Result != "ok")
                    return BadRequest("Failed to delete the photo");
            }

            _repo.Delete(photoFromRepo);

            if (await _repo.SaveAll())
                return Ok();

            return BadRequest("Failed to delete the photo");
        }
    }
}
