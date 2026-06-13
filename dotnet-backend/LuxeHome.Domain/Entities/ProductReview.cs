using System;
using System.Collections.Generic;

namespace LuxeHome.LuxeHome.Domain.Entities;

public partial class ProductReview
{
    public long Id { get; set; }

    public long ProductId { get; set; }

    public long? VariantId { get; set; }

    public long OrderId { get; set; }

    public long UserId { get; set; }

    public int? Rating { get; set; }

    public string? ReviewContent { get; set; }

    public string? ImageUrl { get; set; }

    public string? Status { get; set; }

    public string? AdminReply { get; set; }

    public virtual Order Order { get; set; } = null!;

    public virtual Product Product { get; set; } = null!;

    public virtual User User { get; set; } = null!;

    public virtual ProductVariant? Variant { get; set; }
}
