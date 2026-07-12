namespace LuxeHome.Application.DTOs
{
    public class RevenueReportItem
    {
        public string Period { get; set; } = string.Empty; // VD: "2026-07" hoặc "2026-07-12"
        public decimal Revenue { get; set; }
        public int OrderCount { get; set; }
    }

    public class ProfitReportItem
    {
        public string Period { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public decimal CostOfGoods { get; set; }
        public decimal Profit { get; set; }
    }

    public class BestSellingItem
    {
        public long ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? CategoryName { get; set; }
        public int QuantitySold { get; set; }
        public decimal Revenue { get; set; }
    }

    public class PaymentReportItem
    {
        public string PaymentMethod { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public int Count { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public class SalesReportResponse
    {
        public bool HasData { get; set; }
        public string ReportType { get; set; } = string.Empty; // revenue | profit | best-selling | payment
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? CategorySlug { get; set; }

        public List<RevenueReportItem>? RevenueData { get; set; }
        public List<ProfitReportItem>? ProfitData { get; set; }
        public List<BestSellingItem>? BestSellingData { get; set; }
        public List<PaymentReportItem>? PaymentData { get; set; }

        public decimal? TotalRevenue { get; set; }
        public decimal? TotalProfit { get; set; }
        public int? TotalOrders { get; set; }
    }
}