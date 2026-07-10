using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LuxeHome.Application.DTOs;
using LuxeHome.Infrastructure.Data;
using System.Security.Claims;
using LuxeHome.Domain.Entities;
namespace LuxeHome.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PromotionsController : ControllerBase
    {
        private readonly LuxeHomeDbContext _context;

        public PromotionsController(LuxeHomeDbContext context)
        {
            _context = context;
        }

        // API cũ: giữ lại để frontend/admin đang dùng không bị lỗi
        [HttpGet]
        public async Task<IActionResult> GetCoupons()
        {
            var promotions = await _context.Promotions
                .Where(p =>
                    p.Status != null &&
                    p.CouponCode != null &&
                    p.Status.ToUpper() == "ACTIVE"
                )
                .OrderBy(p => p.MinOrderAmount)
                .Select(p => new
                {
                    code = p.CouponCode,
                    discountType =
                        p.PromotionType != null && p.PromotionType.ToUpper().Contains("PERCENT") ? "percent" :
                        p.PromotionType != null && p.PromotionType.ToUpper().Contains("FREESHIP") ? "freeship" :
                        p.PromotionType != null && p.PromotionType.ToUpper().Contains("INSTALLATION") ? "installation" :
                        "fixed",
                    value = p.DiscountValue,
                    minSubtotal = p.MinOrderAmount,
                    description = p.PromotionName,
                    isActive = p.Status != null && p.Status.ToUpper() == "ACTIVE"
                })
                .ToListAsync();

            return Ok(promotions);
        }

        // API mới: lấy danh sách mã đang khả dụng
        [HttpGet("available")]
        public async Task<IActionResult> GetAvailablePromotions()
        {
            var now = DateTime.Now;

            var promotions = await _context.Promotions
                .Where(p =>
                    p.Status != null &&
                    p.Status.ToUpper() == "ACTIVE" &&
                    p.CouponCode != null &&
                    (p.StartedAt == null || p.StartedAt <= now) &&
                    (p.EndedAt == null || p.EndedAt >= now) &&
                    (p.UsageLimit == null || (p.UsedCount ?? 0) < p.UsageLimit)
                )
                .OrderBy(p => p.MinOrderAmount)
                .Select(p => new
                {
                    p.Id,
                    p.PromotionName,
                    p.CouponCode,
                    p.PromotionType,
                    p.DiscountValue,
                    p.MinOrderAmount,
                    p.MaxDiscountAmount
                })
                .ToListAsync();

            return Ok(promotions);
        }

        // API mới: kiểm tra và áp dụng mã giảm giá
        [Authorize]
        [HttpPost("apply")]
        public async Task<IActionResult> ApplyPromotion([FromBody] ApplyPromotionRequest request)
        {
            try
            {
                var userId = long.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                var now = DateTime.UtcNow;

                if (string.IsNullOrWhiteSpace(request.CouponCode))
                {
                    return BadRequest(new { message = "Vui lòng nhập mã ưu đãi." });
                }

                var code = request.CouponCode.Trim().ToUpper();

                var promotion = await (
    from w in _context.CustomerPromotionWallets
    join p in _context.Promotions on w.PromotionId equals p.Id
    where w.UserId == userId
          && w.Status == "SAVED"
          && p.CouponCode != null
          && p.CouponCode.ToUpper() == code
    select p
).FirstOrDefaultAsync();

                if (promotion == null)
                {
                    return BadRequest(new { message = "Mã ưu đãi không tồn tại." });
                }

                if (promotion.Status == null || promotion.Status.ToUpper() != "ACTIVE")
                {
                    return BadRequest(new { message = "Mã ưu đãi hiện không còn hoạt động." });
                }

                if (promotion.StartedAt != null && promotion.StartedAt > now)
                {
                    return BadRequest(new { message = "Mã ưu đãi chưa đến thời gian sử dụng." });
                }

                if (promotion.EndedAt != null && promotion.EndedAt < now)
                {
                    return BadRequest(new { message = "Mã ưu đãi đã hết hạn." });
                }

                if (promotion.UsageLimit != null && (promotion.UsedCount ?? 0) >= promotion.UsageLimit)
                {
                    return BadRequest(new { message = "Mã ưu đãi đã hết lượt sử dụng." });
                }

                var minOrderAmount = promotion.MinOrderAmount ?? 0;

                if (request.SubtotalAmount < minOrderAmount)
                {
                    var needMore = minOrderAmount - request.SubtotalAmount;

                    return BadRequest(new
                    {
                        message = $"Mã {promotion.CouponCode} áp dụng cho đơn từ {minOrderAmount:N0}đ. Bạn cần mua thêm {needMore:N0}đ."
                    });
                }

                var type = promotion.PromotionType?.ToUpper() ?? "";
                var value = promotion.DiscountValue ?? 0;

                decimal discountAmount = 0;
                decimal shippingDiscount = 0;
                decimal installationDiscount = 0;

                switch (type)
                {
                    case "PERCENT":
                    case "PERCENTAGE":
                        discountAmount = request.SubtotalAmount * value / 100;

                        if (promotion.MaxDiscountAmount != null &&
                            discountAmount > promotion.MaxDiscountAmount.Value)
                        {
                            discountAmount = promotion.MaxDiscountAmount.Value;
                        }

                        break;

                    case "FIXED":
                    case "AMOUNT":
                    case "FIXED_AMOUNT":
                        discountAmount = value;
                        break;

                    case "FREESHIP":
                    case "FREE_SHIP":
                        shippingDiscount = request.ShippingFee;
                        break;

                    case "INSTALLATION":
                        installationDiscount = Math.Min(request.InstallationFee, value);
                        break;

                    default:
                        return BadRequest(new { message = "Loại mã ưu đãi không hợp lệ." });
                }

                var totalDiscount = discountAmount + shippingDiscount + installationDiscount;

                var finalAmount =
                    request.SubtotalAmount +
                    request.ShippingFee +
                    request.InstallationFee -
                    totalDiscount;

                if (finalAmount < 0)
                {
                    finalAmount = 0;
                }

                return Ok(new ApplyPromotionResponse
                {
                    IsValid = true,
                    CouponCode = promotion.CouponCode ?? "",
                    Message = $"Áp dụng mã {promotion.CouponCode} thành công.",
                    DiscountAmount = discountAmount,
                    ShippingDiscount = shippingDiscount,
                    InstallationDiscount = installationDiscount,
                    FinalAmount = finalAmount,
                    PromotionType = type
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        [Authorize]
[HttpPost("save")]
public async Task<IActionResult> SavePromotion([FromBody] SavePromotionRequest request)
{
    try
    {
        var userId = long.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var now = DateTime.Now;

        if (string.IsNullOrWhiteSpace(request.CouponCode))
        {
            return BadRequest(new { message = "Vui lòng nhập mã ưu đãi." });
        }

        var code = request.CouponCode.Trim().ToUpper();

        var promotion = await _context.Promotions
            .FirstOrDefaultAsync(p =>
                p.CouponCode != null &&
                p.CouponCode.ToUpper() == code
            );

        if (promotion == null)
        {
            return BadRequest(new { message = "Mã ưu đãi không tồn tại." });
        }

        if (promotion.Status == null || promotion.Status.ToUpper() != "ACTIVE")
        {
            return BadRequest(new { message = "Mã ưu đãi hiện không còn hoạt động." });
        }

        if (promotion.EndedAt != null && promotion.EndedAt < now)
        {
            return BadRequest(new { message = "Mã ưu đãi đã hết hạn, không thể lưu." });
        }

        if (promotion.UsageLimit != null && (promotion.UsedCount ?? 0) >= promotion.UsageLimit)
        {
            return BadRequest(new { message = "Mã ưu đãi đã hết lượt sử dụng." });
        }

        var existed = await _context.CustomerPromotionWallets
            .FirstOrDefaultAsync(w =>
                w.UserId == userId &&
                w.PromotionId == promotion.Id
            );

        if (existed != null)
        {
            return Ok(new
            {
                message = $"Mã {promotion.CouponCode} đã có trong ví ưu đãi của bạn.",
                couponCode = promotion.CouponCode
            });
        }

        var wallet = new CustomerPromotionWallet
        {
            UserId = userId,
            PromotionId = promotion.Id,
            SavedAt = now,
            Status = "SAVED"
        };

        _context.CustomerPromotionWallets.Add(wallet);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Đã lưu mã {promotion.CouponCode} vào ví ưu đãi.",
            couponCode = promotion.CouponCode
        });
    }
    catch (Exception ex)
    {
        return BadRequest(new
        {
            message = ex.InnerException?.Message ?? ex.Message
        });
    }
}
        [Authorize]
[HttpGet("my")]
public async Task<IActionResult> GetMyPromotions(
    [FromQuery] decimal subtotalAmount = 0,
    [FromQuery] decimal shippingFee = 0,
    [FromQuery] decimal installationFee = 0)
{
    try
    {
        var userId = long.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var now = DateTime.Now;
        var checkOrderCondition = subtotalAmount > 0;

        var data = await (
            from w in _context.CustomerPromotionWallets
            join p in _context.Promotions on w.PromotionId equals p.Id
            where w.UserId == userId && w.Status == "SAVED"
            orderby p.MinOrderAmount
            select new
            {
                Wallet = w,
                Promotion = p
            }
        ).ToListAsync();

        var result = data.Select(x =>
        {
            var p = x.Promotion;

            bool isUsable = true;
            string message = "Có thể sử dụng.";

            decimal discountAmount = 0;
            decimal shippingDiscount = 0;
            decimal installationDiscount = 0;

            if (p.Status == null || p.Status.ToUpper() != "ACTIVE")
            {
                isUsable = false;
                message = "Mã ưu đãi hiện không còn hoạt động.";
            }
            else if (p.StartedAt != null && p.StartedAt > now)
            {
                isUsable = false;
                message = "Mã ưu đãi chưa đến thời gian sử dụng.";
            }
            else if (p.EndedAt != null && p.EndedAt < now)
            {
                isUsable = false;
                message = "Mã ưu đãi đã hết hạn.";
            }
            else if (p.UsageLimit != null && (p.UsedCount ?? 0) >= p.UsageLimit)
            {
                isUsable = false;
                message = "Mã ưu đãi đã hết lượt sử dụng.";
            }
            else if (checkOrderCondition && subtotalAmount < (p.MinOrderAmount ?? 0))
            {
                var needMore = (p.MinOrderAmount ?? 0) - subtotalAmount;
                isUsable = false;
                message = $"Cần mua thêm {needMore:N0}đ để sử dụng mã này.";
            }

            if (isUsable && checkOrderCondition)
            {
                var type = p.PromotionType?.ToUpper() ?? "";
                var value = p.DiscountValue ?? 0;

                switch (type)
                {
                    case "PERCENT":
                    case "PERCENTAGE":
                        discountAmount = subtotalAmount * value / 100;

                        if (p.MaxDiscountAmount != null &&
                            discountAmount > p.MaxDiscountAmount.Value)
                        {
                            discountAmount = p.MaxDiscountAmount.Value;
                        }

                        break;

                    case "FIXED":
                    case "AMOUNT":
                    case "FIXED_AMOUNT":
                        discountAmount = value;
                        break;

                    case "FREESHIP":
                    case "FREE_SHIP":
                        shippingDiscount = shippingFee;
                        break;

                    case "INSTALLATION":
                        installationDiscount = Math.Min(installationFee, value);
                        break;
                }
            }

            var totalDiscount = discountAmount + shippingDiscount + installationDiscount;
            var finalAmount = subtotalAmount + shippingFee + installationFee - totalDiscount;
            if (finalAmount < 0) finalAmount = 0;

            return new MyPromotionResponse
            {
                WalletId = x.Wallet.Id,
                PromotionId = p.Id,
                CouponCode = p.CouponCode ?? "",
                PromotionName = p.PromotionName ?? "",
                PromotionType = p.PromotionType ?? "",
                DiscountValue = p.DiscountValue ?? 0,
                MinOrderAmount = p.MinOrderAmount ?? 0,
                MaxDiscountAmount = p.MaxDiscountAmount,

                IsUsable = isUsable,
                Message = message,

                DiscountAmount = discountAmount,
                ShippingDiscount = shippingDiscount,
                InstallationDiscount = installationDiscount,
                FinalAmount = finalAmount
            };
        }).ToList();

        return Ok(result);
    }
    catch (Exception ex)
    {
        return BadRequest(new { message = ex.Message });
    }
}
    }
}