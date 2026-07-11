namespace LuxeHome.Application.DTOs
{
    public class ApplyPromotionRequest
    {
        public string CouponCode { get; set; } = string.Empty;
        public decimal SubtotalAmount { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal InstallationFee { get; set; }
    }

    public class ApplyPromotionResponse
    {
        public bool IsValid { get; set; }
        public string CouponCode { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;

        public decimal DiscountAmount { get; set; }
        public decimal ShippingDiscount { get; set; }
        public decimal InstallationDiscount { get; set; }

        public decimal FinalAmount { get; set; }
        public string PromotionType { get; set; } = string.Empty;
    }
    public class SavePromotionRequest
{
    public string CouponCode { get; set; } = string.Empty;
}

public class MyPromotionResponse
{
    public long WalletId { get; set; }
    public long PromotionId { get; set; }
    public string CouponCode { get; set; } = string.Empty;
    public string PromotionName { get; set; } = string.Empty;
    public string PromotionType { get; set; } = string.Empty;
    public decimal DiscountValue { get; set; }
    public decimal MinOrderAmount { get; set; }
    public decimal? MaxDiscountAmount { get; set; }

    public bool IsUsable { get; set; }
    public string Message { get; set; } = string.Empty;

    public decimal DiscountAmount { get; set; }
    public decimal ShippingDiscount { get; set; }
    public decimal InstallationDiscount { get; set; }
    public decimal FinalAmount { get; set; }
}
}