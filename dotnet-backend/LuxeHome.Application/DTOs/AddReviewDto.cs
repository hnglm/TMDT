namespace LuxeHome.Application.DTOs
{
    public class AddReviewDto
    {
        public long ProductId { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
    }
}