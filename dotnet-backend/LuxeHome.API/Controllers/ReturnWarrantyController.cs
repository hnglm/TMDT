using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LuxeHome.Application.DTOs;
using LuxeHome.Application.Services;
using LuxeHome.Infrastructure.Data;
using System.Security.Claims;

namespace LuxeHome.API.Controllers
{
    // =========================================================================
    // Controller này xử lý sơ đồ "act AD_Tiếp nhận yêu cầu đổi trả / bảo hành"
    // Việc TẠO yêu cầu (khách hàng gửi) đã có sẵn ở OrdersController.CreateReturnWarranty
    // -> OrderService.CreateReturnRequestAsync. Controller này chỉ xử lý phần
    // NHÂN VIÊN xem/duyệt/từ chối/hoàn tất các yêu cầu đã được tạo.
    //
    // Trạng thái (Status): PENDING -> PROCESSING -> COMPLETED / REJECTED
    // RequestType: hiện tại chỉ có "RETURN" được tạo qua luồng khách hàng.
    // =========================================================================
    [Route("api/[controller]")]
    [ApiController]
    public class ReturnWarrantyController : ControllerBase
    {
        private readonly LuxeHomeDbContext _db;
        private readonly InventoryService _inventoryService;

        public ReturnWarrantyController(LuxeHomeDbContext db, InventoryService inventoryService)
        {
            _db = db;
            _inventoryService = inventoryService;
        }

        // "Xem danh sách yêu cầu đổi trả/bảo hành"
        // Sales chỉ thấy RETURN, Kho chỉ thấy WARRANTY, Admin thấy tất cả
        [Authorize(Roles = "ADMIN,SALES_STAFF,WAREHOUSE_STAFF")]
        [HttpGet]
        public async Task<IActionResult> GetRequests()
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

            var query = _db.ReturnWarrantyRequests
                .Include(r => r.Order)
                .Include(r => r.OrderItem)
                .Include(r => r.User)
                .AsQueryable();

            if (role == "SALES_STAFF")
                query = query.Where(r => r.RequestType == "RETURN");
            else if (role == "WAREHOUSE_STAFF")
                query = query.Where(r => r.RequestType == "WARRANTY");

            var requests = await query
                .OrderByDescending(r => r.Id)
                .Select(r => new ReturnWarrantyListItemResponse
                {
                    Id = r.Id,
                    RequestCode = r.RequestCode,
                    RequestType = r.RequestType,
                    OrderId = r.OrderId,
                    OrderCode = r.Order.OrderCode,
                    OrderItemId = r.OrderItemId,
                    ProductName = r.OrderItem.ProductName,
                    UserId = r.UserId,
                    CustomerName = r.User.FullName,
                    Reason = r.Reason,
                    Status = r.Status,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return Ok(requests);
        }

        // "Chọn yêu cầu cần xử lý"
        [Authorize(Roles = "ADMIN,SALES_STAFF,WAREHOUSE_STAFF")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetRequestDetail(long id)
        {
            var r = await _db.ReturnWarrantyRequests
                .Include(x => x.Order)
                .Include(x => x.OrderItem)
                .Include(x => x.User)
                .Include(x => x.HandledByNavigation)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (r == null) return NotFound(new { message = "Không tìm thấy yêu cầu." });

            var detail = new ReturnWarrantyDetailResponse
            {
                Id = r.Id,
                RequestCode = r.RequestCode,
                RequestType = r.RequestType,
                OrderId = r.OrderId,
                OrderCode = r.Order.OrderCode,
                OrderItemId = r.OrderItemId,
                ProductId = r.OrderItem.ProductId,
                VariantId = r.OrderItem.VariantId,
                ProductName = r.OrderItem.ProductName,
                Sku = r.OrderItem.Sku,
                Quantity = r.OrderItem.Quantity,
                UserId = r.UserId,
                CustomerName = r.User.FullName,
                CustomerPhone = r.User.Phone,
                Reason = r.Reason,
                Description = r.Description,
                AccountInfo = r.AccountInfo,
                ImageUrls = r.ImageUrls,
                RefundAmount = r.RefundAmount,
                Status = r.Status,
                HandledBy = r.HandledBy,
                HandledByName = r.HandledByNavigation != null ? r.HandledByNavigation.FullName : null,
                ResultNote = r.ResultNote,
                CreatedAt = r.CreatedAt
            };

            return Ok(detail);
        }

        // "Tiếp nhận yêu cầu đổi trả" (Sales) / "Tiếp nhận yêu cầu bảo hành" (Kho)
        // -> "Kiểm tra điều kiện" -> Nhánh "Đủ điều kiện" -> "Chấp nhận yêu cầu"
        // -> HỆ THỐNG: Cập nhật trạng thái = "Đang xử lý"
        [Authorize(Roles = "ADMIN,SALES_STAFF,WAREHOUSE_STAFF")]
        [HttpPut("{id}/accept")]
        public async Task<IActionResult> AcceptRequest(long id)
        {
            var r = await _db.ReturnWarrantyRequests.FindAsync(id);
            if (r == null) return NotFound(new { message = "Không tìm thấy yêu cầu." });

            if (r.Status != "PENDING")
                return BadRequest(new { message = "Yêu cầu này đã được xử lý trước đó." });

            var staffIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            r.HandledBy = string.IsNullOrEmpty(staffIdClaim) ? null : long.Parse(staffIdClaim);
            r.Status = "PROCESSING";

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Đã chấp nhận yêu cầu, chuyển sang xử lý.",
                status = r.Status
            });
        }

        // Nhánh "Không đủ điều kiện" -> "Từ chối yêu cầu" -> "Nhập lý do từ chối"
        // -> HỆ THỐNG: Cập nhật trạng thái = "Bị từ chối"
        [Authorize(Roles = "ADMIN,SALES_STAFF,WAREHOUSE_STAFF")]
        [HttpPut("{id}/reject")]
        public async Task<IActionResult> RejectRequest(long id, [FromBody] RejectReturnWarrantyDto dto)
        {
            var r = await _db.ReturnWarrantyRequests.FindAsync(id);
            if (r == null) return NotFound(new { message = "Không tìm thấy yêu cầu." });

            if (r.Status != "PENDING")
                return BadRequest(new { message = "Yêu cầu này đã được xử lý trước đó." });

            if (string.IsNullOrWhiteSpace(dto.ResultNote))
                return BadRequest(new { message = "Vui lòng nhập lý do từ chối." });

            var staffIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            r.HandledBy = string.IsNullOrEmpty(staffIdClaim) ? null : long.Parse(staffIdClaim);
            r.Status = "REJECTED";
            r.ResultNote = dto.ResultNote;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Đã từ chối yêu cầu và ghi nhận lý do.",
                status = r.Status
            });
        }

        // Yêu cầu đang "PROCESSING" -> thực hiện xử lý theo loại:
        //   RETURN: "Hoàn kho sản phẩm trả lại" -> "Xuất kho sản phẩm đổi (nếu có)"
        //   WARRANTY: "Chuyển sản phẩm đi bảo hành / sửa chữa" (không đổi tồn kho)
        // -> HỆ THỐNG: Cập nhật trạng thái = "Hoàn tất" -> Gửi thông báo kết quả cho khách hàng
        [Authorize(Roles = "ADMIN,SALES_STAFF,WAREHOUSE_STAFF")]
        [HttpPut("{id}/complete")]
        public async Task<IActionResult> CompleteRequest(long id, [FromBody] CompleteReturnWarrantyDto dto)
        {
            var r = await _db.ReturnWarrantyRequests
                .Include(x => x.OrderItem)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (r == null) return NotFound(new { message = "Không tìm thấy yêu cầu." });

            if (r.Status != "PROCESSING")
                return BadRequest(new { message = "Yêu cầu phải ở trạng thái Đang xử lý mới có thể hoàn tất." });

            if (r.RequestType == "RETURN")
            {
                var restoreResult = await _inventoryService.RestoreStockForVariantAsync(
                    r.OrderItem.VariantId, r.OrderItem.ProductId, r.OrderItem.Quantity ?? 1);

                if (!restoreResult.Success)
                {
                    return BadRequest(new { message = "Lỗi khi hoàn kho sản phẩm trả lại.", detail = restoreResult.InsufficientItems });
                }

                if (dto.ExchangeVariantId.HasValue && dto.ExchangeQuantity.HasValue && dto.ExchangeQuantity > 0)
                {
                    var deductResult = await _inventoryService.DeductStockForVariantAsync(
                        dto.ExchangeVariantId.Value, dto.ExchangeQuantity.Value);

                    if (!deductResult.Success)
                    {
                        return BadRequest(new
                        {
                            message = "Không đủ hàng để xuất kho sản phẩm đổi.",
                            detail = deductResult.InsufficientItems
                        });
                    }
                }
            }
            // RequestType == "WARRANTY" -> chuyển sản phẩm đi bảo hành/sửa chữa (không đổi tồn kho)

            r.Status = "COMPLETED";
            r.ResultNote = dto.ResultNote ?? r.ResultNote;

            await _db.SaveChangesAsync();

            Console.WriteLine($"[THÔNG BÁO KHÁCH HÀNG] Yêu cầu {r.RequestCode} đã hoàn tất xử lý.");

            return Ok(new
            {
                message = "Đã hoàn tất xử lý yêu cầu và gửi thông báo cho khách hàng.",
                status = r.Status
            });
        }
    }
}