namespace LuxeHome.Application.DTOs
{
    // Danh sách khách hàng cho Sales xem — "Xem danh sách khách hàng"
    public class CustomerListItemResponse
    {
        public long Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Status { get; set; } = "ACTIVE";
        public string CreatedAt { get; set; } = string.Empty;
        public int TotalOrders { get; set; }
        public decimal TotalSpent { get; set; }
        public string? LastOrderDate { get; set; }
    }

    // "Xem chi tiết khách hàng"
    public class CustomerDetailResponse
    {
        public long Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Status { get; set; } = "ACTIVE";
        public string CreatedAt { get; set; } = string.Empty;
        public string? LastLoginAt { get; set; }
    }

    // "Ghi chú nhu cầu khách hàng" + "Gửi thông báo chăm sóc khách hàng" (gộp 1 bước lưu)
    public class CreateCareLogDto
    {
        public string? NeedNote { get; set; }

        // PROMOTION | ORDER_REMINDER | GREETING | OTHER
        public string CareType { get; set; } = "OTHER";

        public string CareMessage { get; set; } = string.Empty;
    }

    // "Cập nhật kết quả chăm sóc" khi khách Có phản hồi
    public class UpdateCareResponseDto
    {
        public string ResponseResult { get; set; } = string.Empty;
    }

    // "Đánh dấu chờ phản hồi / lên lịch chăm sóc lại" khi khách Không phản hồi
    public class ScheduleFollowUpDto
    {
        public DateTime? NextFollowUpAt { get; set; }
    }

    public class CareLogResponse
    {
        public long Id { get; set; }
        public long CustomerId { get; set; }
        public long StaffId { get; set; }
        public string? StaffName { get; set; }
        public string? NeedNote { get; set; }
        public string CareType { get; set; } = string.Empty;
        public string? CareMessage { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? ResponseResult { get; set; }
        public DateTime? NextFollowUpAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}