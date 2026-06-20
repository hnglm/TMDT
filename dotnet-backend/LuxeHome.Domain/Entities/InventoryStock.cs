using System;
using System.Collections.Generic;

namespace LuxeHome.Domain.Entities;

public partial class InventoryStock
{
    public long Id { get; set; }

    public long ProductId { get; set; }

    public long VariantId { get; set; }

    public int? QuantityOnHand { get; set; }

    public int? QuantityReserved { get; set; }

    public int? QuantityAvailable { get; set; }

    public int? MinStockLevel { get; set; }

    public string? StockStatus { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual ProductVariant Variant { get; set; } = null!;
}
