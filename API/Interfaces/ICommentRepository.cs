using API.Entities;

namespace API.Interfaces
{
    public interface ICommentRepository
    {
        void AddComment(Comment comment);
        void DeleteComment(Comment comment);
        Task<Comment?> GetCommentByIdAsync(int id);
        Task<IEnumerable<Comment>> GetCommentsForPostAsync(int postId);
        Task<IEnumerable<Comment>> GetCommentsByUserIdAsync(int userId);
        Task<int> CountCommentsForPostAsync(int postId);

        void UpdateComment(Comment comment);
    }
}
