using System;

namespace API.Entities;

public class PostLike
    {
    public int PostId { get; set; }
    public required Post Post { get; set; }

    public int UserId { get; set; }
    public required AppUser User { get; set; }
    }
