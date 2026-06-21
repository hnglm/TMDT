using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LuxeHome.Infrastructure.Data;
using LuxeHome.Application.DTOs;
using LuxeHome.Domain.Entities;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly LuxeHomeDbContext _context;

    public ProductsController(LuxeHomeDbContext context)
    {
        _context = context;
    }

    // 1. Lấy danh sách sản phẩm hiển thị lên UI (Lệnh GET đã chạy thành công)
    [HttpGet]
    public async Task<IActionResult> GetProducts()
    {
        var products = await _context.Products
            .Where(p => p.Status != null && p.Status.ToUpper() == "ACTIVE") // Chỉ lấy sản phẩm đang kinh doanh
            .Select(p => new ProductResponseDto
            {
                Id = p.Id,
                ProductName = p.ProductName,
                AverageRating = p.AverageRating,
                Style = p.Style,
                ShortDescription = p.ShortDescription,
                Description = p.Description,
                Material = p.Material,
                WarrantyMonths = p.WarrantyMonths,
                Category = new CategoryInfoDto 
                {
                    Slug = p.Category.Slug,
                    CategoryName = p.Category.CategoryName
                },
                ProductImages = p.ProductImages
                    .OrderBy(img => img.SortOrder)
                    .Select(img => new ProductImageDto { ImageUrl = img.ImageUrl })
                    .ToList(),
                ProductVariants = p.ProductVariants
                    .Select(v => new ProductVariantDto { CurrentPrice = v.CurrentPrice, Color = v.Color })
                    .ToList()
            })
            .ToListAsync();

        return Ok(products);
    }

    // 2. Thêm sản phẩm mới từ giao diện Admin (Lệnh POST em bị thiếu)
    [HttpPost]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductDto dto)
    {
        // Khởi tạo Transaction để đảm bảo an toàn: Nếu lỗi giữa chừng sẽ hoàn tác (rollback) toàn bộ
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Tìm CategoryId
            long? categoryId = null;
            if (!string.IsNullOrEmpty(dto.CategorySlug))
            {
                var category = await _context.Categories.FirstOrDefaultAsync(c => c.Slug == dto.CategorySlug);
                categoryId = category?.Id;
            }

            // 2. Tạo Product
            var product = new Product
            {
                ProductName = dto.ProductName,
                Slug = dto.Slug,
                CategoryId = categoryId,
                ShortDescription = dto.ShortDescription,
                Description = dto.Description,
                Material = dto.Material,
                Style = dto.Style,
                WarrantyMonths = dto.WarrantyMonths,
                Status = (dto.Status ?? "ACTIVE").ToUpper(),
                AverageRating = 5,
                ViewCount = 0,
                SoldCount = 0
            };

            // 3. Gắn mảng Hình ảnh
            if (dto.Images != null && dto.Images.Any())
            {
                product.ProductImages = dto.Images.Select(img => new ProductImage
                {
                    ImageUrl = img.ImageUrl,
                    IsMain = img.IsMain,
                    SortOrder = img.SortOrder
                }).ToList();
            }

            // 4. Gắn mảng Biến thể (KHÔNG lồng tồn kho ở đây nữa)
            if (dto.Variants != null && dto.Variants.Any())
            {
                product.ProductVariants = dto.Variants.Select(v => new ProductVariant
                {
                    VariantName = dto.ProductName + " - " + v.Color,
                    Color = v.Color,
                    CurrentPrice = v.CurrentPrice,
                    Status = "ACTIVE"
                }).ToList();
            }

            // Lưu Product và Variants để DB sinh ra Id
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            //Tạo Tồn kho với Id thật đã được sinh ra
            int stockPerVariant = dto.Variants != null && dto.Variants.Any() 
                ? dto.InitialStock / dto.Variants.Count 
                : dto.InitialStock;

            if (product.ProductVariants.Any())
            {
                foreach (var variant in product.ProductVariants)
                {
                    _context.InventoryStocks.Add(new InventoryStock
                    {
                        ProductId = product.Id, // Khóa ngoại 1 
                        VariantId = variant.Id, // Khóa ngoại 2 
                        QuantityAvailable = stockPerVariant,
                        QuantityOnHand = stockPerVariant,
                        QuantityReserved = 0,
                        MinStockLevel = 0,
                        StockStatus = "IN_STOCK",
                        UpdatedAt = DateTime.Now
                    });
                }
            }
            else
            {
                // Backup nếu sản phẩm không có biến thể nào
                _context.InventoryStocks.Add(new InventoryStock
                {
                    ProductId = product.Id,
                    QuantityAvailable = dto.InitialStock,
                    QuantityOnHand = dto.InitialStock,
                    UpdatedAt = DateTime.Now
                });
            }

            // Lưu Tồn kho
            await _context.SaveChangesAsync();
            
            // Chốt giao dịch (Commit)
            await transaction.CommitAsync();

            // Trả về kết quả cho Frontend
            var responseDto = new ProductResponseDto
            {
                Id = product.Id,
                ProductName = product.ProductName,
                AverageRating = product.AverageRating,
                Style = product.Style,
                ShortDescription = product.ShortDescription,
                Description = product.Description,
                Material = product.Material,
                WarrantyMonths = product.WarrantyMonths,
                Category = new CategoryInfoDto 
                {
                    Slug = dto.CategorySlug,
                    CategoryName = dto.CategorySlug
                },
                ProductImages = product.ProductImages.Select(img => new ProductImageDto { ImageUrl = img.ImageUrl }).ToList(),
                ProductVariants = product.ProductVariants.Select(v => new ProductVariantDto { CurrentPrice = v.CurrentPrice, Color = v.Color }).ToList()
            };

            return CreatedAtAction(nameof(GetProducts), new { id = product.Id }, responseDto);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(); // Hoàn tác nếu có bất kỳ lỗi nào
            return StatusCode(500, $"Lỗi server: {ex.Message}");
        }
    }

    // 3. Xóa mềm sản phẩm
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(long id)
    {
        try
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound("Không tìm thấy sản phẩm.");

            // Đổi trạng thái thay vì xóa cứng để bảo toàn dữ liệu Đơn hàng lịch sử
            product.Status = "INACTIVE";
            await _context.SaveChangesAsync();

            return NoContent(); // HTTP 204: Thành công nhưng không cần trả về data
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi server: {ex.Message}");
        }
    }

    // 4. Cập nhật tồn kho nhanh
    [HttpPatch("{id}/stock")]
    public async Task<IActionResult> UpdateStock(long id, [FromBody] int newStock)
    {
        try
        {
            // Tìm tất cả các record tồn kho của sản phẩm này
            var stockRecords = await _context.InventoryStocks
                .Where(i => i.ProductId == id)
                .ToListAsync();
            
            if (!stockRecords.Any())
            {
                return NotFound("Không tìm thấy dữ liệu tồn kho cho sản phẩm này.");
            }

            
            var firstVariantStock = stockRecords.First();
            firstVariantStock.QuantityAvailable = newStock;
            firstVariantStock.QuantityOnHand = newStock;
            firstVariantStock.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi cập nhật tồn kho: {ex.Message}");
        }
    }
}