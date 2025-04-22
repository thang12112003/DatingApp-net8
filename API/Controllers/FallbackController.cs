using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class FallbackController : Controller// xử lý tất cả các route không thuộc về API và trả về file index.html của Angular
{
    public ActionResult Index()
    {
        return PhysicalFile(Path.Combine(Directory.GetCurrentDirectory(),
            "wwwroot", "index.html"), "text/HTML");
    }
}