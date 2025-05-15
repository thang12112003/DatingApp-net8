using System;

namespace API.DTOs;

    public class PostPhotoDto
    {
        public int Id { get; set; }
        public string? Url { get; set; }
        public string? PublicId { get; set; }
    }
