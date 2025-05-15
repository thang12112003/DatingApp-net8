using System;
using System.Threading.Tasks;
using API.Helpers;
using API.Interfaces;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace API.Services;

public class PhotoService : IPhotoService
{
    private readonly Cloudinary _cloudinary;

    public PhotoService(IOptions<CloudinarySettings> config)
    {
        var acc = new Account(
            config.Value.CloudName,
            config.Value.ApiKey,
            config.Value.ApiSecret
        );

        _cloudinary = new Cloudinary(acc);
    }

    public async Task<ImageUploadResult> AddPhotoAsync(IFormFile file)
    {
        var uploadResult = new ImageUploadResult();

        if (file == null || file.Length == 0)
        {
            uploadResult.Error = new Error { Message = "File is empty or null" };
            Console.WriteLine("Upload failed: File is empty or null");
            return uploadResult;
        }

        try
        {
            using var stream = file.OpenReadStream();
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Transformation = new Transformation()
                    .Height(500)
                    .Width(500)
                    .Crop("fill")
                    .Gravity("face"),
                Folder = "dating-app" // Chuẩn hóa tên thư mục (không cần chữ hoa)
            };

            uploadResult = await _cloudinary.UploadAsync(uploadParams);

            if (uploadResult.Error != null)
            {
                Console.WriteLine($"Cloudinary upload failed: {uploadResult.Error.Message}");
            }
        }
        catch (Exception ex)
        {
            uploadResult.Error = new Error { Message = $"Upload failed: {ex.Message}" };
            Console.WriteLine($"Upload exception: {ex.Message}");
        }

        return uploadResult;
    }

    public async Task<DeletionResult> DeletePhotoAsync(string publicId)
    {
        if (string.IsNullOrEmpty(publicId))
        {
            var errorResult = new DeletionResult();
            errorResult.Error = new Error { Message = "Public ID is empty" };
            Console.WriteLine("Delete failed: Public ID is empty");
            return errorResult;
        }

        try
        {
            var deleteParams = new DeletionParams(publicId);
            var result = await _cloudinary.DestroyAsync(deleteParams);

            if (result.Error != null)
            {
                Console.WriteLine($"Cloudinary delete failed: {result.Error.Message}");
            }

            return result;
        }
        catch (Exception ex)
        {
            var errorResult = new DeletionResult();
            errorResult.Error = new Error { Message = $"Delete failed: {ex.Message}" };
            Console.WriteLine($"Delete exception: {ex.Message}");
            return errorResult;
        }
    }
}