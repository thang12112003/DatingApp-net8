using API.Entities;
using System.Threading.Tasks;

namespace API.Interfaces
{
    public interface IPostLikeRepository
    {
        Task<PostLike?> GetPostLike(int postId, int userId);
        void AddLike(PostLike like);
        void RemoveLike(PostLike like);
        Task<int> CountLikesForPost(int postId);
        Task<bool> IsPostLikedByUser(int postId, int userId);
    }
}
