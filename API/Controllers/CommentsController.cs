using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Authorize]
    public class CommentsController(IUnitOfWork unitOfWork, IMapper mapper) : BaseApiController
    {
        private readonly IUnitOfWork _unitOfWork = unitOfWork;
        private readonly IMapper _mapper = mapper;

        [HttpPost]
        public async Task<ActionResult<CommentDto>> CreateComment(CreateCommentDto createCommentDto)
        {
            var username = User.GetUsername();
            var user = await _unitOfWork.UserRepository.GetUserByUsernameAsync(username);

            if (user == null) return Unauthorized();

            var post = await _unitOfWork.PostRepository.GetPostById(createCommentDto.PostId);
            if (post == null) return NotFound("Post not found");

            var comment = new Comment
            {
                Content = createCommentDto.Content,
                PostId = post.Id,
                UserId = user.Id,
                Post = post,
                User = user
            };

            _unitOfWork.CommentRepository.AddComment(comment);

            if (await _unitOfWork.Complete())
            {
                var commentDto = _mapper.Map<CommentDto>(comment);
                return Ok(commentDto);
            }

            return BadRequest("Failed to add comment");
        }

        [HttpGet("post/{postId}")]
        public async Task<ActionResult<IEnumerable<CommentDto>>> GetCommentsForPost(int postId)
        {
            var comments = await _unitOfWork.CommentRepository.GetCommentsForPostAsync(postId);
            return Ok(_mapper.Map<IEnumerable<CommentDto>>(comments));
        }

        [HttpGet("{postId}/count")]
        public async Task<ActionResult<int>> GetCommentsCount(int postId)
        {
            var count = await _unitOfWork.CommentRepository.CountCommentsForPostAsync(postId);
            return Ok(count);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<CommentDto>> UpdateComment(int id, UpdateCommentDto updateCommentDto)
        {
            var username = User.GetUsername();
            var comment = await _unitOfWork.CommentRepository.GetCommentByIdAsync(id);

            if (comment == null) return NotFound("Comment not found");
            if (comment.User.UserName?.ToLower() != username.ToLower()) return Forbid("You can only edit your own comments");

            if (string.IsNullOrWhiteSpace(updateCommentDto.Content))
                return BadRequest("Comment content cannot be empty");

            comment.Content = updateCommentDto.Content;
            comment.CreatedAt = DateTime.UtcNow;

            _unitOfWork.CommentRepository.UpdateComment(comment);

            if (await _unitOfWork.Complete())
                return Ok(_mapper.Map<CommentDto>(comment));

            return BadRequest("Failed to update comment");
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteComment(int id)
        {
            var username = User.GetUsername();
            var comment = await _unitOfWork.CommentRepository.GetCommentByIdAsync(id);

            if (comment == null) return NotFound("Comment not found");
            if (comment.User.UserName?.ToLower() != username.ToLower()) return Forbid("You can only delete your own comments");

            _unitOfWork.CommentRepository.DeleteComment(comment);

            if (await _unitOfWork.Complete()) return Ok();

            return BadRequest("Failed to delete comment");
        }
    }
}