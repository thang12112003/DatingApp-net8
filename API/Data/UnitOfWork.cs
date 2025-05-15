using API.Interfaces;

namespace API.Data;

public class UnitOfWork(
    DataContext context,
    IUserRepository userRepository,
    ILikesRepository likesRepository,
    IMessageRepository messageRepository,
    IPostLikeRepository postLikeRepository,
    ICommentRepository commentRepository,
    IPostRepository postRepository) : IUnitOfWork
{
    public IUserRepository UserRepository => userRepository;

    public IMessageRepository MessageRepository => messageRepository;

    public ILikesRepository LikesRepository => likesRepository;

    public IPostRepository PostRepository => postRepository;

    public IPostLikeRepository PostLikeRepository => postLikeRepository;

    public ICommentRepository CommentRepository => commentRepository;


    

    public async Task<bool> Complete()
    {
        return await context.SaveChangesAsync() > 0;
    }

    public bool HasChanges()
    {
        return context.ChangeTracker.HasChanges();
    }
}
