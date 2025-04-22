namespace API;

public class AdminUserDto
{
    public int Id { get; set; }
    public string? Username { get; set; }
    public List<string>? Roles { get; set; }
    public DateTimeOffset? LockoutEnd { get; set; } // Thêm LockoutEnd
}