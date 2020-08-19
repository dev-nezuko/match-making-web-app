using System;
using System.ComponentModel.DataAnnotations;

namespace DatingApp.API.Dtos
{
    public class UserForRegisterDtos
    {
        [Required]
        public string Username { get; set; }

        [Required]
        // Was StringLength(8, MinimumLength = 4). The password is hashed with
        // HMACSHA512 into a fixed 64 bytes, so nothing downstream cared how long
        // it was -- the cap only removed entropy. A 4-character minimum on a
        // dating account is worse still.
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