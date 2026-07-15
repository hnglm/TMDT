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
    // Chat 1-1 THẬT giữa Khách hàng <-> Nhân viên (Sales/Admin)
    // Thay thế cho tính năng "Nhật ký chăm sóc khách hàng" (CustomerCareLog) cũ.
    // Cơ chế: polling (frontend tự gọi lại API định kỳ), không dùng WebSocket/SignalR.
    // =========================================================================
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerChatController : ControllerBase
    {
        private readonly LuxeHomeDbContext _db;

        public CustomerChatController(LuxeHomeDbContext db)
        {
            _db = db;
        }

        private long CurrentUserId => long.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        private bool IsStaff => User.IsInRole("ADMIN") || User.IsInRole("SALES_STAFF");

        // =====================================================================
        // KHÁCH HÀNG
        // =====================================================================

        // Khách hàng lấy toàn bộ tin nhắn của chính mình (mở trang Chat lên là load)
        [Authorize]
        [HttpGet("my-messages")]
        public async Task<IActionResult> GetMyMessages()
        {
            var customerId = CurrentUserId;

            var messages = await _db.CustomerChatMessages
                .Include(m => m.Sender)
                .Where(m => m.CustomerId == customerId)
                .OrderBy(m => m.Id)
                .Select(m => new ChatMessageResponse
                {
                    Id = m.Id,
                    CustomerId = m.CustomerId,
                    SenderId = m.SenderId,
                    SenderRole = m.SenderRole,
                    SenderName = m.Sender != null ? m.Sender.FullName : null,
                    Content = m.Content,
                    CreatedAt = m.CreatedAt
                })
                .ToListAsync();

            // Đánh dấu đã đọc mọi tin nhắn từ nhân viên khi khách mở lên xem
            var unreadFromStaff = await _db.CustomerChatMessages
                .Where(m => m.CustomerId == customerId && m.SenderRole == "STAFF" && !m.IsReadByCustomer)
                .ToListAsync();

            if (unreadFromStaff.Count > 0)
            {
                foreach (var m in unreadFromStaff) m.IsReadByCustomer = true;
                await _db.SaveChangesAsync();
            }

            return Ok(messages);
        }

        // Khách hàng gửi tin nhắn
        [Authorize]
        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] SendChatMessageDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Content))
                return BadRequest(new { message = "Nội dung tin nhắn không được để trống." });

            long customerId;
            string senderRole;
            var senderId = CurrentUserId;

            if (IsStaff)
            {
                // Nhân viên gửi -> bắt buộc chỉ định đang chat với khách nào
                if (!dto.CustomerId.HasValue)
                    return BadRequest(new { message = "Thiếu CustomerId — nhân viên phải chỉ định khách hàng đang trả lời." });

                customerId = dto.CustomerId.Value;
                senderRole = "STAFF";
            }
            else
            {
                // Khách hàng gửi -> luôn dùng chính Id của họ
                customerId = senderId;
                senderRole = "CUSTOMER";
            }

            var message = new CustomerChatMessage
            {
                CustomerId = customerId,
                SenderId = senderId,
                SenderRole = senderRole,
                Content = dto.Content.Trim(),
                IsReadByStaff = senderRole == "STAFF",   // nhân viên tự gửi thì coi như họ đã đọc
                IsReadByCustomer = senderRole == "CUSTOMER", // khách tự gửi thì coi như họ đã đọc
                CreatedAt = DateTime.UtcNow
            };

            _db.CustomerChatMessages.Add(message);
            await _db.SaveChangesAsync();

            return Ok(new ChatMessageResponse
            {
                Id = message.Id,
                CustomerId = message.CustomerId,
                SenderId = message.SenderId,
                SenderRole = message.SenderRole,
                Content = message.Content,
                CreatedAt = message.CreatedAt
            });
        }

        // =====================================================================
        // NHÂN VIÊN (Sales/Admin)
        // =====================================================================

        // "Danh sách hội thoại" — mỗi khách hàng từng nhắn tin là 1 dòng
        [Authorize(Roles = "ADMIN,SALES_STAFF")]
        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            var grouped = await _db.CustomerChatMessages
                .Include(m => m.Customer)
                .GroupBy(m => m.CustomerId)
                .Select(g => new
                {
                    CustomerId = g.Key,
                    CustomerName = g.OrderByDescending(m => m.Id).First().Customer!.FullName,
                    CustomerEmail = g.OrderByDescending(m => m.Id).First().Customer!.Email,
                    LastMessage = g.OrderByDescending(m => m.Id).First().Content,
                    LastMessageAt = g.OrderByDescending(m => m.Id).First().CreatedAt,
                    UnreadCount = g.Count(m => m.SenderRole == "CUSTOMER" && !m.IsReadByStaff)
                })
                .OrderByDescending(x => x.LastMessageAt)
                .ToListAsync();

            var result = grouped.Select(x => new ChatConversationResponse
            {
                CustomerId = x.CustomerId,
                CustomerName = x.CustomerName ?? "Khách hàng",
                CustomerEmail = x.CustomerEmail ?? "",
                LastMessage = x.LastMessage,
                LastMessageAt = x.LastMessageAt,
                UnreadCount = x.UnreadCount
            }).ToList();

            return Ok(result);
        }

        // Nhân viên xem toàn bộ tin nhắn với 1 khách hàng cụ thể
        [Authorize(Roles = "ADMIN,SALES_STAFF")]
        [HttpGet("conversations/{customerId}/messages")]
        public async Task<IActionResult> GetConversationMessages(long customerId)
        {
            var messages = await _db.CustomerChatMessages
                .Include(m => m.Sender)
                .Where(m => m.CustomerId == customerId)
                .OrderBy(m => m.Id)
                .Select(m => new ChatMessageResponse
                {
                    Id = m.Id,
                    CustomerId = m.CustomerId,
                    SenderId = m.SenderId,
                    SenderRole = m.SenderRole,
                    SenderName = m.Sender != null ? m.Sender.FullName : null,
                    Content = m.Content,
                    CreatedAt = m.CreatedAt
                })
                .ToListAsync();

            // Đánh dấu đã đọc mọi tin nhắn từ khách khi nhân viên mở hội thoại lên xem
            var unreadFromCustomer = await _db.CustomerChatMessages
                .Where(m => m.CustomerId == customerId && m.SenderRole == "CUSTOMER" && !m.IsReadByStaff)
                .ToListAsync();

            if (unreadFromCustomer.Count > 0)
            {
                foreach (var m in unreadFromCustomer) m.IsReadByStaff = true;
                await _db.SaveChangesAsync();
            }

            return Ok(messages);
        }
    }
}