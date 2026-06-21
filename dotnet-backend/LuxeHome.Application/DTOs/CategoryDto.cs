namespace LuxeHome.Application.DTOs
{
    public class CategoryDto
    {
        public long Id { get; set; }
        public long? ParentId { get; set; }
        public string CategoryName { get; set; }
        public string Slug { get; set; }
        public string ThumbnailUrl { get; set; }
        public int? SortOrder { get; set; }
    }
}