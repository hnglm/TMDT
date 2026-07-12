using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LuxeHome.Application.DTOs;
using LuxeHome.Infrastructure.Data;
using ClosedXML.Excel;

namespace LuxeHome.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "ADMIN,MANAGER")]
    public class ReportController : ControllerBase
    {
        private readonly LuxeHomeDbContext _db;

        public ReportController(LuxeHomeDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetReport(
            [FromQuery] string reportType = "revenue",
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string? categorySlug = null)
        {
            var response = await BuildReport(reportType, fromDate, toDate, categorySlug);
            return Ok(response);
        }

        // "Xuất báo cáo ra Excel" -> "Tạo file Excel theo báo cáo đang xem" -> "Trả file cho người dùng"
        [HttpGet("export")]
        public async Task<IActionResult> ExportReport(
            [FromQuery] string reportType = "revenue",
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string? categorySlug = null)
        {
            var response = await BuildReport(reportType, fromDate, toDate, categorySlug);

            using var workbook = new XLWorkbook();
            var sheetName = reportType switch
            {
                "profit" => "Loi nhuan",
                "best-selling" => "San pham ban chay",
                "payment" => "Thanh toan",
                _ => "Doanh thu"
            };
            var ws = workbook.Worksheets.Add(sheetName);

            switch (reportType.ToLower())
            {
                case "profit":
                    ws.Cell(1, 1).Value = "Ngày";
                    ws.Cell(1, 2).Value = "Doanh thu";
                    ws.Cell(1, 3).Value = "Giá vốn";
                    ws.Cell(1, 4).Value = "Lợi nhuận";
                    var pRow = 2;
                    foreach (var item in response.ProfitData ?? new())
                    {
                        ws.Cell(pRow, 1).Value = item.Period;
                        ws.Cell(pRow, 2).Value = item.Revenue;
                        ws.Cell(pRow, 3).Value = item.CostOfGoods;
                        ws.Cell(pRow, 4).Value = item.Profit;
                        pRow++;
                    }
                    break;

                case "best-selling":
                    ws.Cell(1, 1).Value = "Sản phẩm";
                    ws.Cell(1, 2).Value = "Danh mục";
                    ws.Cell(1, 3).Value = "Số lượng bán";
                    ws.Cell(1, 4).Value = "Doanh thu";
                    var bRow = 2;
                    foreach (var item in response.BestSellingData ?? new())
                    {
                        ws.Cell(bRow, 1).Value = item.ProductName;
                        ws.Cell(bRow, 2).Value = item.CategoryName ?? "";
                        ws.Cell(bRow, 3).Value = item.QuantitySold;
                        ws.Cell(bRow, 4).Value = item.Revenue;
                        bRow++;
                    }
                    break;

                case "payment":
                    ws.Cell(1, 1).Value = "Phương thức";
                    ws.Cell(1, 2).Value = "Trạng thái";
                    ws.Cell(1, 3).Value = "Số lượng";
                    ws.Cell(1, 4).Value = "Tổng tiền";
                    var payRow = 2;
                    foreach (var item in response.PaymentData ?? new())
                    {
                        ws.Cell(payRow, 1).Value = item.PaymentMethod;
                        ws.Cell(payRow, 2).Value = item.PaymentStatus;
                        ws.Cell(payRow, 3).Value = item.Count;
                        ws.Cell(payRow, 4).Value = item.TotalAmount;
                        payRow++;
                    }
                    break;

                default: // revenue
                    ws.Cell(1, 1).Value = "Ngày";
                    ws.Cell(1, 2).Value = "Doanh thu";
                    ws.Cell(1, 3).Value = "Số đơn";
                    var rRow = 2;
                    foreach (var item in response.RevenueData ?? new())
                    {
                        ws.Cell(rRow, 1).Value = item.Period;
                        ws.Cell(rRow, 2).Value = item.Revenue;
                        ws.Cell(rRow, 3).Value = item.OrderCount;
                        rRow++;
                    }
                    break;
            }

            ws.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            stream.Position = 0;

            var fileName = $"BaoCao_{reportType}_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
            return File(stream.ToArray(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName);
        }

        // ==========================================================================
        // THÊM ACTION NÀY VÀO ReportController.cs HIỆN CÓ (đặt trước hàm private BuildReport)
        // ==========================================================================

        // "Tổng quan nhanh" — 6 tháng gần nhất, dữ liệu THẬT từ Orders (không hard-code)
        [HttpGet("monthly-overview")]
        public async Task<IActionResult> GetMonthlyOverview()
        {
            var now = DateTime.UtcNow;

            // 6 mốc đầu tháng, từ 5 tháng trước tới tháng hiện tại
            var monthStarts = Enumerable.Range(0, 6)
                .Select(i => new DateTime(now.Year, now.Month, 1).AddMonths(-5 + i))
                .ToList();

            var result = new List<object>();

            foreach (var monthStart in monthStarts)
            {
                var monthEnd = monthStart.AddMonths(1).AddTicks(-1);

                var ordersInMonth = await _db.Orders
                    .Include(o => o.OrderItems)
                    .Where(o => o.ConfirmedAt != null && o.ConfirmedAt >= monthStart && o.ConfirmedAt <= monthEnd)
                    .Where(o => o.OrderStatus != "CANCELLED" && o.OrderStatus != "PENDING")
                    .ToListAsync();

                var revenue = ordersInMonth.Sum(o => o.FinalAmount ?? 0);
                var soldCount = ordersInMonth.SelectMany(o => o.OrderItems).Sum(i => i.Quantity ?? 0);

                result.Add(new
                {
                    name = $"Tháng {monthStart.Month:D2}",
                    doanhThu = revenue,
                    banRa = soldCount
                });
            }

            return Ok(result);
        }

        // ==== Hàm dùng chung cho cả GetReport và ExportReport ====
        private async Task<SalesReportResponse> BuildReport(
            string reportType, DateTime? fromDate, DateTime? toDate, string? categorySlug)
        {
            var from = fromDate ?? DateTime.UtcNow.AddDays(-30).Date;
            var to = toDate ?? DateTime.UtcNow.Date.AddDays(1).AddTicks(-1);

            var response = new SalesReportResponse
            {
                ReportType = reportType,
                FromDate = from,
                ToDate = to,
                CategorySlug = categorySlug
            };

            switch (reportType.ToLower())
            {
                case "profit":
                    await BuildProfitReport(response, from, to, categorySlug);
                    break;
                case "best-selling":
                    await BuildBestSellingReport(response, from, to, categorySlug);
                    break;
                case "payment":
                    await BuildPaymentReport(response, from, to);
                    break;
                case "revenue":
                default:
                    await BuildRevenueReport(response, from, to, categorySlug);
                    break;
            }

            return response;
        }

        // ==========================================================================
        // THAY THẾ hàm private BuildRevenueReport HIỆN CÓ trong ReportController.cs bằng bản này
        // Lỗi gốc: gọi g.Key.ToString("yyyy-MM-dd") NGAY TRONG câu LINQ chạy trên DB
        // -> Npgsql không dịch được DateTime.ToString(format) thành SQL -> crash 500
        // Cách sửa: GroupBy/Sum/Count chạy trên DB trước (không có ToString),
        // rồi mới định dạng chuỗi ngày ở phía C# sau khi đã ToListAsync() xong.
        // ==========================================================================

        private async Task BuildRevenueReport(SalesReportResponse response, DateTime from, DateTime to, string? categorySlug)
        {
            var query = _db.Orders
                .Where(o => o.ConfirmedAt != null && o.ConfirmedAt >= from && o.ConfirmedAt <= to)
                .Where(o => o.OrderStatus != "CANCELLED" && o.OrderStatus != "PENDING");

            if (!string.IsNullOrEmpty(categorySlug) && categorySlug != "all")
            {
                query = query.Where(o => o.OrderItems.Any(i =>
                    i.Product != null && i.Product.Category != null && i.Product.Category.Slug == categorySlug));
            }

            // BƯỚC 1: Nhóm + tính tổng trên DATABASE (chỉ dùng DateTime.Date, KHÔNG ToString ở đây)
            var grouped = await query
                .GroupBy(o => o.ConfirmedAt!.Value.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    Revenue = g.Sum(o => o.FinalAmount ?? 0),
                    OrderCount = g.Count()
                })
                .OrderBy(x => x.Date)
                .ToListAsync();

            // BƯỚC 2: Định dạng chuỗi ngày ở PHÍA C# (client-side), sau khi dữ liệu đã về
            var items = grouped
                .Select(x => new RevenueReportItem
                {
                    Period = x.Date.ToString("yyyy-MM-dd"),
                    Revenue = x.Revenue,
                    OrderCount = x.OrderCount
                })
                .ToList();

            response.RevenueData = items;
            response.HasData = items.Count > 0;
            response.TotalRevenue = items.Sum(x => x.Revenue);
            response.TotalOrders = items.Sum(x => x.OrderCount);
        }

        private async Task BuildProfitReport(SalesReportResponse response, DateTime from, DateTime to, string? categorySlug)
        {
            var itemsQuery = _db.OrderItems
                .Include(i => i.Order)
                .Include(i => i.Variant)
                .Include(i => i.Product).ThenInclude(p => p!.Category)
                .Where(i => i.Order.ConfirmedAt != null && i.Order.ConfirmedAt >= from && i.Order.ConfirmedAt <= to)
                .Where(i => i.Order.OrderStatus != "CANCELLED" && i.Order.OrderStatus != "PENDING");

            if (!string.IsNullOrEmpty(categorySlug) && categorySlug != "all")
            {
                itemsQuery = itemsQuery.Where(i => i.Product != null && i.Product.Category != null && i.Product.Category.Slug == categorySlug);
            }

            var items = await itemsQuery
                .Select(i => new
                {
                    Date = i.Order.ConfirmedAt!.Value.Date,
                    Revenue = i.TotalPrice ?? 0,
                    Cost = (i.Variant != null ? (i.Variant.CostPrice ?? 0) : 0) * (i.Quantity ?? 1)
                })
                .ToListAsync();

            var grouped = items
                .GroupBy(x => x.Date)
                .Select(g => new ProfitReportItem
                {
                    Period = g.Key.ToString("yyyy-MM-dd"),
                    Revenue = g.Sum(x => x.Revenue),
                    CostOfGoods = g.Sum(x => x.Cost),
                    Profit = g.Sum(x => x.Revenue) - g.Sum(x => x.Cost)
                })
                .OrderBy(x => x.Period)
                .ToList();

            response.ProfitData = grouped;
            response.HasData = grouped.Count > 0;
            response.TotalRevenue = grouped.Sum(x => x.Revenue);
            response.TotalProfit = grouped.Sum(x => x.Profit);
        }

        private async Task BuildBestSellingReport(SalesReportResponse response, DateTime from, DateTime to, string? categorySlug)
        {
            var itemsQuery = _db.OrderItems
                .Include(i => i.Order)
                .Include(i => i.Product).ThenInclude(p => p!.Category)
                .Where(i => i.Order.ConfirmedAt != null && i.Order.ConfirmedAt >= from && i.Order.ConfirmedAt <= to)
                .Where(i => i.Order.OrderStatus != "CANCELLED" && i.Order.OrderStatus != "PENDING");

            if (!string.IsNullOrEmpty(categorySlug) && categorySlug != "all")
            {
                itemsQuery = itemsQuery.Where(i => i.Product != null && i.Product.Category != null && i.Product.Category.Slug == categorySlug);
            }

            var grouped = await itemsQuery
                .GroupBy(i => new { i.ProductId, i.ProductName, CategoryName = i.Product != null && i.Product.Category != null ? i.Product.Category.CategoryName : null })
                .Select(g => new BestSellingItem
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.ProductName ?? "",
                    CategoryName = g.Key.CategoryName,
                    QuantitySold = g.Sum(x => x.Quantity ?? 0),
                    Revenue = g.Sum(x => x.TotalPrice ?? 0)
                })
                .OrderByDescending(x => x.QuantitySold)
                .Take(20)
                .ToListAsync();

            response.BestSellingData = grouped;
            response.HasData = grouped.Count > 0;
        }

        private async Task BuildPaymentReport(SalesReportResponse response, DateTime from, DateTime to)
        {
            var grouped = await _db.Payments
                .Where(p => p.PaidAt != null && p.PaidAt >= from && p.PaidAt <= to)
                .GroupBy(p => new { p.PaymentMethod, p.PaymentStatus })
                .Select(g => new PaymentReportItem
                {
                    PaymentMethod = g.Key.PaymentMethod ?? "N/A",
                    PaymentStatus = g.Key.PaymentStatus ?? "N/A",
                    Count = g.Count(),
                    TotalAmount = g.Sum(x => x.Amount ?? 0)
                })
                .OrderByDescending(x => x.TotalAmount)
                .ToListAsync();

            response.PaymentData = grouped;
            response.HasData = grouped.Count > 0;
            response.TotalRevenue = grouped.Sum(x => x.TotalAmount);
        }
    }
}