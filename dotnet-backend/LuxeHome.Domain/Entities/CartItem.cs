using System;
using System.Collections.Generic;

namespace LuxeHome.Domain.Entities;

public partial class CartItem
{
    public long Id { get; set; }

    public long CartId { get; set; }

    public long ProductId { get; set; }

    public long VariantId { get; set; }

    public int? Quantity { get; set; }

    public decimal? UnitPrice { get; set; }

    public decimal? DiscountAmount { get; set; }

    public decimal? TotalPrice { get; set; }

    public virtual Cart Cart { get; set; } = null!;

    public virtual Product Product { get; set; } = null!;

    public virtual ProductVariant Variant { get; set; } = null!;
}
