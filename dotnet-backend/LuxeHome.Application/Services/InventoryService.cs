using Microsoft.EntityFrameworkCore;
using LuxeHome.Infrastructure.Data;
using LuxeHome.Domain.Entities;

namespace LuxeHome.Application.Services
{
    public class InventoryService
    {
        private readonly LuxeHomeDbContext _db;

        public InventoryService(LuxeHomeDbContext db)
        {
            _db = db;
        }

        public class StockCheckResult
        {
            public bool Success { get; set; }
            public List<string> InsufficientItems { get; set; } = new();
            public List<string> LowStockWarnings { get; set; } = new();
        }

        /// <summary>
        /// Nhánh "Đơn được duyệt - Bán hàng":
        /// Gửi yêu cầu trừ tồn kho -> Kiểm tra tồn kho theo biến thể
        /// -> Đủ: Trừ tồn kho sau khi bán / Không đủ: Thông báo thiếu hàng
        /// </summary>
        public async Task<StockCheckResult> DeductStockForOrderAsync(long orderId)
        {
            var result = new StockCheckResult();

            var order = await _db.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
            {
                result.Success = false;
                result.InsufficientItems.Add("Không tìm thấy đơn hàng.");
                return result;
            }

            // Bước 1: Kiểm tra tồn kho theo biến thể cho TẤT CẢ item trước (đảm bảo atomic)
            var stocksToUpdate = new List<(InventoryStock stock, int qty)>();

            foreach (var item in order.OrderItems)
            {
                var stock = await _db.InventoryStocks
                    .FirstOrDefaultAsync(s => s.VariantId == item.VariantId);

                int qty = item.Quantity ?? 0;
                int available = stock?.QuantityAvailable ?? 0;

                if (stock == null || available < qty)
                {
                    result.InsufficientItems.Add(
                        $"{item.ProductName} (SKU: {item.Sku}) - Cần {qty}, còn {available}");
                }
                else
                {
                    stocksToUpdate.Add((stock, qty));
                }
            }

            // Nhánh "Không đủ" -> Thông báo thiếu hàng, KHÔNG trừ kho
            if (result.InsufficientItems.Count > 0)
            {
                result.Success = false;
                return result;
            }

            // Nhánh "Đủ" -> Trừ tồn kho sau khi bán
            foreach (var (stock, qty) in stocksToUpdate)
            {
                stock.QuantityOnHand = (stock.QuantityOnHand ?? 0) - qty;
                stock.QuantityAvailable = (stock.QuantityAvailable ?? 0) - qty;
                stock.UpdatedAt = DateTime.UtcNow;

                // Cập nhật số lượng tồn kho -> Kiểm tra ngưỡng cảnh báo hàng sắp hết
                CheckThreshold(stock, result);
            }

            await _db.SaveChangesAsync();
            result.Success = true;
            return result;
        }

        /// <summary>
        /// Nhánh "Khách hủy đơn / Khách trả hàng":
        /// Kiểm tra tình trạng hàng trả -> Hợp lệ: Hoàn kho / Không hợp lệ: Thông báo không thể trả hàng
        /// </summary>
        public async Task<StockCheckResult> RestoreStockForOrderAsync(long orderId, bool isValidReturn)
        {
            var result = new StockCheckResult();

            // Nhánh "Không hợp lệ" -> Thông báo không thể trả hàng
            if (!isValidReturn)
            {
                result.Success = false;
                result.InsufficientItems.Add("Tình trạng hàng trả không hợp lệ, không thể hoàn kho.");
                return result;
            }

            var order = await _db.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
            {
                result.Success = false;
                result.InsufficientItems.Add("Không tìm thấy đơn hàng.");
                return result;
            }

            // Nhánh "Hợp lệ" -> Hoàn kho
            foreach (var item in order.OrderItems)
            {
                var stock = await _db.InventoryStocks
                    .FirstOrDefaultAsync(s => s.VariantId == item.VariantId);

                int qty = item.Quantity ?? 0;

                if (stock == null)
                {
                    stock = new InventoryStock
                    {
                        ProductId = item.ProductId,
                        VariantId = item.VariantId,
                        QuantityOnHand = qty,
                        QuantityReserved = 0,
                        QuantityAvailable = qty,
                        MinStockLevel = 5,
                        StockStatus = "IN_STOCK",
                        UpdatedAt = DateTime.UtcNow
                    };
                    _db.InventoryStocks.Add(stock);
                }
                else
                {
                    stock.QuantityOnHand = (stock.QuantityOnHand ?? 0) + qty;
                    stock.QuantityAvailable = (stock.QuantityAvailable ?? 0) + qty;
                    stock.UpdatedAt = DateTime.UtcNow;
                }

                // Cập nhật số lượng tồn kho -> Kiểm tra ngưỡng cảnh báo
                CheckThreshold(stock, result);
            }

            await _db.SaveChangesAsync();
            result.Success = true;
            return result;
        }

        // ==========================================================================
        // THÊM 2 HÀM NÀY VÀO CLASS InventoryService HIỆN CÓ CỦA BẠN
        // (đặt sau hàm RestoreStockForOrderAsync, trước hàm private CheckThreshold)
        // Lý do cần thêm: RestoreStockForOrderAsync hoàn kho CẢ ĐƠN, nhưng đổi trả/bảo hành
        // chỉ xử lý MỘT sản phẩm (OrderItem) trong đơn, nên cần hàm thao tác theo variant lẻ.
        // ==========================================================================

        /// <summary>
        /// "Hoàn kho sản phẩm trả lại" — dùng khi khách đổi trả 1 sản phẩm cụ thể (không phải cả đơn)
        /// </summary>
        public async Task<StockCheckResult> RestoreStockForVariantAsync(long variantId, long productId, int quantity)
        {
            var result = new StockCheckResult();

            var stock = await _db.InventoryStocks.FirstOrDefaultAsync(s => s.VariantId == variantId);

            if (stock == null)
            {
                stock = new InventoryStock
                {
                    ProductId = productId,
                    VariantId = variantId,
                    QuantityOnHand = quantity,
                    QuantityReserved = 0,
                    QuantityAvailable = quantity,
                    MinStockLevel = 5,
                    StockStatus = "IN_STOCK",
                    UpdatedAt = DateTime.UtcNow
                };
                _db.InventoryStocks.Add(stock);
            }
            else
            {
                stock.QuantityOnHand = (stock.QuantityOnHand ?? 0) + quantity;
                stock.QuantityAvailable = (stock.QuantityAvailable ?? 0) + quantity;
                stock.UpdatedAt = DateTime.UtcNow;
            }

            CheckThreshold(stock, result);

            await _db.SaveChangesAsync();
            result.Success = true;
            return result;
        }

        /// <summary>
        /// "Xuất kho sản phẩm đổi (nếu có)" — dùng khi khách đổi sang sản phẩm/biến thể khác
        /// </summary>
        public async Task<StockCheckResult> DeductStockForVariantAsync(long variantId, int quantity)
        {
            var result = new StockCheckResult();

            var stock = await _db.InventoryStocks.FirstOrDefaultAsync(s => s.VariantId == variantId);
            int available = stock?.QuantityAvailable ?? 0;

            if (stock == null || available < quantity)
            {
                result.Success = false;
                result.InsufficientItems.Add($"Biến thể #{variantId} - Cần {quantity}, còn {available}");
                return result;
            }

            stock.QuantityOnHand = (stock.QuantityOnHand ?? 0) - quantity;
            stock.QuantityAvailable = (stock.QuantityAvailable ?? 0) - quantity;
            stock.UpdatedAt = DateTime.UtcNow;

            CheckThreshold(stock, result);

            await _db.SaveChangesAsync();
            result.Success = true;
            return result;
        }

        /// <summary>
        /// "Kiểm tra ngưỡng cảnh báo hàng sắp hết" -> "Cảnh báo hàng sắp hết"
        /// (nhánh "Không dưới ngưỡng" -> không cảnh báo, hiển thị kết quả xử lý thành công)
        /// </summary>
        private void CheckThreshold(InventoryStock stock, StockCheckResult result)
        {
            int available = stock.QuantityAvailable ?? 0;
            int min = stock.MinStockLevel ?? 5;

            if (available <= 0)
            {
                stock.StockStatus = "OUT_OF_STOCK";
                result.LowStockWarnings.Add($"Biến thể #{stock.VariantId}: HẾT HÀNG");
            }
            else if (available <= min)
            {
                stock.StockStatus = "LOW_STOCK";
                result.LowStockWarnings.Add(
                    $"Biến thể #{stock.VariantId}: Sắp hết hàng (còn {available}, ngưỡng {min})");
            }
            else
            {
                stock.StockStatus = "IN_STOCK";
            }
        }
    }
}