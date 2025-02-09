using API.Data;
using API.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace API;
[ApiController]
[Route("api/[controller]")] // /api/users
public class UsersController(DataContext context) : ControllerBase //(DataContext context la constructor 
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AppUser>>> GetUsers()//IEnumerable so luong k dem duoc // async để đồng bộ hóa
    {
        var users = await context.Users .ToListAsync();
        return users;
    }
    [HttpGet("{id:int}")]  // /api/users/2
    public async Task<ActionResult<AppUser>> GetUser(int id)
    {
        var user = await context.Users.FindAsync(id);
        if (user == null) return NotFound();
        return user;
    }
}