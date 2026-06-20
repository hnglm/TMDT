using System;

namespace LuxeHome.Domain.Entities
{
    public class ImageSearchResult
    {
        public string? DetectedStyle { get; set; }
        public string? MatchedCategory { get; set; }
        public string? Advice { get; set; }
        public string? MatchedProductName { get; set; }
        public string? Confidence { get; set; }
    }
}