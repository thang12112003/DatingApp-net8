using API.Data;
using API.DTOs;
using API.Entities;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace API.Controllers;

[Authorize]
public class UsersController( IUserRepository userRepository) : BaseApiController //(DataContext context la constructor 
{
    public async Task<ActionResult<IEnumerable<MemberDto>>> GetUsers()//IEnumerable so luong k dem duoc // async để đồng bộ hóa
    {
        var users = await userRepository.GetMembersAsync();
        return Ok(users);
    }
    
    [HttpGet("{username}")]
    public async Task<ActionResult<MemberDto>> GetUser(string username)
    {
        var user = await userRepository.GetMemberAsync(username);
        if (user == null) return NotFound();
        return Ok(user);
    }

}               