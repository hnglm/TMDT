using System;
using System.Collections.Generic;

namespace LuxeHome.LuxeHome.Domain.Entities;

public partial class ReturnWarrantyRequest
{
    public long Id { get; set; }

    public string? RequestCode { get; set; }

    public string? RequestType { get; set; }

    public long OrderId { get; set; }

    public long OrderItemId { get; set; }

    public long UserId { get; set; }

    public string? Reason { get; set; }

    public string? ImageUrl { get; set; }

    public decimal? RefundAmount { get; set; }

    public string? Status { get; set; }

    public long? HandledBy { get; set; }

    public string? ResultNote { get; set; }

    public virtual User? HandledByNavigation { get; set; }

    public virtual Order Order { get; set; } = null!;

    public virtual OrderItem OrderItem { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
