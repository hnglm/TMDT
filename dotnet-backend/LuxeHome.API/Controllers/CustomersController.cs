using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LuxeHome.Application.DTOs;
using LuxeHome.Infrastructure.Data;
using LuxeHome.Domain.Entities;
using System.Security.Claims;

namespace LuxeHome.API.Controllers
{
    // =========================================================================
    // Controller này hiện thực đúng sơ đồ "act AD_Xem chi tiết khách hàng"
    // 2 lane: Nhân viên bán hàng | Hệ thống
    // Chỉ Sales và Admin được thao tác (khách hàng không tự xem hồ sơ CRM của mình ở đây)
    // =========================================================================
    [Authorize(Roles = "ADMIN,SALES_STAFF")]
    [Route("api/[controller]")]
    [ApiController]
    public class CustomersController : ControllerBase
    {
        private readonly LuxeHomeDbContext _db;

        public CustomersController(LuxeHomeDbContext db)
        {
            _db = db;
        }

        // "Xem danh sách khách hàng"
        [HttpGet]
        public async Task<IActionResult> GetCustomers()
        {
            var customers = await _db.Users
                .Include(u => u.Role)
                .Where(u => u.Role != null && u.Role.RoleCode == "CUSTOMER")
                .OrderByDescending(u => u.Id)
                .Select(u => new CustomerListItemResponse
                {
                    Id = u.Id,
                    FullName = u.FullName ?? "Khách hàng",
                    Email = u.Email,
                    Phone = u.Phone ?? "Chưa cập nhật",
                    Status = u.Status ?? "ACTIVE",
                    CreatedAt = u.CreatedAt.HasValue ? u.CreatedAt.Value.ToString("yyyy-MM-dd") : "",
                    TotalOrders = u.Orders.Count,
                    TotalSpent = u.Orders
                        .Where(o => o.OrderStatus == "COMPLETED")
                        .Sum(o => o.FinalAmount ?? 0),
                    LastOrderDate = u.Orders
                        .OrderByDescending(o => o.Id)
                        .Select(o => o.ConfirmedAt)
                        .FirstOrDefault() != null
                            ? u.Orders.OrderByDescending(o => o.Id).Select(o => o.ConfirmedAt).FirstOrDefault()!.Value.ToString("yyyy-MM-dd")
                            : null
                })
                .ToListAsync();

            return Ok(customers);
        }

        // "Chọn khách hàng cần xem" -> "Xem chi tiết khách hàng"
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCustomerDetail(long id)
        {
            var customer = await _db.Users
                .Include(u => u.Role)
                .Where(u => u.Id == id && u.Role != null && u.Role.RoleCode == "CUSTOMER")
                .Select(u => new CustomerDetailResponse
                {
                    Id = u.Id,
                    FullName = u.FullName ?? "Khách hàng",
                    Email = u.Email,
                    Phone = u.Phone ?? "Chưa cập nhật",
                    Status = u.Status ?? "ACTIVE",
                    CreatedAt = u.CreatedAt.HasValue ? u.CreatedAt.Value.ToString("yyyy-MM-dd") : "",
                    LastLoginAt = u.LastLoginAt.HasValue ? u.LastLoginAt.Value.ToString("yyyy-MM-dd HH:mm") : null
                })
                .FirstOrDefaultAsync();

            if (customer == null) return NotFound(new { message = "Không tìm thấy khách hàng." });

            return Ok(customer);
        }

        // "Xem lịch sử mua hàng"
        [HttpGet("{id}/orders")]
        public async Task<IActionResult> GetCustomerOrders(long id)
        {
            var orders = await _db.Orders
                .Where(o => o.UserId == id)
                .OrderByDescending(o => o.Id)
                .Select(o => new
                {
                    o.Id,
                    o.OrderCode,
                    o.OrderStatus,
                    o.PaymentStatus,
                    o.FinalAmount,
                    o.ConfirmedAt,
                    ItemCount = o.OrderItems.Count
                })
                .ToListAsync();

            return Ok(orders);
        }

        // "Theo dõi phản hồi khách hàng" — xem toàn bộ lịch sử chăm sóc trước đó của khách
        [HttpGet("{id}/care-logs")]
        public async Task<IActionResult> GetCareLogs(long id)
        {
            var logs = await _db.CustomerCareLogs
                .Include(c => c.Staff)
                .Where(c => c.CustomerId == id)
                .OrderByDescending(c => c.Id)
                .Select(c => new CareLogResponse
                {
                    Id = c.Id,
                    CustomerId = c.CustomerId,
                    StaffId = c.StaffId,
                    StaffName = c.Staff != null ? c.Staff.FullName : null,
                    NeedNote = c.NeedNote,
                    CareType = c.CareType,
                    CareMessage = c.CareMessage,
                    Status = c.Status,
                    ResponseResult = c.ResponseResult,
                    NextFollowUpAt = c.NextFollowUpAt,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();

            return Ok(logs);
        }

        // NHÁNH "Có phát sinh vấn đề":
        // "Ghi chú nhu cầu khách hàng" -> "Gửi thông báo chăm sóc khách hàng"
        // -> HỆ THỐNG: "Ghi nhận lịch sử chăm sóc"
        [HttpPost("{id}/care-logs")]
        public async Task<IActionResult> CreateCareLog(long id, [FromBody] CreateCareLogDto dto)
        {
            var customerExists = await _db.Users.AnyAsync(u => u.Id == id);
            if (!customerExists) return NotFound(new { message = "Không tìm thấy khách hàng." });

            if (string.IsNullOrWhiteSpace(dto.CareMessage))
                return BadRequest(new { message = "Vui lòng nhập nội dung thông báo chăm sóc." });

            var staffIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(staffIdClaim))
                return Unauthorized(new { message = "Không xác định được nhân viên thực hiện." });

            var careLog = new CustomerCareLog
            {
                CustomerId = id,
                StaffId = long.Parse(staffIdClaim),
                NeedNote = dto.NeedNote,
                CareType = dto.CareType,
                CareMessage = dto.CareMessage,
                Status = "WAITING", // đang theo dõi phản hồi
                CreatedAt = DateTime.UtcNow
            };

            _db.CustomerCareLogs.Add(careLog);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Đã ghi chú nhu cầu và gửi thông báo chăm sóc khách hàng.",
                careLogId = careLog.Id,
                status = careLog.Status
            });
        }

        // Nhánh "Có phản hồi" -> "Cập nhật kết quả chăm sóc"
        [HttpPut("care-logs/{careLogId}/response")]
        public async Task<IActionResult> UpdateCareResponse(long careLogId, [FromBody] UpdateCareResponseDto dto)
        {
            var careLog = await _db.CustomerCareLogs.FindAsync(careLogId);
            if (careLog == null) return NotFound(new { message = "Không tìm thấy nhật ký chăm sóc." });

            if (string.IsNullOrWhiteSpace(dto.ResponseResult))
                return BadRequest(new { message = "Vui lòng nhập kết quả chăm sóc." });

            careLog.Status = "RESPONDED";
            careLog.ResponseResult = dto.ResponseResult;
            careLog.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Đã cập nhật kết quả chăm sóc khách hàng.",
                status = careLog.Status
            });
        }

        // Nhánh "Không phản hồi" -> "Đánh dấu chờ phản hồi / lên lịch chăm sóc lại"
        [HttpPut("care-logs/{careLogId}/schedule")]
        public async Task<IActionResult> ScheduleFollowUp(long careLogId, [FromBody] ScheduleFollowUpDto dto)
        {
            var careLog = await _db.CustomerCareLogs.FindAsync(careLogId);
            if (careLog == null) return NotFound(new { message = "Không tìm thấy nhật ký chăm sóc." });

            careLog.Status = "SCHEDULED";
            careLog.NextFollowUpAt = dto.NextFollowUpAt;
            careLog.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = dto.NextFollowUpAt.HasValue
                    ? $"Đã lên lịch chăm sóc lại vào {dto.NextFollowUpAt.Value:dd/MM/yyyy}."
                    : "Đã đánh dấu chờ phản hồi từ khách hàng.",
                status = careLog.Status
            });
        }
    }
}