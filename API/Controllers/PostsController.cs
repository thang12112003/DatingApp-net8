using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.Controllers
{
    [Authorize]
    public class PostsController : BaseApiController
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IPhotoService _photoService;
        private const int MaxPhotosPerPost = 10;

        public PostsController(IUnitOfWork unitOfWork, IMapper mapper, IPhotoService photoService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _photoService = photoService;
        }

        [HttpPost]
        public async Task<ActionResult<PostDto>> CreatePost([FromForm] string content, [FromForm] List<IFormFile>? files)
        {
            var username = User.GetUsername();
            var user = await _unitOfWork.UserRepository.GetUserByUsernameAsync(username);

            if (user == null) return Unauthorized("User not found");

            var post = new Post
            {
                Content = content,
                CreatedAt = DateTime.UtcNow,
                UserId = user.Id,
                User = user,
                Photos = new List<PostPhoto>()
            };

            // Xử lý tải lên nhiều ảnh
            if (files != null && files.Count > 0)
            {
                if (files.Count > MaxPhotosPerPost)
                    return BadRequest($"Cannot upload more than {MaxPhotosPerPost} photos.");

                foreach (var file in files)
                {
                    var uploadResult = await _photoService.AddPhotoAsync(file);
                    if (uploadResult.Error != null)
                    {
                        Console.WriteLine($"Upload failed for file {file.FileName}: {uploadResult.Error.Message}");
                        return BadRequest($"Failed to upload file {file.FileName}: {uploadResult.Error.Message}");
                    }

                    post.Photos.Add(new PostPhoto
                    {
                        Url = uploadResult.SecureUrl.AbsoluteUri,
                        PublicId = uploadResult.PublicId,
                        Post = post
                    });
                }
            }

            _unitOfWork.PostRepository.AddPost(post);

            if (await _unitOfWork.Complete())
                return Ok(_mapper.Map<PostDto>(post));

            return BadRequest("Failed to create post");
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PostDto>>> GetPosts()
        {
            var posts = await _unitOfWork.PostRepository.GetPostsWithUsers();
            return Ok(_mapper.Map<IEnumerable<PostDto>>(posts));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PostDto>> GetPost(int id)
        {
            var post = await _unitOfWork.PostRepository.GetPostById(id);
            if (post == null) return NotFound();

            return Ok(_mapper.Map<PostDto>(post));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> UpdatePost(int id, [FromForm] string content, [FromForm] List<IFormFile>? newFiles, [FromForm] string? deletePhotoPublicIds)
        {
            var username = User.GetUsername();
            var post = await _unitOfWork.PostRepository.GetPostById(id);

            if (post == null) return NotFound("Post not found");
            if (post.User.UserName != username) return Forbid("You can only edit your own posts");

            // Cập nhật nội dung
            post.Content = content;
            post.CreatedAt = DateTime.UtcNow;

            // Khởi tạo Photos nếu null
            post.Photos ??= new List<PostPhoto>();

            // Xóa ảnh nếu có publicId
            if (!string.IsNullOrEmpty(deletePhotoPublicIds))
            {
                var publicIds = deletePhotoPublicIds.Split(',', StringSplitOptions.RemoveEmptyEntries);
                foreach (var publicId in publicIds)
                {
                    var photo = post.Photos.FirstOrDefault(p => p.PublicId == publicId);
                    if (photo != null)
                    {
                        var result = await _photoService.DeletePhotoAsync(publicId);
                        if (result.Error != null)
                        {
                            Console.WriteLine($"Delete failed for publicId {publicId}: {result.Error.Message}");
                            return BadRequest($"Failed to delete photo with publicId {publicId}: {result.Error.Message}");
                        }

                        post.Photos.Remove(photo);
                        Console.WriteLine($"Deleted photo with publicId {publicId}");
                    }
                    else
                    {
                        Console.WriteLine($"Photo with publicId {publicId} not found");
                    }
                }
            }

            // Thêm ảnh mới nếu có
            if (newFiles != null && newFiles.Count > 0)
            {
                if (post.Photos.Count + newFiles.Count > MaxPhotosPerPost)
                    return BadRequest($"Total photos cannot exceed {MaxPhotosPerPost}.");

                foreach (var file in newFiles)
                {
                    var uploadResult = await _photoService.AddPhotoAsync(file);
                    if (uploadResult.Error != null)
                    {
                        Console.WriteLine($"Upload failed for file {file.FileName}: {uploadResult.Error.Message}");
                        return BadRequest($"Failed to upload file {file.FileName}: {uploadResult.Error.Message}");
                    }

                    post.Photos.Add(new PostPhoto
                    {
                        Url = uploadResult.SecureUrl.AbsoluteUri,
                        PublicId = uploadResult.PublicId,
                        Post = post
                    });
                    Console.WriteLine($"Uploaded new photo: {uploadResult.SecureUrl.AbsoluteUri}");
                }
            }

            _unitOfWork.PostRepository.UpdatePost(post);

            if (await _unitOfWork.Complete())
                return Ok(_mapper.Map<PostDto>(post));

            return BadRequest("Failed to update post");
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeletePost(int id)
        {
            var username = User.GetUsername();
            var post = await _unitOfWork.PostRepository.GetPostById(id);

            if (post == null) return NotFound("Post not found");
            if (post.User.UserName != username) return Forbid("You can only delete your own posts");

            _unitOfWork.PostRepository.DeletePost(post);

            if (await _unitOfWork.Complete()) return Ok();

            return BadRequest("Failed to delete post");
        }
    }
}