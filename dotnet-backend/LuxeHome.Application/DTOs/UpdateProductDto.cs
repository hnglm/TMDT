namespace LuxeHome.Application.DTOs
{
    public class UpdateProductDto
    {
        public string ProductName { get; set; }
        public string CategorySlug { get; set; }
        public decimal CurrentPrice { get; set; }
        public int Stock { get; set; }
        public string Style { get; set; }
        public string Material { get; set; }
        public string? Status { get; set; }
        public string? MetaTitle { get; set; }
        public string? MetaDescription { get; set; }
        public string? ImageUrl { get; set; }
    }
}