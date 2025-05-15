using System.ComponentModel.DataAnnotations.Schema;

namespace API.Entities
{
    [Table("Photos")]
    public class Photo
    {
        public int Id { get; set; }
        public required string Url { get; set; }
        public bool IsMain { get; set; }
        public string? PublicId { get; set; }
        public AppUser AppUser { get; set; } = null!;//Liên kết này tạo ra quan hệ "1-N" 
        public int AppUserId { get; set; }// khóa ngoại trỏ đến Id của User.
    }
}
