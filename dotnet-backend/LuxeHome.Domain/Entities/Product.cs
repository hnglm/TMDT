using System.ComponentModel.DataAnnotations;

namespace LuxeHome.Domain.Entities
{
    public class Product
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string Category { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string Style { get; set; } = string.Empty;
        
        public decimal Price { get; set; }
        
        [MaxLength(1000)]
        public string Advice { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
        
        public string Brand { get; set; } = "LuxeHome";
    }
}
