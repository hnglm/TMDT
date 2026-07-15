using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LuxeHome.Domain.Entities
{
    // Tin nhắn chat 1-1 THẬT giữa khách hàng và nhân viên (Sales/Admin)
    // Khác hoàn toàn với Message.cs (chỉ dùng cho Chatbot AI, không lưu DB)
    //
    // Mỗi cuộc trò chuyện gắn với 1 CustomerId cố định (khách hàng chat chung
    // với "LuxeHome hỗ trợ", không phân biệt nhân viên nào trả lời — giống
    // mô hình live-chat phổ biến của các sàn TMĐT)
    [Table("customer_chat_messages")]
    public class CustomerChatMessage
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        // Luôn là Id của khách hàng, dùng để nhóm toàn bộ tin nhắn thành 1 cuộc hội thoại
        [Column("customer_id")]
        public long CustomerId { get; set; }

        // Id người gửi thực tế (có thể là khách hàng hoặc nhân viên)
        [Column("sender_id")]
        public long SenderId { get; set; }

        // "CUSTOMER" hoặc "STAFF" — để hiển thị đúng bên trái/phải khi render UI
        [Column("sender_role")]
        public string SenderRole { get; set; } = "CUSTOMER";

        [Column("content")]
        public string Content { get; set; } = string.Empty;

        // Nhân viên đã xem tin này chưa (dùng đếm badge "chưa đọc" bên Admin)
        [Column("is_read_by_staff")]
        public bool IsReadByStaff { get; set; } = false;

        // Khách hàng đã xem tin này chưa (dùng đếm badge "chưa đọc" bên khách)
        [Column("is_read_by_customer")]
        public bool IsReadByCustomer { get; set; } = false;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(CustomerId))]
        public virtual User? Customer { get; set; }

        [ForeignKey(nameof(SenderId))]
        public virtual User? Sender { get; set; }
    }
}