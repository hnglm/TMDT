using Microsoft.AspNetCore.Http;

namespace LuxeHome.Application.DTOs
{
    public class ReturnWarrantyDto
    {
        public string Reason { get; set; } = string.Empty;

        public string AccountInfo { get; set; } = string.Empty;

        public string? Description { get; set; }

        public List<IFormFile>? Images { get; set; }

        public string? ImageUrls { get; set; }
        
    }
}