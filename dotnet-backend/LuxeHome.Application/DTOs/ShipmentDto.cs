namespace LuxeHome.Application.DTOs
{
    // Nhân viên kho dùng khi "Tạo yêu cầu giao hàng" / "Bàn giao đơn hàng cho đơn vị vận chuyển"
    public class CreateShipmentDto
    {
        public string CarrierName { get; set; } = string.Empty;
    }

    // Đơn vị vận chuyển dùng khi "Cập nhật mã vận đơn"
    public class UpdateTrackingCodeDto
    {
        public string TrackingCode { get; set; } = string.Empty;
    }

    // Đơn vị vận chuyển dùng khi ghi nhận kết quả giao hàng (Thành công / Thất bại)
    public class DeliveryResultDto
    {
        public bool Success { get; set; }

        // Bắt buộc khi Success = false ("Nhập lí do giao thất bại")
        public string? FailReason { get; set; }
    }
}