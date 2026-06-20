using System;
using System.Collections.Generic;

namespace LuxeHome.Domain.Entities;

public partial class Payment
{
    public long Id { get; set; }

    public long OrderId { get; set; }

    public string? PaymentMethod { get; set; }

    public string? PaymentStatus { get; set; }

    public decimal? Amount { get; set; }

    public string? TransactionCode { get; set; }

    public string? GatewayResponse { get; set; }

    public DateTime? PaidAt { get; set; }

    public virtual Order Order { get; set; } = null!;
}
