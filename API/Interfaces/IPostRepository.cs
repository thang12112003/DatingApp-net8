using API.Entities;

namespace API.Interfaces
{
    public interface IPostRepository
    {
        void AddPost(Post post);
        void UpdatePost(Post post);
        void DeletePost(Post post);
        Task<Post?> GetPostById(int id);
        Task<IEnumerable<Post>> GetPostsWithUsers();
    }
}
