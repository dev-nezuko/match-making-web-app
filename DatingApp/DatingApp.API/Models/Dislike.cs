namespace DatingApp.API.Models
{
    public class Dislike
    {
        public int DislikerId { get; set; }
        public int DislikeeId { get; set; }
        public User Disliker { get; set; }
        public User Dislikee { get; set; }
    }
}