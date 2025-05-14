namespace API.DTOs
{
    public class UpdatePostDto
    {
        public string Content { get; set; } = string.Empty;
         public List<string>? DeletePhotoPublicIds { get; set; }
    }
}
