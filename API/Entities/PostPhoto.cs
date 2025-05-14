using System;

namespace API.Entities;

public class PostPhoto
    {
        public int Id { get; set; }
        public string? Url { get; set; }
        public string? PublicId { get; set; } //  dùng Cloudinary
        public int PostId { get; set; }
        public required Post Post { get; set; }
    }
