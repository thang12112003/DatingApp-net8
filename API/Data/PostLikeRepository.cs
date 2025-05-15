using API.Data;
using API.Entities;
using API.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace API.Repositories
{
    public class PostLikeRepository : IPostLikeRepository
    {
        private readonly DataContext _context;

        public PostLikeRepository(DataContext context)
        {
            _context = context;
        }

        public async Task<PostLike?> GetPostLike(int postId, int userId)
        {
            return await _context.PostLikes
                .FirstOrDefaultAsync(pl => pl.PostId == postId && pl.UserId == userId);
        }

        public void AddLike(PostLike like)
        {
            _context.PostLikes.Add(like);
        }

        public void RemoveLike(PostLike like)
        {
            _context.PostLikes.Remove(like);
        }

        public async Task<int> CountLikesForPost(int postId)
        {
            return await _context.PostLikes.CountAsync(pl => pl.PostId == postId);
        }

        public async Task<bool> IsPostLikedByUser(int postId, int userId)
        {
            return await _context.PostLikes.AnyAsync(pl => pl.PostId == postId && pl.UserId == userId);
        }
    }
}
