using LuxeHome.Application.DTOs;
using LuxeHome.Domain.Entities;
using LuxeHome.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
namespace LuxeHome.Application.Services
{
    public class OrderService
    {
        private readonly LuxeHomeDbContext _db;

        public OrderService(LuxeHomeDbContext db)
        {
            _db = db;
        }

        public async Task<Order> CreateOrderAsync(
            CreateOrderDto dto,
            long userId,
            string orderCode,
            string paymentStatus = "UNPAID",
            string orderStatus = "PENDING")
        {
            if (dto == null || dto.Items == null || dto.Items.Count == 0)
                throw new Exception("Đơn hàng trống. Vui lòng chọn sản phẩm.");

            var userExists = await _db.Users.AnyAsync(u => u.Id == userId);

            if (!userExists)
                throw new Exception("Không tìm thấy người dùng trong database.");

            var orderItems = new List<OrderItem>();
            decimal subtotal = 0;

            foreach (var it in dto.Items)
            {
                var itemData = await _db.ProductVariants
                    .Where(v => v.ProductId == it.ProductId)
                    .OrderByDescending(v => v.Id == it.VariantId)
                    .Select(v => new
                    {
                        ProductId = v.ProductId,
                        VariantId = v.Id,
                        ProductName = v.Product.ProductName,
                        Sku = v.Sku,
                        CurrentPrice = v.CurrentPrice,
                        WarrantyMonths = v.Product.WarrantyMonths
                    })
                    .FirstOrDefaultAsync();

                if (itemData == null)
                    continue;

                decimal price = itemData.CurrentPrice ?? 0;
                int qty = it.Quantity > 0 ? it.Quantity : 1;
                decimal lineTotal = price * qty;

                subtotal += lineTotal;

                orderItems.Add(new OrderItem
                {
                    ProductId = itemData.ProductId,
                    VariantId = itemData.VariantId,
                    ProductName = itemData.ProductName,
                    Sku = itemData.Sku,
                    Quantity = qty,
                    OriginalPrice = price,
                    SellingPrice = price,
                    DiscountAmount = 0,
                    TotalPrice = lineTotal,
                    WarrantyMonths = itemData.WarrantyMonths
                });
            }

            if (orderItems.Count == 0)
                throw new Exception("Không tìm thấy sản phẩm hợp lệ trong đơn hàng.");

            decimal finalAmount = dto.TotalAmount > 0 ? dto.TotalAmount : subtotal;

            var order = new Order
            {
                OrderCode = orderCode,
                UserId = userId,

                ReceiverName = string.IsNullOrWhiteSpace(dto.ReceiverName) ? "Khách hàng" : dto.ReceiverName,
                ReceiverPhone = string.IsNullOrWhiteSpace(dto.ReceiverPhone) ? "0000000000" : dto.ReceiverPhone,
                ShippingAddress = string.IsNullOrWhiteSpace(dto.ShippingAddress) ? "Chưa cập nhật" : dto.ShippingAddress,
                CustomerNote = dto.CustomerNote,
                CouponCode = dto.CouponCode,

                SubtotalAmount = subtotal,
                DiscountAmount = 0,
                ShippingFee = finalAmount - subtotal > 0 ? finalAmount - subtotal : 0,
                FinalAmount = finalAmount,

                OrderStatus = orderStatus,
                PaymentStatus = paymentStatus,
                ShippingStatus = "PENDING",

                OrderItems = orderItems
            };

            _db.Orders.Add(order);
            await _db.SaveChangesAsync();

            return order;
        }

        public async Task<List<object>> GetMyOrdersAsync(long userId)
        {
            var orders = await _db.Orders
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.Id)
                .Select(o => new
                {
                    o.Id,
                    o.OrderCode,
                    o.UserId,
                    o.ReceiverName,
                    o.ReceiverPhone,
                    o.ShippingAddress,
                    o.SubtotalAmount,
                    o.DiscountAmount,
                    o.ShippingFee,
                    o.FinalAmount,
                    o.OrderStatus,
                    o.PaymentStatus,
                    o.ShippingStatus,
                    o.CouponCode,
                    o.CustomerNote,
                    o.ConfirmedAt,
                    HasReturnRequest = _db.ReturnWarrantyRequests.Any(r => r.OrderId == o.Id),
                    HasReview = _db.ProductReviews.Any(r => r.OrderId == o.Id && r.UserId == userId),
                    Items = o.OrderItems.Select(i => new
                    {
                        i.ProductId,
                        i.VariantId,
                        i.ProductName,
                        i.Sku,
                        i.Quantity,
                        i.OriginalPrice,
                        i.SellingPrice,
                        i.TotalPrice
                    }).ToList()
                })
                .ToListAsync<object>();

            return orders;
        }
        // Trong OrderService.cs
        public async Task CancelOrderAsync(string orderId, long userId, string reason)
{
    // 1. Tìm đơn hàng (lưu ý: orderId có thể là Id số hoặc OrderCode chuỗi)
    // Giả sử orderId là chuỗi OrderCode (LH...) như bạn tạo khi đặt hàng
    var order = await _db.Orders
        .FirstOrDefaultAsync(o => o.OrderCode == orderId && o.UserId == userId);

    if (order == null)
        throw new Exception("Không tìm thấy đơn hàng hoặc đơn hàng không thuộc về bạn.");

    // 2. Kiểm tra trạng thái đơn hàng
    // Chỉ cho phép hủy nếu trạng thái là PENDING
    if (order.OrderStatus != "PENDING")
        throw new Exception("Đơn hàng đã được xử lý, không thể hủy.");

    // 3. Cập nhật trạng thái
    order.OrderStatus = "CANCELLED";
    
    // 4. Lưu lý do hủy
    // Bạn có thể lưu vào CustomerNote hoặc tạo một bảng log riêng.
    // Nếu muốn lưu vào bảng Order, bạn có thể nối vào CustomerNote:
    order.CustomerNote = $"[Đã hủy ngày {DateTime.Now}] Lý do: {reason}. " + order.CustomerNote;

    // 5. Lưu thay đổi
    await _db.SaveChangesAsync();
}
public async Task CreateReturnRequestAsync(string orderId, long userId, ReturnWarrantyDto dto)
{
    if (dto == null)
        throw new Exception("Dữ liệu yêu cầu hoàn hàng không hợp lệ.");

    if (string.IsNullOrWhiteSpace(dto.Reason))
        throw new Exception("Vui lòng chọn hoặc nhập lý do hoàn hàng / bảo hành.");

    var order = await _db.Orders
        .Include(o => o.OrderItems)
        .FirstOrDefaultAsync(o => o.OrderCode == orderId && o.UserId == userId);

    if (order == null)
        throw new Exception($"Không tìm thấy đơn hàng {orderId} của user {userId}.");

    var orderStatus = (order.OrderStatus ?? "").Trim().ToUpper();
    var shippingStatus = (order.ShippingStatus ?? "").Trim().ToUpper();

    if (orderStatus != "COMPLETED")
        throw new Exception($"Đơn hàng chưa hoàn tất. Trạng thái hiện tại: {order.OrderStatus}");

    if (shippingStatus != "DELIVERED")
        throw new Exception($"Đơn hàng chưa giao thành công. Trạng thái giao hàng hiện tại: {order.ShippingStatus}");
    var alreadyRequested = await _db.ReturnWarrantyRequests
    .AnyAsync(r => r.OrderId == order.Id);

if (alreadyRequested)
    throw new Exception("Đơn hàng này đã gửi yêu cầu hoàn hàng / bảo hành rồi.");
    var firstItem = order.OrderItems.FirstOrDefault();

    if (firstItem == null)
        throw new Exception("Đơn hàng này chưa có sản phẩm chi tiết nên không thể tạo yêu cầu hoàn hàng.");

    var request = new ReturnWarrantyRequest
    {
        OrderId = order.Id,
        OrderItemId = firstItem.Id,
        UserId = userId,

        RequestCode = "RW" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
        RequestType = "RETURN",

        Reason = dto.Reason,
        AccountInfo = dto.AccountInfo,

        RefundAmount = firstItem.TotalPrice,
        Status = "PENDING",
        CreatedAt = DateTime.UtcNow.AddHours(7),

        ImageUrl = null,
        ResultNote = null
    };

    _db.ReturnWarrantyRequests.Add(request);
    await _db.SaveChangesAsync();
}
public async Task AddReviewAsync(string orderId, long userId, AddReviewDto dto)
{
    if (dto == null)
        throw new Exception("Dữ liệu đánh giá không hợp lệ.");

    if (dto.ProductId <= 0)
        throw new Exception("Không tìm thấy sản phẩm để đánh giá.");

    if (dto.Rating < 1 || dto.Rating > 5)
        throw new Exception("Số sao đánh giá phải từ 1 đến 5.");

    if (string.IsNullOrWhiteSpace(dto.Comment))
        throw new Exception("Vui lòng nhập nội dung đánh giá.");

    var order = await _db.Orders
        .Include(o => o.OrderItems)
        .FirstOrDefaultAsync(o => o.OrderCode == orderId && o.UserId == userId);

    if (order == null)
        throw new Exception("Không tìm thấy đơn hàng hoặc đơn hàng không thuộc về bạn.");

    var orderStatus = (order.OrderStatus ?? "").Trim().ToUpper();

    if (orderStatus != "COMPLETED")
        throw new Exception("Chỉ đơn hàng đã hoàn tất mới được đánh giá.");

    var hasProductInOrder = order.OrderItems.Any(i => i.ProductId == dto.ProductId);

    if (!hasProductInOrder)
        throw new Exception("Sản phẩm này không thuộc đơn hàng nên không thể đánh giá.");

    var alreadyReviewed = await _db.ProductReviews
        .AnyAsync(r => r.OrderId == order.Id && r.ProductId == dto.ProductId && r.UserId == userId);

    if (alreadyReviewed)
        throw new Exception("Bạn đã đánh giá sản phẩm này trong đơn hàng rồi.");

    var review = new ProductReview
    {
        OrderId = order.Id,
        ProductId = dto.ProductId,
        UserId = userId,
        Rating = dto.Rating,
        Comment = dto.Comment,
        //CreatedAt = DateTime.UtcNow.AddHours(7),
        ImageUrl = dto.ImageUrl
    };

    _db.ProductReviews.Add(review);
    await _db.SaveChangesAsync();
}
public async Task<object> GetMyReviewAsync(string orderId, long userId)
{
    var order = await _db.Orders
        .FirstOrDefaultAsync(o => o.OrderCode == orderId && o.UserId == userId);

    if (order == null)
        throw new Exception("Không tìm thấy đơn hàng hoặc đơn hàng không thuộc về bạn.");

    var review = await _db.ProductReviews
        .FirstOrDefaultAsync(r => r.OrderId == order.Id && r.UserId == userId);

    if (review == null)
        throw new Exception("Bạn chưa đánh giá đơn hàng này.");

    return new
    {
        review.Id,
        review.OrderId,
        review.ProductId,
        review.Rating,
        Comment = review.Comment,
        ImageUrl = review.ImageUrl,

        // Tạm thời cho sửa luôn vì ProductReview chưa có cột ngày tạo
        CanEdit = true,
        EditDeadline = (DateTime?)null
    };
}
public async Task UpdateReviewAsync(string orderId, long userId, AddReviewDto dto)
{
    if (dto == null)
        throw new Exception("Dữ liệu đánh giá không hợp lệ.");

    if (dto.Rating < 1 || dto.Rating > 5)
        throw new Exception("Số sao đánh giá phải từ 1 đến 5.");

    if (string.IsNullOrWhiteSpace(dto.Comment))
        throw new Exception("Vui lòng nhập nội dung đánh giá.");

    var order = await _db.Orders
        .FirstOrDefaultAsync(o => o.OrderCode == orderId && o.UserId == userId);

    if (order == null)
        throw new Exception("Không tìm thấy đơn hàng hoặc đơn hàng không thuộc về bạn.");

    var review = await _db.ProductReviews
        .FirstOrDefaultAsync(r => r.OrderId == order.Id && r.UserId == userId);

    if (review == null)
        throw new Exception("Bạn chưa đánh giá đơn hàng này.");

    review.Rating = dto.Rating;
    review.Comment = dto.Comment;
    if (!string.IsNullOrWhiteSpace(dto.ImageUrl))
    {
        review.ImageUrl = dto.ImageUrl;
    }

    await _db.SaveChangesAsync();
}
    }
}