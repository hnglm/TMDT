using Microsoft.AspNetCore.Mvc;
using LuxeHome.Application.DTOs;
using LuxeHome.Application.Services;
using Microsoft.EntityFrameworkCore;
using LuxeHome.Infrastructure.Data;
using LuxeHome.Domain.Entities;
using System.Globalization;
using Microsoft.AspNetCore.Authorization;

namespace LuxeHome.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly VnPayService _vnpay;
        private readonly LuxeHomeDbContext _db;

        public OrdersController(
            IConfiguration config,
            VnPayService vnpay,
            LuxeHomeDbContext db)
        {
            _config = config;
            _vnpay = vnpay;
            _db = db;
        }

        [HttpPost("create-payment-url")]
        public async Task<IActionResult> CreatePaymentUrl([FromBody] CreateOrderDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest(new { message = "Dữ liệu đơn hàng không hợp lệ." });
                }

                if (dto.TotalAmount <= 0)
                {
                    return BadRequest(new
                    {
                        message = "TotalAmount phải lớn hơn 0.",
                        totalAmount = dto.TotalAmount
                    });
                }

                if (dto.Items == null || dto.Items.Count == 0)
                {
                    return BadRequest(new { message = "Đơn hàng trống. Vui lòng chọn sản phẩm." });
                }

                if (dto.UserId <= 0)
                {
                    return BadRequest(new
                    {
                        message = "UserId không hợp lệ. Cần đăng nhập trước khi thanh toán.",
                        userId = dto.UserId
                    });
                }

                var userExists = await _db.Users.AnyAsync(u => u.Id == dto.UserId);

                if (!userExists)
                {
                    return BadRequest(new
                    {
                        message = "Không tìm thấy người dùng trong database.",
                        userId = dto.UserId
                    });
                }

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

                    if (itemData == null)
                        continue;

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
                {
                    return BadRequest(new { message = "Không tìm thấy sản phẩm hợp lệ trong đơn hàng." });
                }

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

                var paymentUrl = _vnpay.CreatePaymentUrl(
                    dto.TotalAmount,
                    vnpayOrderId,
                    ipAddress,
                    _config
                );

                Console.WriteLine("===== CREATE VNPAY PAYMENT =====");
                Console.WriteLine("Order DB Id: " + order.Id);
                Console.WriteLine("TotalAmount: " + dto.TotalAmount);
                Console.WriteLine("VnpayOrderId: " + vnpayOrderId);
                Console.WriteLine("PaymentUrl: " + paymentUrl);
                Console.WriteLine("================================");

                return Ok(new
                {
                    paymentUrl,
                    orderId = vnpayOrderId,
                    totalAmount = dto.TotalAmount
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("CREATE PAYMENT ERROR: " + ex.ToString());
                return BadRequest(new { message = ex.Message });
            }
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

                if (dto == null || dto.Items == null || dto.Items.Count == 0)
                    return BadRequest(new { message = "Đơn hàng trống. Vui lòng chọn sản phẩm." });

                var orderItems = new List<OrderItem>();
                decimal subtotal = 0;

                foreach (var it in dto.Items)
                {
                    // Query only required fields so checkout does not depend on optional product columns.
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

                    if (itemData == null)
                        continue;

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

                decimal finalAmount = dto.TotalAmount > 0 ? dto.TotalAmount : subtotal;

                var order = new Order
                {
                    OrderCode = "LH" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString()
                                + Random.Shared.Next(100, 999).ToString(),
                    UserId = userId,

                    ReceiverName = string.IsNullOrWhiteSpace(dto.ReceiverName) ? "Khách hàng" : dto.ReceiverName,
                    ReceiverPhone = string.IsNullOrWhiteSpace(dto.ReceiverPhone) ? "0000000000" : dto.ReceiverPhone,
                    ShippingAddress = string.IsNullOrWhiteSpace(dto.ShippingAddress) ? "Chưa cập nhật" : dto.ShippingAddress,
                    CustomerNote = dto.CustomerNote,
                    CouponCode = dto.CouponCode,

                    SubtotalAmount = subtotal,
                    DiscountAmount = 0,
                    ShippingFee = finalAmount - subtotal > 0 ? finalAmount - subtotal : 0,
                    FinalAmount = finalAmount,

                    OrderStatus = "PENDING",
                    PaymentStatus = "UNPAID",
                    ShippingStatus = "PENDING",

                    OrderItems = orderItems
                };

                _db.Orders.Add(order);
                await _db.SaveChangesAsync();

                return Ok(new
                {
                    orderId = order.OrderCode,
                    id = order.Id,
                    totalAmount = order.FinalAmount,
                    itemCount = orderItems.Count
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("CREATE ORDER ERROR: " + ex.ToString());
                var inner = ex.InnerException?.Message ?? ex.Message;
                return BadRequest(new { message = ex.Message, detail = inner });
            }
        }

        [HttpGet("vnpay-return")]
        public async Task<IActionResult> VnPayReturn()
        {
            var query = Request.Query;

            if (!query.ContainsKey("vnp_SecureHash"))
            {
                return Ok("ReturnUrl VNPay hoạt động. Hãy thanh toán qua paymentUrl để VNPay redirect về đây.");
            }

            string vnpHashSecret = _config["Vnpay:HashSecret"] ?? "";

            bool isValid = _vnpay.ValidateSignature(query, vnpHashSecret);

            if (!isValid)
            {
                Console.WriteLine("===== VNPAY RETURN INVALID SIGNATURE =====");
                Console.WriteLine(Request.QueryString.ToString());
                Console.WriteLine("==========================================");

                return BadRequest("Chữ ký không hợp lệ!");
            }

            string responseCode = query["vnp_ResponseCode"].ToString();
            string txnRef = query["vnp_TxnRef"].ToString();

            Console.WriteLine("DEBUG: Đang tìm đơn hàng với OrderCode: " + txnRef);
            string amountRaw = query["vnp_Amount"].ToString();
            string transactionNo = query["vnp_TransactionNo"].ToString();

            Console.WriteLine("===== VNPAY RETURN VALID =====");
            Console.WriteLine("ResponseCode: " + responseCode);
            Console.WriteLine("TxnRef: " + txnRef);
            Console.WriteLine("Amount: " + amountRaw);
            Console.WriteLine("TransactionNo: " + transactionNo);
            Console.WriteLine("==============================");

            var order = await _db.Orders
                .FirstOrDefaultAsync(o => o.OrderCode == txnRef);

            if (order == null)
            {
                Console.WriteLine("Không tìm thấy đơn hàng với TxnRef: " + txnRef);
                var totalOrders = await _db.Orders.CountAsync();
                Console.WriteLine($"DEBUG: Không tìm thấy. Tổng số đơn hàng trong DB: {totalOrders}");
                return Redirect("http://localhost:3000/checkout/fail?reason=order-not-found");
            }

            decimal vnpAmount = decimal.Parse(amountRaw, CultureInfo.InvariantCulture) / 100;
            decimal orderAmount = order.FinalAmount ?? 0;

            if (vnpAmount != orderAmount)
            {
                order.PaymentStatus = "INVALID_AMOUNT";
                order.OrderStatus = "PAYMENT_FAILED";

                await _db.SaveChangesAsync();

                return Redirect("http://localhost:3000/checkout/fail?reason=invalid-amount");
            }

            if (responseCode == "00")
            {
                order.PaymentStatus = "PAID";
                order.OrderStatus = "CONFIRMED";
                order.ConfirmedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                return Redirect($"http://localhost:3000/checkout/success?orderId={txnRef}");
            }

            order.PaymentStatus = "FAILED";
            order.OrderStatus = "PAYMENT_FAILED";

            await _db.SaveChangesAsync();

            return Redirect($"http://localhost:3000/checkout/fail?orderId={txnRef}");
        }

        [HttpGet("test-vnpay")]
        public IActionResult TestVnPay()
        {
            var paymentUrl = _vnpay.CreatePaymentUrl(
                10000m,
                DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString(),
                "127.0.0.1",
                _config
            );

            return Ok(new
            {
                paymentUrl
            });
        }
        [HttpGet("my-orders")]
        [Authorize] // Yêu cầu đăng nhập mới được xem
        public async Task<IActionResult> GetMyOrders()
        {
            // Lấy ID người dùng từ Token JWT mà bạn đã cấu hình trong Program.cs
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim)) 
                return Unauthorized(new { message = "Bạn cần đăng nhập để xem đơn hàng." });

            long userId = long.Parse(userIdClaim);

            // Truy vấn các đơn hàng của user này (kèm chi tiết sản phẩm)
            var orders = await _db.Orders
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.Id)
                .Select(o => new
                {
                    o.Id,
                    o.OrderCode,
                    o.UserId,
                    o.ReceiverName,
                    o.ReceiverPhone,
                    o.ShippingAddress,
                    o.SubtotalAmount,
                    o.DiscountAmount,
                    o.ShippingFee,
                    o.FinalAmount,
                    o.OrderStatus,
                    o.PaymentStatus,
                    o.ShippingStatus,
                    o.CouponCode,
                    o.CustomerNote,
                    o.ConfirmedAt,
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
    }
}