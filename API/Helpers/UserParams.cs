namespace API.Helpers
 {
     public class UserParams : PaginationParams//Lưu trữ các tham số tìm kiếm và phân trang cho danh sách người dùng members
     {

         public string? CurrentUsername { get; set; }
         public string? Gender { get; set; }
         public int MinAge { get; set; } = 18;
         public int MaxAge { get; set; } = 150;
         public string OrderBy { get; set; } = "lastActive";
        public string? Search { get; set; }

     }
 }