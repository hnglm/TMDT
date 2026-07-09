using LuxeHome.Application.DTOs;
using LuxeHome.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LuxeHome.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly OrderService _orderService;
        private readonly IWebHostEnvironment _env;

        public OrdersController(OrderService orderService, IWebHostEnvironment env)
        {
            _orderService = orderService;
            _env = env;
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto dto)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized(new { message = "Bạn cần đăng nhập để đặt hàng." });

                long userId = long.Parse(userIdClaim);

                string orderCode = "LH" 
                    + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                    + Random.Shared.Next(100, 999);

                var order = await _orderService.CreateOrderAsync(dto, userId, orderCode);

                return Ok(new
                {
                    orderId = order.OrderCode,
                    id = order.Id,
                    totalAmount = order.FinalAmount,
                    itemCount = order.OrderItems.Count
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("CREATE ORDER ERROR: " + ex);
                return BadRequest(new
                {
                    message = ex.Message,
                    detail = ex.InnerException?.Message
                });
            }
        }

        [HttpGet("my-orders")]
        [Authorize]
        public async Task<IActionResult> GetMyOrders()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { message = "Bạn cần đăng nhập để xem đơn hàng." });

            long userId = long.Parse(userIdClaim);

            var orders = await _orderService.GetMyOrdersAsync(userId);

            return Ok(orders);
        }
        [HttpPost("{id}/cancel")]
[Authorize]
public async Task<IActionResult> CancelOrder(string id, [FromBody] CancelOrderDto dto)
{
    try
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

        long userId = long.Parse(userIdClaim);
        
        // Gọi service để xử lý hủy (bạn cần viết hàm CancelOrderAsync trong OrderService)
        await _orderService.CancelOrderAsync(id, userId, dto.Reason);
        
        return Ok(new { message = "Đã hủy đơn thành công" });
    }
    catch (Exception ex)
    {
        return BadRequest(new { message = ex.Message });
    }
}
[HttpPost("{id}/return")]
[Authorize]
public async Task<IActionResult> RequestReturn(string id, [FromBody] ReturnWarrantyDto dto)
{
    try
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

        await _orderService.CreateReturnRequestAsync(id, long.Parse(userIdClaim), dto);
        
        return Ok(new { message = "Yêu cầu hoàn hàng đã được ghi nhận." });
    }
    catch (Exception ex)
    {
        Console.WriteLine("RETURN REQUEST ERROR: " + ex);

        return BadRequest(new
        {
            message = ex.Message,
            detail = ex.InnerException?.Message
        });
    }
}
[HttpPost("{id}/review")]
[Authorize]
public async Task<IActionResult> AddReview(
    string id,
    [FromForm] AddReviewDto dto,
    [FromForm] IFormFile? image)
{
    try
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

        dto.ImageUrl = await SaveReviewImageAsync(image);

        await _orderService.AddReviewAsync(id, long.Parse(userIdClaim), dto);

        return Ok(new { message = "Đã gửi đánh giá thành công." });
    }
    catch (Exception ex)
    {
        Console.WriteLine("ADD REVIEW ERROR: " + ex);

        return BadRequest(new
        {
            message = ex.Message,
            detail = ex.InnerException?.Message
        });
    }
}
[HttpGet("{id}/review")]
[Authorize]
public async Task<IActionResult> GetMyReview(string id)
{
    try
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

        var review = await _orderService.GetMyReviewAsync(id, long.Parse(userIdClaim));

        return Ok(review);
    }
    catch (Exception ex)
    {
        return BadRequest(new { message = ex.Message });
    }
}

[HttpPut("{id}/review")]
[Authorize]
public async Task<IActionResult> UpdateReview(
    string id,
    [FromForm] AddReviewDto dto,
    [FromForm] IFormFile? image)
{
    try
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

        var imageUrl = await SaveReviewImageAsync(image);

        if (!string.IsNullOrWhiteSpace(imageUrl))
        {
            dto.ImageUrl = imageUrl;
        }

        await _orderService.UpdateReviewAsync(id, long.Parse(userIdClaim), dto);

        return Ok(new { message = "Đã cập nhật đánh giá thành công." });
    }
    catch (Exception ex)
    {
        Console.WriteLine("UPDATE REVIEW ERROR: " + ex);

        return BadRequest(new
        {
            message = ex.Message,
            detail = ex.InnerException?.Message
        });
    }
}
private async Task<string?> SaveReviewImageAsync(IFormFile? image)
{
    if (image == null || image.Length == 0)
        return null;

    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
    var ext = Path.GetExtension(image.FileName).ToLowerInvariant();

    if (!allowedExtensions.Contains(ext))
        throw new Exception("Chỉ hỗ trợ ảnh .jpg, .jpeg, .png, .webp.");

    if (image.Length > 5 * 1024 * 1024)
        throw new Exception("Ảnh đánh giá không được vượt quá 5MB.");

    var webRoot = _env.WebRootPath;
    if (string.IsNullOrWhiteSpace(webRoot))
    {
        webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
    }

    var uploadDir = Path.Combine(webRoot, "uploads", "reviews");
    Directory.CreateDirectory(uploadDir);

    var fileName = $"{Guid.NewGuid():N}{ext}";
    var filePath = Path.Combine(uploadDir, fileName);

    using var stream = new FileStream(filePath, FileMode.Create);
    await image.CopyToAsync(stream);

    return $"/uploads/reviews/{fileName}";
}
    }
}