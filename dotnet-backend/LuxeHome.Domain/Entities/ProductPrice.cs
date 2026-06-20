using System;
using System.Collections.Generic;

namespace LuxeHome.Domain.Entities;

public partial class ProductPrice
{
    public long Id { get; set; }

    public long ProductId { get; set; }

    public long? VariantId { get; set; }

    public decimal? OriginalPrice { get; set; }

    public decimal? SellingPrice { get; set; }

    public DateTime? EffectiveFrom { get; set; }

    public DateTime? EffectiveTo { get; set; }

    public string? Status { get; set; }

    public long? CreatedBy { get; set; }

    public long? ApprovedBy { get; set; }

    public virtual User? ApprovedByNavigation { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual ProductVariant? Variant { get; set; }
}
