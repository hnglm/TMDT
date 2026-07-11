using LuxeHome.Application.DTOs;
using LuxeHome.Application.Services;
using LuxeHome.Infrastructure.Data;
using LuxeHome.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace LuxeHome.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly VnPayService _vnpay;
        private readonly LuxeHomeDbContext _db;
        private readonly InventoryService _inventoryService;
        private readonly OrderService _orderService;
        private readonly IWebHostEnvironment _env;

        public OrdersController(
            IConfiguration config,
            VnPayService vnpay,
            LuxeHomeDbContext db,
            InventoryService inventoryService,
            OrderService orderService,
            IWebHostEnvironment env)
        {
            _config = config;
            _vnpay = vnpay;
            _db = db;
            _inventoryService = inventoryService;
            _orderService = orderService;
            _env = env;
        }

        private string FrontendBaseUrl =>
            (_config["Frontend:BaseUrl"] ?? "http://localhost:3000").TrimEnd('/');

        // =========================================================================
        // VNPAY — thanh toán online (giữ nguyên logic dùng trực tiếp _db)
        // =========================================================================
        [HttpPost("create-payment-url")]
        public async Task<IActionResult> CreatePaymentUrl([FromBody] CreateOrderDto dto)
        {
            try
            {
                if (dto == null)
                    return BadRequest(new { message = "Dữ liệu đơn hàng không hợp lệ." });

                if (dto.TotalAmount <= 0)
                    return BadRequest(new { message = "TotalAmount phải lớn hơn 0.", totalAmount = dto.TotalAmount });

                if (dto.Items == null || dto.Items.Count == 0)
                    return BadRequest(new { message = "Đơn hàng trống. Vui lòng chọn sản phẩm." });

                if (dto.UserId <= 0)
                    return BadRequest(new { message = "UserId không hợp lệ. Cần đăng nhập trước khi thanh toán.", userId = dto.UserId });

                var userExists = await _db.Users.AnyAsync(u => u.Id == dto.UserId);
                if (!userExists)
                    return BadRequest(new { message = "Không tìm thấy người dùng trong database.", userId = dto.UserId });

                var orderItems = new List<OrderItem>();
                decimal subtotal = 0;

                foreach (var it in dto.Items)
                {
                    var itemData = await _db.ProductVariants
                        .Where(v => v.ProductId == it.ProductId)
                        .OrderByDescending(v => v.Id == it.VariantId)
                        .Select(v => new
                        {
                            ProductId = v.ProductId,
                            VariantId = v.Id,
                            ProductName = v.Product.ProductName,
                            Sku = v.Sku,
                            CurrentPrice = v.CurrentPrice,
                            WarrantyMonths = v.Product.WarrantyMonths
                        })
                        .FirstOrDefaultAsync();

                    if (itemData == null) continue;

                    decimal price = itemData.CurrentPrice ?? 0;
                    int qty = it.Quantity > 0 ? it.Quantity : 1;
                    decimal lineTotal = price * qty;
                    subtotal += lineTotal;

                    orderItems.Add(new OrderItem
                    {
                        ProductId = itemData.ProductId,
                        VariantId = itemData.VariantId,
                        ProductName = itemData.ProductName,
                        Sku = itemData.Sku,
                        Quantity = qty,
                        OriginalPrice = price,
                        SellingPrice = price,
                        DiscountAmount = 0,
                        TotalPrice = lineTotal,
                        WarrantyMonths = itemData.WarrantyMonths
                    });
                }

                if (orderItems.Count == 0)
                    return BadRequest(new { message = "Không tìm thấy sản phẩm hợp lệ trong đơn hàng." });

                string vnpayOrderId = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();

                var order = new Order
                {
                    OrderCode = vnpayOrderId,
                    UserId = dto.UserId,
                    ReceiverName = string.IsNullOrWhiteSpace(dto.ReceiverName) ? "Khách hàng" : dto.ReceiverName,
                    ReceiverPhone = string.IsNullOrWhiteSpace(dto.ReceiverPhone) ? "0000000000" : dto.ReceiverPhone,
                    ShippingAddress = string.IsNullOrWhiteSpace(dto.ShippingAddress) ? "Chưa cập nhật" : dto.ShippingAddress,
                    CustomerNote = dto.CustomerNote,
                    CouponCode = dto.CouponCode,
                    SubtotalAmount = subtotal,
                    DiscountAmount = 0,
                    ShippingFee = dto.TotalAmount - subtotal > 0 ? dto.TotalAmount - subtotal : 0,
                    FinalAmount = dto.TotalAmount,
                    OrderStatus = "PENDING",
                    PaymentStatus = "UNPAID",
                    ShippingStatus = "PENDING",
                    OrderItems = orderItems
                };

                _db.Orders.Add(order);
                await _db.SaveChangesAsync();

                string ipAddress = "127.0.0.1";
                var paymentUrl = _vnpay.CreatePaymentUrl(dto.TotalAmount, vnpayOrderId, ipAddress, _config);

                return Ok(new { paymentUrl, orderId = vnpayOrderId, totalAmount = dto.TotalAmount });
            }
            catch (Exception ex)
            {
                Console.WriteLine("CREATE PAYMENT ERROR: " + ex.ToString());
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("vnpay-return")]
        public async Task<IActionResult> VnPayReturn()
        {
            var query = Request.Query;

            if (!query.ContainsKey("vnp_SecureHash"))
                return Ok("ReturnUrl VNPay hoạt động. Hãy thanh toán qua paymentUrl để VNPay redirect về đây.");

            string vnpHashSecret = _config["Vnpay:HashSecret"] ?? "";
            bool isValid = _vnpay.ValidateSignature(query, vnpHashSecret);

            if (!isValid)
                return BadRequest("Chữ ký không hợp lệ!");

            string responseCode = query["vnp_ResponseCode"].ToString();
            string txnRef = query["vnp_TxnRef"].ToString();
            string amountRaw = query["vnp_Amount"].ToString();

            var order = await _db.Orders.FirstOrDefaultAsync(o => o.OrderCode == txnRef);
            if (order == null)
                return Redirect($"{FrontendBaseUrl}/checkout/fail?reason=order-not-found");

            decimal vnpAmount = decimal.Parse(amountRaw, CultureInfo.InvariantCulture) / 100;
            decimal orderAmount = order.FinalAmount ?? 0;

            if (vnpAmount != orderAmount)
            {
                order.PaymentStatus = "INVALID_AMOUNT";
                order.OrderStatus = "PAYMENT_FAILED";
                await _db.SaveChangesAsync();
                return Redirect($"{FrontendBaseUrl}/checkout/fail?reason=invalid-amount");
            }

            if (responseCode == "00")
            {
                order.PaymentStatus = "PAID";
                order.OrderStatus = "CONFIRMED";
                order.ConfirmedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
                return Redirect($"{FrontendBaseUrl}/checkout/success?orderId={txnRef}");
            }

            order.PaymentStatus = "FAILED";
            order.OrderStatus = "PAYMENT_FAILED";
            await _db.SaveChangesAsync();

            return Redirect($"{FrontendBaseUrl}/checkout/fail?orderId={txnRef}");
        }

        [HttpGet("test-vnpay")]
        public IActionResult TestVnPay()
        {
            var paymentUrl = _vnpay.CreatePaymentUrl(10000m, DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString(), "127.0.0.1", _config);
            return Ok(new { paymentUrl });
        }

        // =========================================================================
        // TẠO ĐƠN HÀNG (COD) — dùng OrderService của bạn cùng nhóm
        // =========================================================================
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
                return BadRequest(new { message = ex.Message, detail = ex.InnerException?.Message });
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
        public async Task<IActionResult> CreateReturnWarranty(string id, [FromForm] ReturnWarrantyDto dto)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

                dto.ImageUrls = await SaveReturnImagesAsync(dto.Images);
                await _orderService.CreateReturnRequestAsync(id, long.Parse(userIdClaim), dto);

                return Ok(new { message = "Yêu cầu hoàn hàng đã được ghi nhận.", imageUrls = dto.ImageUrls });
            }
            catch (Exception ex)
            {
                Console.WriteLine("RETURN REQUEST ERROR: " + ex);
                return BadRequest(new { message = ex.Message, detail = ex.InnerException?.Message });
            }
        }

        [HttpPost("{id}/review")]
        [Authorize]
        public async Task<IActionResult> AddReview(string id, [FromForm] AddReviewDto dto, [FromForm] IFormFile? image)
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
                return BadRequest(new { message = ex.Message, detail = ex.InnerException?.Message });
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
        public async Task<IActionResult> UpdateReview(string id, [FromForm] AddReviewDto dto, [FromForm] IFormFile? image)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

                var imageUrl = await SaveReviewImageAsync(image);
                if (!string.IsNullOrWhiteSpace(imageUrl)) dto.ImageUrl = imageUrl;

                await _orderService.UpdateReviewAsync(id, long.Parse(userIdClaim), dto);

                return Ok(new { message = "Đã cập nhật đánh giá thành công." });
            }
            catch (Exception ex)
            {
                Console.WriteLine("UPDATE REVIEW ERROR: " + ex);
                return BadRequest(new { message = ex.Message, detail = ex.InnerException?.Message });
            }
        }

        private async Task<string?> SaveReviewImageAsync(IFormFile? image)
        {
            if (image == null || image.Length == 0) return null;

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var ext = Path.GetExtension(image.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(ext))
                throw new Exception("Chỉ hỗ trợ ảnh .jpg, .jpeg, .png, .webp.");
            if (image.Length > 5 * 1024 * 1024)
                throw new Exception("Ảnh đánh giá không được vượt quá 5MB.");

            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadDir = Path.Combine(webRoot, "uploads", "reviews");
            Directory.CreateDirectory(uploadDir);

            var fileName = $"{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(uploadDir, fileName);

            using var stream = new FileStream(filePath, FileMode.Create);
            await image.CopyToAsync(stream);

            return $"/uploads/reviews/{fileName}";
        }

        private async Task<string?> SaveReturnImagesAsync(List<IFormFile>? images)
        {
            if (images == null || images.Count == 0) return null;
            if (images.Count > 5) throw new Exception("Chỉ được tải tối đa 5 ảnh.");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadDir = Path.Combine(webRoot, "uploads", "returns");
            Directory.CreateDirectory(uploadDir);

            var imageUrls = new List<string>();

            foreach (var image in images)
            {
                if (image == null || image.Length == 0) continue;

                var ext = Path.GetExtension(image.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(ext))
                    throw new Exception("Chỉ hỗ trợ ảnh .jpg, .jpeg, .png, .webp.");
                if (image.Length > 5 * 1024 * 1024)
                    throw new Exception("Mỗi ảnh hoàn hàng không được vượt quá 5MB.");

                var fileName = $"{Guid.NewGuid():N}{ext}";
                var filePath = Path.Combine(uploadDir, fileName);

                using var stream = new FileStream(filePath, FileMode.Create);
                await image.CopyToAsync(stream);

                imageUrls.Add($"/uploads/returns/{fileName}");
            }

            return string.Join(";", imageUrls);
        }

        // =========================================================================
        // ADMIN/SALES/KHO — vòng đời đơn hàng (dùng trực tiếp _db + InventoryService)
        // pending -> confirmed -> shipping -> delivered -> completed (hoặc cancelled/returned)
        // =========================================================================

        [HttpGet("admin-all")]
        public async Task<IActionResult> GetAllOrdersAdmin()
        {
            var orders = await _db.Orders
                .OrderByDescending(o => o.Id)
                .Select(o => new
                {
                    o.Id,
                    o.OrderCode,
                    CustomerName = o.ReceiverName,
                    TotalAmount = o.FinalAmount,
                    Status = o.OrderStatus,
                    o.PaymentStatus,
                    o.ConfirmedAt,
                    o.ReceiverPhone,
                    o.ShippingAddress,
                    o.CustomerNote,
                    o.StaffNote,
                    Items = o.OrderItems.Select(i => new
                    {
                        i.ProductId,
                        i.VariantId,
                        i.ProductName,
                        i.Sku,
                        i.Quantity,
                        i.OriginalPrice,
                        i.SellingPrice,
                        i.TotalPrice
                    }).ToList()
                })
                .ToListAsync();
            return Ok(orders);
        }

        [HttpPut("{id}/confirm")]
        public async Task<IActionResult> ConfirmOrder(long id)
        {
            var order = await _db.Orders.FindAsync(id);
            if (order == null) return NotFound(new { message = "Không tìm thấy đơn hàng." });

            order.OrderStatus = "CONFIRMED";
            await _db.SaveChangesAsync();

            return Ok(new { message = "Đã xác nhận đơn hàng! Chờ duyệt đơn bán.", status = "CONFIRMED" });
        }

        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveOrder(long id)
        {
            var order = await _db.Orders.FindAsync(id);
            if (order == null) return NotFound(new { message = "Không tìm thấy đơn hàng." });

            var stockResult = await _inventoryService.DeductStockForOrderAsync(id);

            if (!stockResult.Success)
            {
                return BadRequest(new
                {
                    message = "Không đủ hàng trong kho để duyệt đơn.",
                    insufficientItems = stockResult.InsufficientItems
                });
            }

            order.OrderStatus = "SHIPPING";
            order.ShippingStatus = "PREPARING";
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Đã duyệt đơn bán! Đã trừ tồn kho, đơn chuyển sang kho chuẩn bị hàng.",
                status = "SHIPPING",
                lowStockWarnings = stockResult.LowStockWarnings
            });
        }

        [HttpPut("{id}/warehouse-prepare")]
        public async Task<IActionResult> WarehousePrepareOrder(long id)
        {
            var order = await _db.Orders.FindAsync(id);
            if (order == null) return NotFound(new { message = "Không tìm thấy đơn hàng." });

            order.OrderStatus = "DELIVERED";
            order.ShippingStatus = "READY_TO_SHIP";
            await _db.SaveChangesAsync();

            return Ok(new { message = "Kho đã chuẩn bị hàng xong, đơn chuyển sang trạng thái Đang Giao Hàng.", status = "DELIVERED" });
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(long id, [FromBody] UpdateOrderStatusDto dto)
        {
            var order = await _db.Orders.FindAsync(id);
            if (order == null) return NotFound(new { message = "Không tìm thấy đơn hàng." });

            order.OrderStatus = dto.Status.ToUpperInvariant();

            if (order.OrderStatus == "COMPLETED")
            {
                order.PaymentStatus = "PAID";
                order.ConfirmedAt = order.ConfirmedAt ?? DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();

            return Ok(new { message = "Cập nhật trạng thái đơn hàng thành công!", status = order.OrderStatus });
        }

        [HttpPut("{id}/cancel-admin")]
        public async Task<IActionResult> CancelOrderAdmin(long id, [FromBody] CancelOrderAdminDto dto)
        {
            var order = await _db.Orders.FindAsync(id);
            if (order == null) return NotFound(new { message = "Không tìm thấy đơn hàng." });

            bool wasStockDeducted = order.ShippingStatus == "PREPARING" || order.ShippingStatus == "READY_TO_SHIP";
            List<string> warnings = new();

            if (wasStockDeducted)
            {
                var restoreResult = await _inventoryService.RestoreStockForOrderAsync(id, isValidReturn: true);
                if (!restoreResult.Success)
                {
                    return BadRequest(new { message = "Hủy đơn thất bại khi hoàn kho.", detail = restoreResult.InsufficientItems });
                }
                warnings = restoreResult.LowStockWarnings;
            }

            order.OrderStatus = "CANCELLED";
            order.StaffNote = dto.Reason;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Đã ghi nhận lý do, cập nhật trạng thái hủy đơn" + (wasStockDeducted ? " và hoàn kho." : "."),
                status = "CANCELLED",
                lowStockWarnings = warnings
            });
        }

        [HttpPut("{id}/process-return")]
        public async Task<IActionResult> ProcessReturn(long id, [FromBody] ProcessReturnDto dto)
        {
            var order = await _db.Orders.FindAsync(id);
            if (order == null) return NotFound(new { message = "Không tìm thấy đơn hàng." });

            var restoreResult = await _inventoryService.RestoreStockForOrderAsync(id, dto.IsValidReturn);

            if (!restoreResult.Success)
            {
                order.StaffNote = dto.Reason;
                await _db.SaveChangesAsync();
                return BadRequest(new { message = "Hàng trả không hợp lệ, không thể hoàn kho.", detail = restoreResult.InsufficientItems });
            }

            order.OrderStatus = "RETURNED";
            order.StaffNote = dto.Reason;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Đã kiểm tra hàng trả hợp lệ và hoàn kho thành công.",
                status = "RETURNED",
                lowStockWarnings = restoreResult.LowStockWarnings
            });
        }
    }

    public class CancelOrderAdminDto
    {
        public string Reason { get; set; } = string.Empty;
    }

    public class ProcessReturnDto
    {
        public bool IsValidReturn { get; set; }
        public string? Reason { get; set; }
    }

    public class UpdateOrderStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}