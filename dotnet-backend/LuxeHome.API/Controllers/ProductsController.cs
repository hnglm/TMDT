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

    // 1. Lấy danh sách sản phẩm CÓ PHÂN TRANG VÀ TÌM KIẾM
    [HttpGet]
    public async Task<IActionResult> GetProducts(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10, 
        [FromQuery] string search = "", 
        [FromQuery] string category = "")
    {
        // BỎ ĐIỀU KIỆN LỌC STATUS = ACTIVE ĐỂ ADMIN THẤY ĐƯỢC SẢN PHẨM INACTIVE
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.ProductImages)
            .Include(p => p.ProductVariants)
            .AsQueryable();

        // 1.1 Lọc theo từ khóa tìm kiếm (Tên sản phẩm)
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(p => p.ProductName.ToLower().Contains(search.ToLower()) || 
                                     p.ProductCode.ToLower().Contains(search.ToLower()));
        }

        // 1.2 Lọc theo danh mục
        if (!string.IsNullOrEmpty(category) && category != "all")
        {
            query = query.Where(p => p.Category != null && p.Category.Slug == category);
        }

        // 1.3 Đếm tổng số lượng sản phẩm thỏa mãn điều kiện để tính số trang
        int totalItems = await query.CountAsync();
        int totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        // 1.4 Lấy dữ liệu của trang hiện tại (Skip & Take)
        var products = await query
            .OrderByDescending(p => p.Id) // Mới nhất lên đầu
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
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
                // 👑 MỚI: TRẢ VỀ THÊM TRẠNG THÁI VÀ SEO ĐỂ HIỂN THỊ LÊN FORM EDIT
                Status = p.Status,
                MetaTitle = p.MetaTitle,
                MetaDescription = p.MetaDescription,
                Category = p.Category != null ? new CategoryInfoDto 
                {
                    Slug = p.Category.Slug,
                    CategoryName = p.Category.CategoryName
                } : null,
                ProductImages = p.ProductImages
                    .OrderBy(img => img.SortOrder)
                    .Select(img => new ProductImageDto { ImageUrl = img.ImageUrl })
                    .ToList(),
                ProductVariants = p.ProductVariants
                    .Select(v => new ProductVariantDto 
                    { 
                        Id = v.Id,   
                        Sku = v.Sku,
                        CurrentPrice = v.CurrentPrice, 
                        Color = v.Color 
                    })
                    .ToList()
            })
            .ToListAsync();

        // Trả về Object bọc lại dữ liệu phân trang
        return Ok(new { 
            Items = products, 
            TotalItems = totalItems, 
            TotalPages = totalPages, 
            CurrentPage = page 
        });
    }

    // 2. Thêm sản phẩm mới từ giao diện Admin
    [HttpPost]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductDto dto)
    {
        // Khởi tạo Transaction để đảm bảo an toàn
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            long? categoryId = null;
            if (!string.IsNullOrEmpty(dto.CategorySlug))
            {
                var category = await _context.Categories.FirstOrDefaultAsync(c => c.Slug == dto.CategorySlug);
                categoryId = category?.Id;
            }

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

            if (dto.Images != null && dto.Images.Any())
            {
                product.ProductImages = dto.Images.Select(img => new ProductImage
                {
                    ImageUrl = img.ImageUrl,
                    IsMain = img.IsMain,
                    SortOrder = img.SortOrder
                }).ToList();
            }

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

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            int stockPerVariant = dto.Variants != null && dto.Variants.Any() 
                ? dto.InitialStock / dto.Variants.Count 
                : dto.InitialStock;

            if (product.ProductVariants.Any())
            {
                foreach (var variant in product.ProductVariants)
                {
                    _context.InventoryStocks.Add(new InventoryStock
                    {
                        ProductId = product.Id,
                        VariantId = variant.Id,
                        QuantityAvailable = stockPerVariant,
                        QuantityOnHand = stockPerVariant,
                        QuantityReserved = 0,
                        MinStockLevel = 0,
                        StockStatus = "IN_STOCK",
                        UpdatedAt = DateTime.UtcNow
                    });
                }
            }
            else
            {
                _context.InventoryStocks.Add(new InventoryStock
                {
                    ProductId = product.Id,
                    QuantityAvailable = dto.InitialStock,
                    QuantityOnHand = dto.InitialStock,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { message = "Thêm sản phẩm thành công", id = product.Id });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
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

            product.Status = "INACTIVE";
            await _context.SaveChangesAsync();

            return NoContent();
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
            var stockRecords = await _context.InventoryStocks.Where(i => i.ProductId == id).ToListAsync();
            if (!stockRecords.Any()) return NotFound("Không tìm thấy dữ liệu tồn kho.");

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

    // 5. Cập nhật thông tin Sản phẩm
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(long id, [FromBody] UpdateProductDto dto)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var product = await _context.Products
                .Include(p => p.ProductVariants)
                .Include(p => p.Category)
                .Include(p => p.ProductImages) // 👑 THÊM INCLUDE NÀY ĐỂ SỬA ẢNH
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) return NotFound("Không tìm thấy sản phẩm.");

            if (!string.IsNullOrEmpty(dto.CategorySlug) && (product.Category == null || product.Category.Slug != dto.CategorySlug))
            {
                var newCategory = await _context.Categories.FirstOrDefaultAsync(c => c.Slug == dto.CategorySlug);
                if (newCategory != null) product.CategoryId = newCategory.Id;
            }

            // 👑 3. Cập nhật thông tin cơ bản + Trạng thái + SEO
            product.ProductName = dto.ProductName;
            product.Style = dto.Style;
            product.Material = dto.Material;
            
            if (!string.IsNullOrEmpty(dto.Status)) product.Status = dto.Status.ToUpper();
            if (dto.MetaTitle != null) product.MetaTitle = dto.MetaTitle;
            if (dto.MetaDescription != null) product.MetaDescription = dto.MetaDescription;

            // Cập nhật Ảnh Chính
            if (!string.IsNullOrEmpty(dto.ImageUrl))
            {
                var mainImage = product.ProductImages.FirstOrDefault(i => i.IsMain == true);
                if (mainImage != null) {
                    mainImage.ImageUrl = dto.ImageUrl;
                } else {
                    product.ProductImages.Add(new ProductImage { ImageUrl = dto.ImageUrl, IsMain = true, SortOrder = 1 });
                }
            }

            if (product.ProductVariants != null && product.ProductVariants.Any())
            {
                var firstVariant = product.ProductVariants.First();
                firstVariant.CurrentPrice = dto.CurrentPrice;
            }

            var stockRecord = await _context.InventoryStocks.FirstOrDefaultAsync(i => i.ProductId == id);
            if (stockRecord != null)
            {
                stockRecord.QuantityAvailable = dto.Stock;
                stockRecord.QuantityOnHand = dto.Stock;
                stockRecord.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { message = "Cập nhật sản phẩm thành công." });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, $"Lỗi server: {ex.Message}");
        }
    }
}