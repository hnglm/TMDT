namespace LuxeHome.Application.DTOs
{
    // "Nhập lý do từ chối"
    public class RejectReturnWarrantyDto
    {
        public string ResultNote { get; set; } = string.Empty;
    }

    // "Xuất kho sản phẩm đổi (nếu có)" — chỉ áp dụng khi RequestType = RETURN và khách đổi sản phẩm khác
    public class CompleteReturnWarrantyDto
    {
        public string? ResultNote { get; set; }
        public long? ExchangeVariantId { get; set; }
        public long? ExchangeProductId { get; set; }
        public int? ExchangeQuantity { get; set; }
    }

    public class ReturnWarrantyListItemResponse
    {
        public long Id { get; set; }
        public string? RequestCode { get; set; }
        public string? RequestType { get; set; }
        public long OrderId { get; set; }
        public string? OrderCode { get; set; }
        public long OrderItemId { get; set; }
        public string? ProductName { get; set; }
        public long UserId { get; set; }
        public string? CustomerName { get; set; }
        public string? Reason { get; set; }
        public string? Status { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ReturnWarrantyDetailResponse
    {
        public long Id { get; set; }
        public string? RequestCode { get; set; }
        public string? RequestType { get; set; }
        public long OrderId { get; set; }
        public string? OrderCode { get; set; }
        public long OrderItemId { get; set; }
        public long ProductId { get; set; }
        public long VariantId { get; set; }
        public string? ProductName { get; set; }
        public string? Sku { get; set; }
        public int? Quantity { get; set; }
        public long UserId { get; set; }
        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
        public string? Reason { get; set; }
        public string? Description { get; set; }
        public string? AccountInfo { get; set; }
        public string? ImageUrls { get; set; }
        public decimal? RefundAmount { get; set; }
        public string? Status { get; set; }
        public long? HandledBy { get; set; }
        public string? HandledByName { get; set; }
        public string? ResultNote { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}