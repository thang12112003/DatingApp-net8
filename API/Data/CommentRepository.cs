using API.Data;
using API.Entities;
using API.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Repository
{
    public class CommentRepository(DataContext context) : ICommentRepository
    {
        private readonly DataContext _context = context;

        public void AddComment(Comment comment)
        {
            _context.Comments.Add(comment);
        }

        public void DeleteComment(Comment comment)
        {
            _context.Comments.Remove(comment);
        }

        public async Task<Comment?> GetCommentByIdAsync(int id)
        {
            return await _context.Comments
                .Include(c => c.User).ThenInclude(u => u.Photos) // 🔥 Quan trọng
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<IEnumerable<Comment>> GetCommentsForPostAsync(int postId)
        {
            return await _context.Comments
                .Where(c => c.PostId == postId)
                .Include(c => c.User).ThenInclude(u => u.Photos) // 🔥 Quan trọng
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Comment>> GetCommentsByUserIdAsync(int userId)
        {
            return await _context.Comments
                .Include(c => c.Post)
                .Where(c => c.UserId == userId)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }
        public async Task<int> CountCommentsForPostAsync(int postId)
        {
            return await _context.Comments
                .Where(c => c.PostId == postId)
                .CountAsync();
        }

        public void UpdateComment(Comment comment)
        {
            _context.Entry(comment).State = EntityState.Modified;
        }
    }
}
