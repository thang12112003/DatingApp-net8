using API.Entities;
using API.Extensions;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace API.Controllers
{
    [Authorize]
    public class PostLikesController : BaseApiController
    {
        private readonly IUnitOfWork _unitOfWork;

        public PostLikesController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpPost("{postId}")]
        public async Task<ActionResult> ToggleLike(int postId)
        {
            var userId = User.GetUserId();

            var post = await _unitOfWork.PostRepository.GetPostById(postId);
            if (post == null) return NotFound("Post not found");

            var like = await _unitOfWork.PostLikeRepository.GetPostLike(postId, userId);

            if (like != null)
            {
                _unitOfWork.PostLikeRepository.RemoveLike(like);
            }
            else
            {
                var newLike = new PostLike
                {
                    PostId = postId,
                    UserId = userId,
                    Post = post,
                    User = await _unitOfWork.UserRepository.GetUserByIdAsync(userId)
                };

                _unitOfWork.PostLikeRepository.AddLike(newLike);
            }

            if (await _unitOfWork.Complete()) return Ok();

            return BadRequest("Failed to toggle like");
        }

        [HttpGet("{postId}/count")]
        public async Task<ActionResult<int>> GetLikeCount(int postId)
        {
            var count = await _unitOfWork.PostLikeRepository.CountLikesForPost(postId);
            return Ok(count);
        }

        [HttpGet("{postId}/is-liked")]
        public async Task<ActionResult<bool>> IsLiked(int postId)
        {
            var userId = User.GetUserId();
            var isLiked = await _unitOfWork.PostLikeRepository.IsPostLikedByUser(postId, userId);
            return Ok(isLiked);
        }
    }
}
