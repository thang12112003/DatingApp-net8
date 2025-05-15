using API.Data;
using API.Entities;
using API.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Data.Repositories
{
    public class PostRepository(DataContext context) : IPostRepository
    {
        private readonly DataContext _context = context;

        public void AddPost(Post post)
        {
            _context.Posts.Add(post);
        }

        public void UpdatePost(Post post)
        {
            _context.Posts.Update(post);
        }

        public void DeletePost(Post post)
        {
            _context.Posts.Remove(post);
        }

        public async Task<IEnumerable<Post>> GetPostsWithUsers()
        {
            return await _context.Posts
                .Include(p => p.User)
                .ThenInclude(u => u.Photos)
                .Include(p => p.Photos)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<Post?> GetPostById(int id)
        {
            return await _context.Posts
                .Include(p => p.User)
                .ThenInclude(u => u.Photos)
                .Include(p => p.Photos)
                .FirstOrDefaultAsync(p => p.Id == id);
        }
        public async Task<IEnumerable<Post>> GetPostsByUserId(int userId)
        {
            return await _context.Posts
                .Where(p => p.UserId == userId)
                .Include(p => p.Photos)
                .Include(p => p.User)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }
    }
}
