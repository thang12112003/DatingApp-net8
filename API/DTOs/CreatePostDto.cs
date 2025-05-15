namespace API.DTOs
{
    public class CreatePostDto
    {
        public string Content { get; set; } = string.Empty;
            public List<IFormFile>? Photos { get; set; }  // Đổi sang danh sách ảnh

    }
}
