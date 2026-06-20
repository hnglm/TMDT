using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LuxeHome.Infrastructure.Data;

namespace LuxeHome.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly LuxeHomeDbContext _context;

        public ProductsController(LuxeHomeDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetProducts()
        {
            // Lấy danh sách sản phẩm kèm theo Hình ảnh và Biến thể giá
            var products = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductImages)
                .Include(p => p.ProductVariants)
                .Take(20) // Tạm thời lấy 20 sản phẩm
                .ToListAsync();

            return Ok(products);
        }
    }
}