using System.Linq;
using API.DTOs;
using API.Entities;
using API.Extensions;
using AutoMapper;

namespace API.Helpers;

public class AutoMapperProfiles : Profile
{
    public AutoMapperProfiles()
        {
            CreateMap<AppUser, MemberDto>()//Điều này giúp AutoMapper chuyển đổi một AppUser thành MemberDto mà không cần viết thủ công.
                .ForMember(d => d.PhotoUrl, o => 
                o.MapFrom(s => s.Photos != null ? s.Photos.FirstOrDefault(x => x.IsMain)!.Url : null))
                .ForMember(dest => dest.Age, opt => opt.MapFrom(s => s.DateOfBirth.CalculateAge()));
            CreateMap<Photo, PhotoDto>();
            CreateMap<MemberUpdateDto, AppUser>();
            CreateMap<RegisterDto, AppUser>();
            CreateMap<string, DateOnly>().ConvertUsing(s => DateOnly.Parse(s));
            CreateMap<Message, MessageDto>()
                .ForMember(d => d.SenderPhotoUrl, o => 
                o.MapFrom(s => s.Sender.Photos != null ? s.Sender.Photos.FirstOrDefault(x => x.IsMain)!.Url : null))
                .ForMember(d => d.RecipientPhotoUrl, o => 
                o.MapFrom(s => s.Recipient.Photos != null ? s.Recipient.Photos.FirstOrDefault(x => x.IsMain)!.Url : null));
            CreateMap<DateTime, DateTime>().ConvertUsing(d => DateTime.SpecifyKind(d, DateTimeKind.Utc));
            CreateMap<DateTime?, DateTime?>().ConvertUsing(d => d.HasValue 
                ? DateTime.SpecifyKind(d.Value, DateTimeKind.Utc) : null);
        }
}
