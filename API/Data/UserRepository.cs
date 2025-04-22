using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.DTOs;
using API.Entities;
using API.Helpers;
using API.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace API.Data
{
    public class UserRepository : IUserRepository
    {
        private readonly DataContext _context;
        private readonly IMapper _mapper;

        public UserRepository(DataContext context, IMapper mapper)
        {
            _mapper = mapper;
            _context = context;
        }

        public async Task<MemberDto?> GetMemberAsync(string username)
        {
            return await _context.Users
                .Where(x => x.UserName == username)
                .ProjectTo<MemberDto>(_mapper.ConfigurationProvider)
                .SingleOrDefaultAsync();
        }

        public async Task<PagedList<MemberDto>> GetMembersAsync(UserParams userParams)
        {
            var query = _context.Users.AsQueryable();

            // ❌ Loại bản thân người dùng ra khỏi kết quả
            query = query.Where(u => u.UserName != userParams.CurrentUsername);

            // 🔍 Lọc theo giới tính nếu có
            if (!string.IsNullOrEmpty(userParams.Gender))
            {
                query = query.Where(u => u.Gender == userParams.Gender);
            }

            // 🔢 Lọc theo độ tuổi
            var minDob = DateTime.Today.AddYears(-userParams.MaxAge - 1);
            var maxDob = DateTime.Today.AddYears(-userParams.MinAge);

            query = query.Where(u => u.DateOfBirth >= minDob && u.DateOfBirth <= maxDob);

            // 🔍 Lọc theo từ khóa tìm kiếm (KnownAs)
            if (!string.IsNullOrEmpty(userParams.Search))
            {
                var keyword = userParams.Search.ToLower();
                query = query.Where(u => u.KnownAs.ToLower().StartsWith(keyword));
            }

            // 📅 Sắp xếp theo orderBy
            query = userParams.OrderBy switch
            {
                "created" => query.OrderByDescending(u => u.Created),
                _ => query.OrderByDescending(u => u.LastActive)
            };

            // 🌐 Ánh xạ sang DTO và phân trang
            return await PagedList<MemberDto>.CreateAsync(
                query.ProjectTo<MemberDto>(_mapper.ConfigurationProvider).AsNoTracking(),
                userParams.PageNumber,
                userParams.PageSize
            );
        }


        public async Task<AppUser> GetUserByIdAsync(int id)
        {
            return await _context.Users.FindAsync(id) ?? throw new InvalidOperationException("User not found");
        }

            public async Task<AppUser> GetUserByUsernameAsync(string username)
            {
                if (string.IsNullOrEmpty(username))
                {
                    throw new ArgumentException("Username cannot be null or empty", nameof(username));
                }

                return await _context.Users
                    .Include(u => u.Photos)  // Đảm bảo load luôn danh sách ảnh
                    .FirstOrDefaultAsync(u => u.UserName!.ToLower() == username.ToLower()) 
                    ?? throw new InvalidOperationException("User not found");
            }


        public async Task<IEnumerable<AppUser>> GetUsersAsync()
        {
            return await _context.Users
                .Include(p => p.Photos)
                .ToListAsync();
        }

        public void Update(AppUser user)
        {
            _context.Entry(user).State = EntityState.Modified;
        }
    }
}