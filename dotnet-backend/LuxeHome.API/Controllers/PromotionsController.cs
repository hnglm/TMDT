using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LuxeHome.Infrastructure.Data;
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

        [HttpGet]
        public async Task<IActionResult> GetCoupons()
        {
            // Lấy dữ liệu và map thẳng sang chuẩn camelCase của Frontend
            var coupons = await _context.Promotions
                .Where(p => p.Status == "Active")
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
    }
}