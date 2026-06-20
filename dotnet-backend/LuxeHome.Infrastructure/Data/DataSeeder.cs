using Bogus;
using LuxeHome.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace LuxeHome.Infrastructure.Data
{
    public static class DataSeeder
    {
        public static async Task SeedAsync(LuxeHomeDbContext context, bool isEnabled = true)
        {
            // Set locale sang tiếng Việt để tạo tên, địa chỉ thực tế hơn
            Randomizer.Seed = new Random(8675309);

            // Kiểm tra nếu DB đã có dữ liệu thì bỏ qua seed
            if (await context.Roles.AnyAsync()) return;

            // ==========================================
            // 1. SEED ROLES
            // ==========================================
            var roles = new List<Role>
            {
                new Role { RoleCode = "ADMIN", RoleName = "Quản trị viên", Status = "Active" },
                new Role { RoleCode = "CUSTOMER", RoleName = "Khách hàng", Status = "Active" }
            };
            await context.Roles.AddRangeAsync(roles);
            await context.SaveChangesAsync();

            var adminRoleId = roles.First(r => r.RoleCode == "ADMIN").Id;
            var customerRoleId = roles.First(r => r.RoleCode == "CUSTOMER").Id;

            // ==========================================
            // 2. SEED USERS
            // ==========================================
            var userFaker = new Faker<User>("vi")
                .RuleFor(u => u.RoleId, f => f.PickRandom(adminRoleId, customerRoleId))
                .RuleFor(u => u.FullName, f => f.Name.FullName())
                .RuleFor(u => u.Email, (f, u) => f.Internet.Email(u.FullName))
                .RuleFor(u => u.Phone, f => f.Phone.PhoneNumber("0#########"))
                .RuleFor(u => u.PasswordHash, f => "$2a$11$N/V.gVzO8aD/jV7...") // Placeholder hash (Nên dùng BCrypt thật)
                .RuleFor(u => u.AvatarUrl, f => f.Internet.Avatar())
                .RuleFor(u => u.Status, f => "Active")
                .RuleFor(u => u.CreatedAt, f => f.Date.Past(1));

            var users = userFaker.Generate(15);
            await context.Users.AddRangeAsync(users);
            await context.SaveChangesAsync();

            // ==========================================
            // 3. SEED CATEGORIES (Dữ liệu Nội thất thật)
            // ==========================================
            var categoryNames = new[] { "Phòng Khách", "Phòng Ngủ", "Phòng Ăn", "Phòng Làm Việc", "Đồ Trang Trí" };
            
            var categoryFaker = new Faker<Category>("vi")
                // Lấy lần lượt các tên danh mục chuẩn xác
                .RuleFor(c => c.CategoryName, f => f.PickRandom(categoryNames))
                .RuleFor(c => c.Slug, (f, c) => c.CategoryName.ToLower().Replace(" ", "-").Replace("đ", "d") + "-" + f.Random.Number(100, 999))
                .RuleFor(c => c.Description, (f, c) => "Danh mục các sản phẩm nội thất cao cấp dành cho " + c.CategoryName)
                .RuleFor(c => c.ThumbnailUrl, f => f.Image.PicsumUrl())
                .RuleFor(c => c.IsVisible, f => true)
                .RuleFor(c => c.Status, f => "Active");

            var categories = categoryFaker.Generate(5); // Tạo đúng 5 danh mục
            await context.Categories.AddRangeAsync(categories);
            await context.SaveChangesAsync();

            // ==========================================
            // 4. SEED PRODUCTS (Dữ liệu Nội thất thật)
            // ==========================================
            var productPrefixes = new[] { "Sofa Da Bò Ý", "Bàn Trà Cẩm Thạch", "Giường Ngủ Master", "Tủ Quần Áo Kính", "Bàn Ăn Gỗ Sồi", "Ghế Công Thái Học", "Kệ Tivi Gỗ Óc Chó", "Đèn Chùm Pha Lê" };
            var productStyles = new[] { "Royal", "Venice", "Nordic", "Aurora", "Milano", "Prestige", "Minimalist" };
            var materials = new[] { "Da Bò Tự Nhiên", "Gỗ Sồi Nga", "Đá Cẩm Thạch", "Kính Cường Lực", "Khung Hợp Kim Nôm" };

            var productFaker = new Faker<Product>("vi")
                .RuleFor(p => p.CategoryId, (f, p) => (long?)f.PickRandom(categories).Id)
                .RuleFor(p => p.ProductCode, f => f.Commerce.Ean13())
                // Ghép tên sản phẩm có ý nghĩa: VD "Sofa Da Bò Ý Royal"
                .RuleFor(p => p.ProductName, f => $"{f.PickRandom(productPrefixes)} {f.PickRandom(productStyles)}")
                .RuleFor(p => p.Slug, (f, p) => p.ProductName.ToLower().Replace(" ", "-").Replace("đ", "d") + "-" + f.Random.AlphaNumeric(5))
                .RuleFor(p => p.ShortDescription, (f, p) => $"Tuyệt tác {p.ProductName} mang đến không gian sống đẳng cấp.")
                .RuleFor(p => p.Description, f => "Sản phẩm được chế tác tỉ mỉ từ những nghệ nhân hàng đầu, đảm bảo độ bền bỉ vượt thời gian và tính thẩm mỹ cao nhất cho không gian kiến trúc của bạn.")
                .RuleFor(p => p.Material, f => f.PickRandom(materials))
                .RuleFor(p => p.WarrantyMonths, f => f.PickRandom(12, 24, 60)) // Nội thất bảo hành dài
                .RuleFor(p => p.Status, f => "Active")
                .RuleFor(p => p.IsFeatured, f => f.Random.Bool(0.3f))
                .RuleFor(p => p.AverageRating, f => f.Random.Decimal(4.0m, 5.0m))
                .RuleFor(p => p.ReviewCount, f => f.Random.Number(10, 500));

            var products = productFaker.Generate(30);
            await context.Products.AddRangeAsync(products);
            await context.SaveChangesAsync();

            // ==========================================
            // 5. SEED VARIANTS & IMAGES
            // ==========================================
            var variants = new List<ProductVariant>();
            var images = new List<ProductImage>();

            foreach (var product in products)
            {
                // Mỗi product sẽ có từ 1-3 variants (Biến thể)
                var variantCount = new Random().Next(1, 4);
                var variantFaker = new Faker<ProductVariant>("vi")
                    .RuleFor(v => v.ProductId, product.Id)
                    .RuleFor(v => v.Sku, f => $"SKU-{f.Random.AlphaNumeric(8).ToUpper()}")
                    .RuleFor(v => v.VariantName, f => f.Commerce.Color())
                    .RuleFor(v => v.Color, f => f.Commerce.Color())
                    .RuleFor(v => v.CurrentPrice, f => decimal.Parse(f.Commerce.Price(500000, 10000000, 0)))
                    .RuleFor(v => v.CompareAtPrice, (f, v) => v.CurrentPrice * f.Random.Decimal(1.1m, 1.4m))
                    .RuleFor(v => v.Status, "Active");

                variants.AddRange(variantFaker.Generate(variantCount));

                // Mỗi product sẽ có từ 2-4 hình ảnh
                var imageCount = new Random().Next(2, 5);
                var imageFaker = new Faker<ProductImage>()
                    .RuleFor(i => i.ProductId, product.Id)
                    .RuleFor(i => i.ImageUrl, f => f.Image.PicsumUrl(640, 480))
                    .RuleFor(i => i.AltText, product.ProductName)
                    .RuleFor(i => i.IsMain, false);

                var productImages = imageFaker.Generate(imageCount);
                if (productImages.Any())
                {
                    productImages[0].IsMain = true; // Set ảnh đầu tiên làm ảnh đại diện
                }
                images.AddRange(productImages);
            }

            await context.ProductVariants.AddRangeAsync(variants);
            await context.ProductImages.AddRangeAsync(images);
            await context.SaveChangesAsync();
        }
    }
}