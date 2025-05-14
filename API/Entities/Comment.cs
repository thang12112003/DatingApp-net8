using System;

namespace API.Entities;

public class Comment
    {
        public int Id { get; set; }
        public string? Content { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int PostId { get; set; }
        public required Post Post { get; set; }
        public required AppUser User { get; set; }
        public int UserId { get; set; }
    }
