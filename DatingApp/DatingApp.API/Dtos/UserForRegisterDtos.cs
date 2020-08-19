using System;
using System.ComponentModel.DataAnnotations;

namespace DatingApp.API.Dtos
{
    public class UserForRegisterDtos
    {
        [Required]
        public string Username { get; set; }

        [Required]
        // Hashed to a fixed 64 bytes, so the upper bound only limits request size.
        [StringLength(128, MinimumLength = 8, ErrorMessage = "Your password must be at least 8 characters")]
        public string Password { get; set; }

        [Required]
        public string Gender { get; set; }

        [Required]
        public string KnownAs { get; set; }

        [Required]
        public DateTime DateOfBirth { get; set; }

        [Required]
        public string City { get; set; }

        [Required]
        public string Country { get; set; }
        public DateTime Created { get; set; }
        public DateTime LastActive { get; set; }

        public UserForRegisterDtos()
        {
            Created = DateTime.Now;
            LastActive = DateTime.Now;
        }
    }
}