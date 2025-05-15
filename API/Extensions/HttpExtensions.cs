using System.Text.Json;
 using API.Helpers;
 using Microsoft.AspNetCore.Http;
 
 namespace API.Extensions
 {
     public static class HttpExtensions//Thêm header phân trang vào HTTP response để client biết tổng số trang, số item, v.v.
     {
         public static void AddPaginationHeader<T>(this HttpResponse response, PagedList<T> data)
         {
             var paginationHeader = new PaginationHeader(data.CurrentPage, data.PageSize, data.TotalCount, data.TotalPages);
             
             var jsonOptions = new JsonSerializerOptions
             {
                 PropertyNamingPolicy = JsonNamingPolicy.CamelCase
             };
             
             response.Headers.Append("Pagination", JsonSerializer.Serialize(paginationHeader, jsonOptions));
             response.Headers.Append("Access-Control-Expose-Headers", "Pagination");
         }
     }
 }