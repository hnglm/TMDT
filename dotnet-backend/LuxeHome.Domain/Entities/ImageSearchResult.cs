namespace LuxeHome.Domain.Entities
{
    public class ImageSearchResult
    {
        public string DetectedStyle { get; set; } = string.Empty;
        public string MatchedCategory { get; set; } = string.Empty;
        public string Advice { get; set; } = string.Empty;
        public string MatchedProductName { get; set; } = string.Empty;
        public string Confidence { get; set; } = "90%";
    }
}
