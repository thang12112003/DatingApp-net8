using System;

namespace API.Entities;

public class Post
{
    public int Id { get; set; }
    public string? Content { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int UserId { get; set; }
    public required AppUser User { get; set; }

    public ICollection<PostPhoto> Photos { get; set; } = new List<PostPhoto>();
    public ICollection<PostLike> Likes { get; set; } = new List<PostLike>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}

