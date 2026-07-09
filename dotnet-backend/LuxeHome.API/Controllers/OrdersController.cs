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

        public OrdersController(OrderService orderService)
        {
            _orderService = orderService;
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
    }
}