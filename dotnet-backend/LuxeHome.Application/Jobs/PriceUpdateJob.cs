using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using LuxeHome.Infrastructure.Data;
using LuxeHome.Domain.Entities;

namespace LuxeHome.Application.Jobs
{
    public interface IPriceUpdateJob
    {
        Task ExecutePriceUpdateAsync(long priceId);
    }

    public class PriceUpdateJob : IPriceUpdateJob
    {
        private readonly LuxeHomeDbContext _context;

        public PriceUpdateJob(LuxeHomeDbContext context)
        {
            _context = context;
        }

        public async Task ExecutePriceUpdateAsync(long priceId)
        {
            // 1. Tìm kiếm yêu cầu đổi giá
            var priceRequest = await _context.ProductPrices
                .Include(p => p.Variant)
                .FirstOrDefaultAsync(p => p.Id == priceId);

            // Nếu không tìm thấy hoặc đã chạy rồi thì bỏ qua
            if (priceRequest == null || priceRequest.Status == "ACTIVE") 
                return;

            // 2. Ghi lại lịch sử giá cũ
            var history = new PriceHistory
            {
                ProductId = priceRequest.ProductId,
                VariantId = priceRequest.VariantId,
                OldPrice = priceRequest.Variant.CurrentPrice,
                NewPrice = priceRequest.SellingPrice,
                Reason = "Hệ thống Hangfire tự động kích hoạt giá theo lịch",
                ChangedBy = priceRequest.ApprovedBy ?? 1, // ID Admin
                ChangedAt = DateTime.UtcNow
            };
            _context.PriceHistories.Add(history);

            // 3. Cập nhật giá bán hiện tại cho biến thể
            priceRequest.Variant.CurrentPrice = priceRequest.SellingPrice;

            // 4. Chuyển trạng thái yêu cầu thành ACTIVE
            priceRequest.Status = "ACTIVE";

            await _context.SaveChangesAsync();
        }
    }
}