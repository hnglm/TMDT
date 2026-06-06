using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using LuxeHome.Application.UseCases;

namespace LuxeHome.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImageSearchController : ControllerBase
    {
        private readonly ImageSearchUseCase _imageSearchUseCase;

        public ImageSearchController(ImageSearchUseCase imageSearchUseCase)
        {
            _imageSearchUseCase = imageSearchUseCase ?? throw new ArgumentNullException(nameof(imageSearchUseCase));
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] ImageSearchRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.ImageBase64))
            {
                return BadRequest(new { error = "Chưa cung cấp hình ảnh base64." });
            }

            try
            {
                var result = await _imageSearchUseCase.ExecuteAsync(request.ImageBase64);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }

    public class ImageSearchRequest
    {
        public string ImageBase64 { get; set; } = string.Empty;
    }
}
