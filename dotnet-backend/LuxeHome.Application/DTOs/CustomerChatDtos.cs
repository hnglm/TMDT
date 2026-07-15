namespace LuxeHome.Application.DTOs
{
    // Gửi tin nhắn — dùng chung cho cả khách hàng lẫn nhân viên
    public class SendChatMessageDto
    {
        public string Content { get; set; } = string.Empty;

        // Bắt buộc khi người gửi là NHÂN VIÊN (chọn đang chat với khách nào)
        // Khách hàng gửi thì bỏ qua field này, backend tự lấy Id của chính họ
        public long? CustomerId { get; set; }
    }

    public class ChatMessageResponse
    {
        public long Id { get; set; }
        public long CustomerId { get; set; }
        public long SenderId { get; set; }
        public string SenderRole { get; set; } = string.Empty;
        public string? SenderName { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    // "Danh sách hội thoại" bên Admin/Sales — 1 dòng = 1 khách hàng
    public class ChatConversationResponse
    {
        public long CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public string? LastMessage { get; set; }
        public DateTime? LastMessageAt { get; set; }
        public int UnreadCount { get; set; }
    }
}