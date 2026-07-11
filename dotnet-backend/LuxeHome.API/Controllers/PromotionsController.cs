using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LuxeHome.Infrastructure.Data;
using LuxeHome.Application.DTOs;
using LuxeHome.Domain.Entities;
using System;
using System.Linq;
using System.Threading.Tasks;

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

        // =========================================================================
        // STOREFRONT (khách hàng) — giữ nguyên hành vi cũ, chỉ thêm lọc theo lịch
        // "Kích hoạt chương trình theo lịch": chỉ hiện mã đang trong khoảng StartedAt-EndedAt
        // =========================================================================
        [HttpGet]
        public async Task<IActionResult> GetCoupons()
        {
            var now = DateTime.UtcNow;

            var coupons = await _context.Promotions
                .Where(p => p.Status == "Active"
                    && (p.StartedAt == null || p.StartedAt <= now)
                    && (p.EndedAt == null || p.EndedAt >= now))
                .Select(p => new
                {
                    code = p.CouponCode,
                    discountType = p.PromotionType != null && p.PromotionType.Contains("Percent") ? "percent" : "fixed",
                    value = p.DiscountValue,
                    minSubtotal = p.MinOrderAmount,
                    description = p.PromotionName,
                    isActive = p.Status == "Active"
                })
                .ToListAsync();

            return Ok(coupons);
        }

        // =========================================================================
        // ADMIN (Quản lý cửa hàng) — theo đúng sơ đồ AD_Tạo chương trình khuyến mãi
        // =========================================================================

        // "Xem danh sách chương trình khuyến mãi"
        [HttpGet("admin-all")]
        public async Task<IActionResult> GetAllPromotionsAdmin()
        {
            var promotions = await _context.Promotions
                .OrderByDescending(p => p.Id)
                .Select(p => new
                {
                    p.Id,
                    p.PromotionName,
                    p.CouponCode,
                    p.PromotionType,
                    p.DiscountValue,
                    p.MinOrderAmount,
                    p.MaxDiscountAmount,
                    p.StartedAt,
                    p.EndedAt,
                    p.UsageLimit,
                    p.UsedCount,
                    p.Status
                })
                .ToListAsync();

            return Ok(promotions);
        }

        // "Tạo chương trình khuyến mãi" -> "Thiết lập điều kiện" -> "Có phát hành mã giảm giá?"
        // -> "Kiểm tra tính hợp lệ" -> Hợp lệ: "Lưu" + "Kích hoạt theo lịch" / Không hợp lệ: "Thông báo lỗi điều kiện"
        [HttpPost]
        public async Task<IActionResult> CreatePromotion([FromBody] CreatePromotionDto dto)
        {
            var validationError = await ValidatePromotionAsync(
                dto.PromotionName, dto.CouponCode, dto.PromotionType, dto.DiscountValue,
                dto.StartedAt, dto.EndedAt, excludeId: null);

            if (validationError != null)
                return BadRequest(new { message = validationError });

            var promotion = new Promotion
            {
                PromotionName = dto.PromotionName,
                CouponCode = string.IsNullOrWhiteSpace(dto.CouponCode) ? null : dto.CouponCode.Trim().ToUpper(),
                PromotionType = dto.PromotionType,
                DiscountValue = dto.DiscountValue,
                MinOrderAmount = dto.MinOrderAmount,
                MaxDiscountAmount = dto.MaxDiscountAmount,
                StartedAt = dto.StartedAt,
                EndedAt = dto.EndedAt,
                UsageLimit = dto.UsageLimit,
                UsedCount = 0,
                // "Kích hoạt chương trình theo lịch": lưu Active ngay, GetCoupons tự lọc theo StartedAt/EndedAt
                Status = "Active"
            };

            _context.Promotions.Add(promotion);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã tạo và kích hoạt chương trình khuyến mãi theo lịch.", id = promotion.Id });
        }

        // "Chọn chương trình cần cập nhật" -> "Cập nhật chương trình khuyến mãi" -> Kiểm tra lại tính hợp lệ
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePromotion(long id, [FromBody] UpdatePromotionDto dto)
        {
            var promotion = await _context.Promotions.FindAsync(id);
            if (promotion == null) return NotFound(new { message = "Không tìm thấy chương trình khuyến mãi." });

            if (promotion.Status == "Ended")
                return BadRequest(new { message = "Chương trình đã kết thúc, không thể chỉnh sửa." });

            var validationError = await ValidatePromotionAsync(
                dto.PromotionName, dto.CouponCode, dto.PromotionType, dto.DiscountValue,
                dto.StartedAt, dto.EndedAt, excludeId: id);

            if (validationError != null)
                return BadRequest(new { message = validationError });

            promotion.PromotionName = dto.PromotionName;
            promotion.CouponCode = string.IsNullOrWhiteSpace(dto.CouponCode) ? null : dto.CouponCode.Trim().ToUpper();
            promotion.PromotionType = dto.PromotionType;
            promotion.DiscountValue = dto.DiscountValue;
            promotion.MinOrderAmount = dto.MinOrderAmount;
            promotion.MaxDiscountAmount = dto.MaxDiscountAmount;
            promotion.StartedAt = dto.StartedAt;
            promotion.EndedAt = dto.EndedAt;
            promotion.UsageLimit = dto.UsageLimit;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã cập nhật chương trình khuyến mãi thành công." });
        }

        // "Chọn chương trình cần kết thúc" -> "Kết thúc/hủy chương trình khuyến mãi"
        // -> Hệ thống "Cập nhật trạng thái = Đã kết thúc"
        [HttpPut("{id}/end")]
        public async Task<IActionResult> EndPromotion(long id)
        {
            var promotion = await _context.Promotions.FindAsync(id);
            if (promotion == null) return NotFound(new { message = "Không tìm thấy chương trình khuyến mãi." });

            if (promotion.Status == "Ended")
                return BadRequest(new { message = "Chương trình này đã kết thúc từ trước." });

            promotion.Status = "Ended";
            promotion.EndedAt = DateTime.UtcNow < promotion.EndedAt ? DateTime.UtcNow : promotion.EndedAt;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã kết thúc/hủy chương trình khuyến mãi.", status = "Ended" });
        }

        // =========================================================================
        // "Kiểm tra tính hợp lệ (thời gian không trùng, điều kiện hợp lệ)"
        // =========================================================================
        private async Task<string?> ValidatePromotionAsync(
            string promotionName, string? couponCode, string promotionType, decimal discountValue,
            DateTime startedAt, DateTime endedAt, long? excludeId)
        {
            if (string.IsNullOrWhiteSpace(promotionName))
                return "Tên chương trình khuyến mãi không được để trống.";

            if (startedAt >= endedAt)
                return "Thời gian bắt đầu phải trước thời gian kết thúc.";

            if (discountValue <= 0)
                return "Giá trị giảm giá phải lớn hơn 0.";

            if (promotionType != null && promotionType.Contains("Percent") && discountValue > 100)
                return "Giá trị giảm theo phần trăm không được vượt quá 100%.";

            // Mã giảm giá phải là duy nhất nếu có phát hành
            if (!string.IsNullOrWhiteSpace(couponCode))
            {
                var normalizedCode = couponCode.Trim().ToUpper();
                var codeExists = await _context.Promotions
                    .AnyAsync(p => p.CouponCode == normalizedCode && p.Id != (excludeId ?? -1));

                if (codeExists)
                    return $"Mã giảm giá '{normalizedCode}' đã tồn tại, vui lòng chọn mã khác.";
            }

            // "Thời gian không trùng": không cho phép 2 chương trình đang Active trùng khoảng thời gian
            // Lưu ý: entity Promotion hiện chưa có trường phạm vi áp dụng (sản phẩm/đối tượng cụ thể),
            // nên kiểm tra này áp dụng ở mức toàn hệ thống. Nếu sau này bổ sung field scope,
            // cần lọc thêm theo scope tại đây.
            var hasOverlap = await _context.Promotions
                .Where(p => p.Status == "Active" && p.Id != (excludeId ?? -1))
                .AnyAsync(p => p.StartedAt < endedAt && p.EndedAt > startedAt);

            if (hasOverlap)
                return "Khoảng thời gian bị trùng với một chương trình khuyến mãi khác đang hoạt động.";

            return null;
        }
    }
}