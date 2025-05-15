namespace API.DTOs
{
public class PostDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string Username { get; set; } = string.Empty;
     public string UserPhotoUrl { get; set; } = string.Empty;
    public List<PostPhotoDto>? Photos { get; set; }
}

}
