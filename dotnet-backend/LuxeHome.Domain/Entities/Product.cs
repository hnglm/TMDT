using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace LuxeHome.Domain.Entities;

public partial class Product
{
    public long Id { get; set; }

    public string? ProductCode { get; set; }

    public string? ProductName { get; set; }

    [NotMapped]
    public string? Brand { get; set; }

    public string? Slug { get; set; }

    public long? CategoryId { get; set; }

    public string? ShortDescription { get; set; }

    public string? Description { get; set; }

    public string? Material { get; set; }

    public string? Style { get; set; }

    public string? RoomType { get; set; }

    public int? WarrantyMonths { get; set; }

    public string? Status { get; set; }

    public bool? IsFeatured { get; set; }

    public bool? IsBestseller { get; set; }

    public string? MetaTitle { get; set; }

    public string? MetaDescription { get; set; }

    public string? CanonicalUrl { get; set; }

    public string? OgImageUrl { get; set; }

    public int? ViewCount { get; set; }

    public int? SoldCount { get; set; }

    public decimal? AverageRating { get; set; }

    public int? ReviewCount { get; set; }

    public virtual ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();

    public virtual Category? Category { get; set; }

    public virtual ICollection<InventoryStock> InventoryStocks { get; set; } = new List<InventoryStock>();

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual ICollection<PriceHistory> PriceHistories { get; set; } = new List<PriceHistory>();

    public virtual ICollection<ProductImage> ProductImages { get; set; } = new List<ProductImage>();

    public virtual ICollection<ProductPrice> ProductPrices { get; set; } = new List<ProductPrice>();

    public virtual ICollection<ProductReview> ProductReviews { get; set; } = new List<ProductReview>();

    public virtual ICollection<ProductVariant> ProductVariants { get; set; } = new List<ProductVariant>();
}
