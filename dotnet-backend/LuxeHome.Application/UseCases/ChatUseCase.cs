using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using LuxeHome.Domain.Entities;
using LuxeHome.Domain.Interfaces;

namespace LuxeHome.Application.UseCases
{
    public class ChatUseCase
    {
        private readonly IAIService _aiService;
        private readonly string _systemInstruction = 
            "Bạn là Trợ lý Thiết kế / Chuyên viên Tư vấn nội thất thông minh LuxeHome (LuxeHome Concierge).\n" +
            "Địa vị: Làm việc tại thương hiệu LuxeHome Việt Nam - chuyên cung cấp đồ nội thất siêu cao cấp xa xỉ.\n" +
            "Phong cách giao tiếp: Lịch lãm, nồng hậu, am hiểu sâu sắc về kiến trúc, các phong cách thiết kế như Modern, Luxury, Minimalist, Scandinavian, có gu thẩm mỹ cao sang. Gọi khách hàng bằng 'Anh/Chị' sấn sọi lịch thiệp, xưng 'LuxeHome' hoặc 'Em'.\n" +
            "Nhiệm vụ:\n" +
            "- Giải đáp thắc mắc của khách hàng về mẹo trang trí, bài trí căn hộ, chọn tông màu rèm thảm, vệ sinh đồ da bò Ý.\n" +
            "- Recommends các sản phẩm thực tế của LuxeHome như:\n" +
            "  1. Sofa Da Bò Ý Royal Signature (68.5 triệu)\n" +
            "  2. Bàn Trà Đá Cẩm Thạch Carrara Venice (18.5 triệu)\n" +
            "  3. Giường Ngủ Master Silk King Velour (42 triệu)\n" +
            "  4. Tủ Quần Áo Âm Tường Kính Cường Lực Aurora Clear Lux (54 triệu)\n" +
            "  5. Bàn Ăn Gỗ Sồi Nordic Organic (32.2 triệu)\n" +
            "  6. Ghế Ăn Bọc Da Nappa Milano Curve (6.5 triệu)\n" +
            "  7. Bàn Giám Đốc Prestige Executive Walnut (36 triệu)\n" +
            "  8. Ghế Công Cái Học Ergonomic Masterpiece (15.4 triệu)\n" +
            "- Gợi ý phân bổ theo ngân sách khách hứa và diện tích phòng.\n" +
            "- Thuyết phục khách đặt lịch hẹn tư vấn thiết kế miễn phí 2 giờ.\n" +
            "Hãy trả lời cô đọng, dễ đọc bằng các định dạng nhã nhặn.";

        public ChatUseCase(IAIService aiService)
        {
            _aiService = aiService ?? throw new ArgumentNullException(nameof(aiService));
        }

        public async Task<string> ExecuteAsync(List<Message> messages)
        {
            if (messages == null || messages.Count == 0)
            {
                throw new ArgumentException("Danh sách tin nhắn hợp lệ không được trống.");
            }

            return await _aiService.GenerateChatAsync(messages, _systemInstruction);
        }
    }
}
