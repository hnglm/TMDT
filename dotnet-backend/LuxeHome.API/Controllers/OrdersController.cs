using Microsoft.AspNetCore.Mvc;
using LuxeHome.Application.DTOs;
using LuxeHome.Application.Services;
using Microsoft.EntityFrameworkCore;
using LuxeHome.Infrastructure.Data;
using LuxeHome.Domain.Entities;
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

                string vnpayOrderId = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();

                var order = new Order
                {
                    OrderCode = vnpayOrderId,
                    UserId = dto.UserId,

                    SubtotalAmount = dto.TotalAmount,
                    DiscountAmount = 0,
                    ShippingFee = 0,
                    FinalAmount = dto.TotalAmount,

                    OrderStatus = "PENDING",
                    PaymentStatus = "UNPAID",
                    ShippingStatus = "PENDING",

                    ReceiverName = "Khách hàng",
                    ReceiverPhone = "0000000000",
                    ShippingAddress = "Chưa cập nhật"
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
    }
}