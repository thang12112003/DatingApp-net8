using API.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ServiceFilter(typeof(LogUserActivity))]// cập nhật thời gian hoạt động cuối cùng của người dùng
[ApiController]
[Route("api/[controller]")]
public class BaseApiController : ControllerBase
{
}