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
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.ProductImages)
            .Include(p => p.ProductVariants)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(p => p.ProductName.ToLower().Contains(search.ToLower()) || 
                                     p.ProductCode.ToLower().Contains(search.ToLower()));
        }

        if (!string.IsNullOrEmpty(category) && category != "all")
        {
            query = query.Where(p => p.Category != null && p.Category.Slug == category);
        }

        int totalItems = await query.CountAsync();
        int totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var products = await query
            .OrderByDescending(p => p.Id)
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
                    .ToList(),
                    StockQuantity = p.InventoryStocks.Sum(s => (int?)s.QuantityAvailable) ?? 0
            })
            .ToListAsync();

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

            // 👑 SỬA: LUÔN đảm bảo có ít nhất 1 variant (kể cả khi không nhập màu)
            // để InventoryStock luôn có VariantId hợp lệ, tránh dữ liệu hỏng như sản phẩm #10
            // 👑 SỬA: LUÔN đảm bảo có ít nhất 1 variant (kể cả khi không nhập màu)
            // để InventoryStock luôn có VariantId hợp lệ, tránh dữ liệu hỏng như sản phẩm #10
            List<ProductVariant> productVariants;

            if (dto.Variants != null && dto.Variants.Any())
            {
                productVariants = dto.Variants.Select(v => new ProductVariant
                {
                    VariantName = dto.ProductName + " - " + v.Color,
                    Color = v.Color,
                    CurrentPrice = v.CurrentPrice,
                    Status = "ACTIVE"
                }).ToList();
            }
            else
            {
                productVariants = new List<ProductVariant>
                {
                    new ProductVariant
                    {
                        VariantName = dto.ProductName + " - Mặc định",
                        Color = "Mặc định",
                        CurrentPrice = 0, // Sản phẩm chưa nhập giá biến thể, Admin cần cập nhật giá sau
                        Status = "ACTIVE"
                    }
                };
            }

            product.ProductVariants = productVariants;

            _context.Products.Add(product);
            await _context.SaveChangesAsync(); // Lưu để sinh Id cho product + từng variant

            int stockPerVariant = product.ProductVariants.Count > 0
                ? dto.InitialStock / product.ProductVariants.Count
                : dto.InitialStock;

            foreach (var variant in product.ProductVariants)
            {
                _context.InventoryStocks.Add(new InventoryStock
                {
                    ProductId = product.Id,
                    VariantId = variant.Id, // ✅ Luôn có variant hợp lệ
                    QuantityAvailable = stockPerVariant,
                    QuantityOnHand = stockPerVariant,
                    QuantityReserved = 0,
                    MinStockLevel = 5,
                    StockStatus = "IN_STOCK",
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
            Console.WriteLine("CREATE PRODUCT ERROR: " + ex.ToString());
            return StatusCode(500, new { message = "Lỗi server", detail = ex.InnerException?.Message ?? ex.Message });
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

    // 4. Cập nhật tồn kho nhanh (an toàn với sản phẩm chưa có InventoryStock)
    public class UpdateStockDto
    {
        public int NewStock { get; set; }
    }

    [HttpPatch("{id}/stock")]
    public async Task<IActionResult> UpdateStock(long id, [FromBody] UpdateStockDto dto)
    {
        try
        {
            var stockRecords = await _context.InventoryStocks.Where(i => i.ProductId == id).ToListAsync();

            if (!stockRecords.Any())
            {
                // 👑 SỬA: Nếu chưa có InventoryStock (sản phẩm dữ liệu cũ bị thiếu),
                // tự tạo mới thay vì trả lỗi 404 để không chặn thao tác của Admin
                var firstVariant = await _context.ProductVariants.FirstOrDefaultAsync(v => v.ProductId == id);
                if (firstVariant == null)
                    return BadRequest(new { message = "Sản phẩm này chưa có biến thể (variant), không thể tạo tồn kho." });

                var newStock = new InventoryStock
                {
                    ProductId = id,
                    VariantId = firstVariant.Id,
                    QuantityAvailable = dto.NewStock,
                    QuantityOnHand = dto.NewStock,
                    QuantityReserved = 0,
                    MinStockLevel = 5,
                    StockStatus = "IN_STOCK",
                    UpdatedAt = DateTime.UtcNow
                };
                _context.InventoryStocks.Add(newStock);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Đã tạo mới bản ghi tồn kho.", newStock = dto.NewStock });
            }

            var firstVariantStock = stockRecords.First();
            firstVariantStock.QuantityAvailable = dto.NewStock;
            firstVariantStock.QuantityOnHand = dto.NewStock;
            firstVariantStock.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật tồn kho thành công.", newStock = dto.NewStock });
        }
        catch (Exception ex)
        {
            Console.WriteLine("UPDATE STOCK ERROR: " + ex.ToString());
            return StatusCode(500, new { message = "Lỗi cập nhật tồn kho", detail = ex.InnerException?.Message ?? ex.Message });
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
                .Include(p => p.ProductImages)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) return NotFound(new { message = "Không tìm thấy sản phẩm." });

            if (!string.IsNullOrEmpty(dto.CategorySlug) && (product.Category == null || product.Category.Slug != dto.CategorySlug))
            {
                var newCategory = await _context.Categories.FirstOrDefaultAsync(c => c.Slug == dto.CategorySlug);
                if (newCategory != null) product.CategoryId = newCategory.Id;
            }

            product.ProductName = dto.ProductName;
            product.Style = dto.Style;
            product.Material = dto.Material;

            if (!string.IsNullOrEmpty(dto.Status)) product.Status = dto.Status.ToUpper();
            if (dto.MetaTitle != null) product.MetaTitle = dto.MetaTitle;
            if (dto.MetaDescription != null) product.MetaDescription = dto.MetaDescription;

            if (!string.IsNullOrEmpty(dto.ImageUrl))
            {
                var mainImage = product.ProductImages.FirstOrDefault(i => i.IsMain == true);
                if (mainImage != null) {
                    mainImage.ImageUrl = dto.ImageUrl;
                } else {
                    product.ProductImages.Add(new ProductImage { ImageUrl = dto.ImageUrl, IsMain = true, SortOrder = 1 });
                }
            }

            // 👑 SỬA: Nếu sản phẩm chưa có variant nào (dữ liệu cũ bị thiếu),
            // tự tạo 1 variant mặc định thay vì bỏ qua trong im lặng
            ProductVariant? targetVariant = product.ProductVariants.FirstOrDefault();
            if (targetVariant == null)
            {
                targetVariant = new ProductVariant
                {
                    ProductId = product.Id,
                    VariantName = product.ProductName + " - Mặc định",
                    Color = "Mặc định",
                    CurrentPrice = dto.CurrentPrice,
                    Status = "ACTIVE"
                };
                _context.ProductVariants.Add(targetVariant);
                await _context.SaveChangesAsync(); // cần Id trước khi tạo InventoryStock
            }
            else
            {
                targetVariant.CurrentPrice = dto.CurrentPrice;
            }

            // 👑 SỬA: Cập nhật tồn kho theo VariantId cụ thể, tự tạo nếu chưa có
            var stockRecord = await _context.InventoryStocks
                .FirstOrDefaultAsync(i => i.ProductId == id && i.VariantId == targetVariant.Id);

            if (stockRecord != null)
            {
                stockRecord.QuantityAvailable = dto.Stock;
                stockRecord.QuantityOnHand = dto.Stock;
                stockRecord.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _context.InventoryStocks.Add(new InventoryStock
                {
                    ProductId = id,
                    VariantId = targetVariant.Id,
                    QuantityAvailable = dto.Stock,
                    QuantityOnHand = dto.Stock,
                    QuantityReserved = 0,
                    MinStockLevel = 5,
                    StockStatus = "IN_STOCK",
                    UpdatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { message = "Cập nhật sản phẩm thành công." });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            Console.WriteLine("UPDATE PRODUCT ERROR: " + ex.ToString());
            return StatusCode(500, new { message = "Lỗi server", detail = ex.InnerException?.Message ?? ex.Message });
        }
    }
}