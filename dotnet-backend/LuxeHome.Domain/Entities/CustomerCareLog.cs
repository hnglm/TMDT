using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LuxeHome.Domain.Entities
{
    // Nhật ký chăm sóc khách hàng — theo sơ đồ AD_Xem chi tiết khách hàng
    // Mỗi bản ghi tương ứng 1 lần "phát sinh vấn đề" cần Sales ghi chú + gửi chăm sóc + theo dõi phản hồi
    [Table("customer_care_logs")]
    public class CustomerCareLog
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        // Khách hàng được chăm sóc
        [Column("customer_id")]
        public long CustomerId { get; set; }

        // Nhân viên bán hàng thực hiện chăm sóc
        [Column("staff_id")]
        public long StaffId { get; set; }

        // "Ghi chú nhu cầu khách hàng"
        [Column("need_note")]
        public string? NeedNote { get; set; }

        // Loại chăm sóc: PROMOTION (khuyến mãi) | ORDER_REMINDER (nhắc đơn) | GREETING (hỏi thăm) | OTHER
        [Column("care_type")]
        public string CareType { get; set; } = "OTHER";

        // Nội dung thông báo đã gửi cho khách — "Gửi thông báo chăm sóc khách hàng"
        [Column("care_message")]
        public string? CareMessage { get; set; }

        // WAITING (đang chờ/theo dõi phản hồi) | RESPONDED (đã có phản hồi) | SCHEDULED (đã lên lịch chăm sóc lại)
        [Column("status")]
        public string Status { get; set; } = "WAITING";

        // "Cập nhật kết quả chăm sóc" khi khách có phản hồi
        [Column("response_result")]
        public string? ResponseResult { get; set; }

        // "Lên lịch chăm sóc lại" khi khách không phản hồi
        [Column("next_follow_up_at")]
        public DateTime? NextFollowUpAt { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        [ForeignKey(nameof(CustomerId))]
        public virtual User? Customer { get; set; }

        [ForeignKey(nameof(StaffId))]
        public virtual User? Staff { get; set; }
    }
}