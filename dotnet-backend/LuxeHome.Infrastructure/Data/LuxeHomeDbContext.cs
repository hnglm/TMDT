using Microsoft.EntityFrameworkCore;
using LuxeHome.Domain.Entities;

namespace LuxeHome.Infrastructure.Data
{
    public class LuxeHomeDbContext : DbContext
    {
        public LuxeHomeDbContext(DbContextOptions<LuxeHomeDbContext> options) : base(options)
        {
        }

        public DbSet<Product> Products { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Gieo mầm dữ liệu (Data Seeding) mẫu đồ nội thất xa xỉ ban đầu
            modelBuilder.Entity<Product>().HasData(
                new Product
                {
                    Id = "prod-01",
                    Name = "Sofa Da Bò Ý Tự Nhiên - Royal Signature",
                    Category = "phong-khach",
                    Style = "Luxury",
                    Price = 68500000,
                    Advice = "LuxeHome phát hiện kiểu dáng Sofa bò Ý dáng dấp tinh ranh quyến rũ. Gợi ý bài trí mẫu Sofa góc cao cấp này phối cùng các đèn thảm màu kem vàng champagne ấm áp.",
                    Description = "Sofa góc hoàng gia sang trọng bọc da bò tót nguyên tấm nhập mã Ý cao cấp."
                },
                new Product
                {
                    Id = "prod-02",
                    Name = "Bàn Trà Đá Cẩm Thạch Carrara - Venice Golden Frame",
                    Category = "phong-khach",
                    Style = "Modern",
                    Price = 18500000,
                    Advice = "Mẫu bàn trà mặt đá Carrara vân mây tự nhiên tôn vững độ sáng bóng phòng khách. Thích hợp đặt ly rượu hay trà nóng phối bình hoa champagne mảnh mai.",
                    Description = "Mặt đá cẩm thạch trắng mây tự nhiên, chân kim loại mạ vàng titan chống xước."
                },
                new Product
                {
                    Id = "prod-03",
                    Name = "Giường Ngủ Hoàng Gia Master - Silk King Velour",
                    Category = "phong-ngu",
                    Style = "Luxury",
                    Price = 42000000,
                    Advice = "Mẫu giường ngủ Master bọc Velvet cao sang lộng lẫy tột bậc. Khuyên Anh/Chị lắp đặt rèm tơ tằm hai lớp và đèn âm trần khuếch tán ánh sáng vàng nhẹ bẫng.",
                    Description = "Khung gỗ gụ quý phái bọc nỉ tuyết tơ tằm ấm áp dầy dặn."
                }
            );
        }
    }
}
