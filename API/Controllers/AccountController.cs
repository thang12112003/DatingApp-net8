using System.Security.Cryptography;
using System.Text;
using API.Data;
using API.DTOs;
using API.Entities;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace API.Controllers;
public class AccountController(UserManager<AppUser> userManager, ITokenService tokenService , IMapper mapper) : BaseApiController
{
    [HttpPost("register")] // account/register
    public async Task<ActionResult<UserDto>> Register(RegisterDto registerDto)
    {
         if (await UserExists(registerDto.Username)) return BadRequest("Username is taken");
        if (!string.IsNullOrEmpty(registerDto.KnownAs) && await UserExists(registerDto.KnownAs)) 
            return BadRequest("Known As is taken");

         var user = mapper.Map<AppUser>(registerDto);

         user.UserName = registerDto.Username.ToLower();

        var result = await userManager.CreateAsync(user, registerDto.Password);
        if (!result.Succeeded) return BadRequest(result.Errors);

        // Gán role mặc định là "Member"
        var roleResult = await userManager.AddToRoleAsync(user, "Member");
        if (!roleResult.Succeeded) return BadRequest(roleResult.Errors);

        if (!result.Succeeded) return BadRequest(result.Errors);

         return new UserDto
         {
             Username = user.UserName,
             Token = await tokenService.CreateToken(user),
             KnownAs = user.KnownAs,
             Gender = user.Gender
         };
    }
    [HttpPost("login")]
    public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
    {
        var user = await userManager.Users
            .Include(p => p.Photos)
            .FirstOrDefaultAsync(x => 
                x.NormalizedUserName == loginDto.Username.ToUpper());

        if (user == null || user.UserName == null) return Unauthorized("Invalid username");
        if (user.LockoutEnd != null && user.LockoutEnd > DateTimeOffset.UtcNow)
        {
            return Unauthorized("This account is locked.");
        }
        if (await userManager.IsLockedOutAsync(user))
        {
            return Unauthorized("This account has been locked. Please contact support.");
        }

        return new UserDto
        {
            Username = user.UserName,
            KnownAs = user.KnownAs,
            Token = await tokenService.CreateToken(user),
            Gender = user.Gender,
            PhotoUrl = user?.Photos?.FirstOrDefault(x => x.IsMain)?.Url
        };
    }
    private async Task<bool> UserExists(string username) //so sánh tên giống nhau không
    {
        return await userManager.Users.AnyAsync(x => x.NormalizedUserName == username.ToUpper()); // Bob != bob
    }
}