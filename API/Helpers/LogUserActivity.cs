using System;
 using System.Threading.Tasks;
 using API.Extensions;
 using API.Interfaces;
 using Microsoft.AspNetCore.Mvc.Filters;
 using Microsoft.Extensions.DependencyInjection;
 
 namespace API.Helpers
 {
     public class LogUserActivity : IAsyncActionFilter
     {
         public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
         {
             var resultContext = await next();
 
             if (context.HttpContext.User.Identity == null || !context.HttpContext.User.Identity.IsAuthenticated) return;

             var userId = resultContext.HttpContext.User.GetUserId();
             var unitOfWork = resultContext.HttpContext.RequestServices.GetRequiredService<IUnitOfWork>();
             var user = await unitOfWork.UserRepository.GetUserByIdAsync(userId);
            if(user == null) return;
             user.LastActive = DateTime.UtcNow;
             await unitOfWork.Complete();
         }
     }
 }