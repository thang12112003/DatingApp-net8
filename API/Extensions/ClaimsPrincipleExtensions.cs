using System;
using System.Security.Claims;

namespace API.Extensions;

public static class ClaimsPrincipleExtensions
{
        public static string GetUsername(this ClaimsPrincipal user)
        {
            var username = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new Exception("Cannot get username from token");
            return username;
        }
}
