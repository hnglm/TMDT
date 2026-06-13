using System;
using System.Collections.Generic;

namespace LuxeHome.LuxeHome.Domain.Entities;

public partial class OrderItem
{
    public long Id { get; set; }

    public long OrderId { get; set; }

    public long ProductId { get; set; }

    public long VariantId { get; set; }

    public string? ProductName { get; set; }

    public string? Sku { get; set; }

    public int? Quantity { get; set; }

    public decimal? OriginalPrice { get; set; }

    public decimal? SellingPrice { get; set; }

    public decimal? DiscountAmount { get; set; }

    public decimal? TotalPrice { get; set; }

    public int? WarrantyMonths { get; set; }

    public virtual Order Order { get; set; } = null!;

    public virtual Product Product { get; set; } = null!;

    public virtual ICollection<ReturnWarrantyRequest> ReturnWarrantyRequests { get; set; } = new List<ReturnWarrantyRequest>();

    public virtual ProductVariant Variant { get; set; } = null!;
}
