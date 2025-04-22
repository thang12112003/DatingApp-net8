using API.Controllers;
using API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API;

public class AdminController : BaseApiController
{
    private readonly UserManager<AppUser> _userManager;

    public AdminController(UserManager<AppUser> userManager)
    {
        _userManager = userManager;
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpGet("users-with-roles")]
    public async Task<ActionResult<IEnumerable<AdminUserDto>>> GetUsersWithRoles()
    {
        var users = await _userManager.Users
            .OrderBy(x => x.UserName)
            .Select(x => new AdminUserDto
            {
                Id = x.Id,
                Username = x.UserName ?? string.Empty,
                Roles = x.UserRoles.Select(r => r.Role.Name ?? string.Empty).ToList(),
                LockoutEnd = x.LockoutEnd // Thêm LockoutEnd
            })
            .ToListAsync();

        return Ok(users);
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpPost("edit-roles/{username}")]
    public async Task<ActionResult> EditRoles(string username, string roles)
    {
        if (string.IsNullOrEmpty(roles)) return BadRequest("You must select at least one role");

        var selectedRoles = roles.Split(",").ToArray();

        var user = await _userManager.FindByNameAsync(username);
        if (user == null) return BadRequest("User not found");

        var userRoles = await _userManager.GetRolesAsync(user);

        var result = await _userManager.AddToRolesAsync(user, selectedRoles.Except(userRoles));
        if (!result.Succeeded) return BadRequest("Failed to add to roles");

        result = await _userManager.RemoveFromRolesAsync(user, userRoles.Except(selectedRoles));
        if (!result.Succeeded) return BadRequest("Failed to remove from roles");

        return Ok(await _userManager.GetRolesAsync(user));
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpPost("lock-user/{username}")]
    public async Task<ActionResult> LockUser(string username)
    {
        var user = await _userManager.FindByNameAsync(username);
        if (user == null) return NotFound("User not found");

        var lockoutEndDate = DateTimeOffset.UtcNow.AddYears(100);

        var result = await _userManager.SetLockoutEnabledAsync(user, true);
        if (!result.Succeeded) return BadRequest("Failed to enable lockout");

        result = await _userManager.SetLockoutEndDateAsync(user, lockoutEndDate);
        if (!result.Succeeded) return BadRequest("Failed to lock user");

        return Ok("User has been locked");
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpPost("unlock-user/{username}")]
    public async Task<ActionResult> UnlockUser(string username)
    {
        var user = await _userManager.FindByNameAsync(username);
        if (user == null) return NotFound("User not found");

        var result = await _userManager.SetLockoutEndDateAsync(user, null);
        if (!result.Succeeded) return BadRequest("Failed to unlock user");

        return Ok("User has been unlocked");
    }

    [Authorize(Policy = "ModeratePhotoRole")]
    [HttpGet("photos-to-moderate")]
    public ActionResult GetPhotosForModeration()
    {
        return Ok("Admins or moderators can see this");
    }
}