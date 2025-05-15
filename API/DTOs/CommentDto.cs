using System;

namespace API.DTOs;

public class CommentDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int PostId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string UserPhotoUrl { get; set; } = string.Empty;
}
