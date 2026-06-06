using System;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using LuxeHome.Domain.Entities;
using LuxeHome.Domain.Interfaces;

namespace LuxeHome.Application.UseCases
{
    public class ImageSearchUseCase
    {
        private readonly IAIService _aiService;
        private readonly string _instruction = 
            "Hãy phân tích bức ảnh phòng/đồ nội thất này cấu trúc mỹ thuật của nó. Đóng gói kết quả dưới dạng JSON có cấu trúc sau.\n" +
            "Định dạng trả về phản hồi BẮT BUỘC là JSON thô, không bọc markdown block:\n" +
            "{\n" +
            "  \"detectedStyle\": \"Tên phong cách thiết kế dự đoán (Ví dụ: Scandinavian, Minimalist, Modern, Luxury)\",\n" +
            "  \"matchedCategory\": \"phong-khach hoặc phong-ngu hoặc phong-an hoặc van-phong\",\n" +
            "  \"advice\": \"Viết 2-3 câu tư vấn bằng tiếng Việt trang nhã hướng dẫn khách hàng bài trí rèm rèm hoặc thảm thảm phối màu đồng dạng\",\n" +
            "  \"matchedProductName\": \"Chọn TÊN CHÍNH XÁC của 1 trong các đồ nội thất LuxeHome khớp nhất sau từ hình ảnh bạn thấy: Sofa Da Bò Ý Tự Nhiên - Royal Signature, Bàn Trà Đá Cẩm Thạch Carrara - Venice Golden Frame, Giường Ngủ Hoàng Gia Master - Silk King Velour, Tủ Quần Áo Âm Tường Kính Cường Lực - Aurora Clear Lux, Bàn Ăn Gỗ Sồi Chun Tự Nhiên - Nordic Organic Dining, Ghế Ăn Thư Giãn Bọc Da Nappa - Milano Curve, Bàn Làm Việc Giám Đốc Cao Cấp - Executive Prestige, Ghế Công Thái Học Luxury - Ergonomic Masterpiece\"\n" +
            "}";

        public ImageSearchUseCase(IAIService aiService)
        {
            _aiService = aiService ?? throw new ArgumentNullException(nameof(aiService));
        }

        public async Task<ImageSearchResult> ExecuteAsync(string imageBase64)
        {
            if (string.IsNullOrEmpty(imageBase64))
            {
                throw new ArgumentException("Chưa cung cấp hình ảnh base64.");
            }

            string mimeType = "image/jpeg";
            var match = Regex.Match(imageBase64, @"^data:([a-zA-Z0-9]+\/[a-zA-Z0-9\-\.\+]+);base64,");
            if (match.Success)
            {
                mimeType = match.Groups[1].Value;
            }

            return await _aiService.AnalyzeImageAsync(imageBase64, mimeType, _instruction);
        }
    }
}
