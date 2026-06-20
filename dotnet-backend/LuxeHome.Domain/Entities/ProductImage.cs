using System;
using System.Collections.Generic;

namespace LuxeHome.Domain.Entities;

public partial class ProductImage
{
    public long Id { get; set; }

    public long ProductId { get; set; }

    public long? VariantId { get; set; }

    public string? ImageUrl { get; set; }

    public string? AltText { get; set; }

    public string? TitleText { get; set; }

    public bool? IsMain { get; set; }

    public int? SortOrder { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual ProductVariant? Variant { get; set; }
}
