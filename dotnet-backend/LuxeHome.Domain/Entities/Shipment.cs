using System;
using System.Collections.Generic;

namespace LuxeHome.Domain.Entities;

public partial class Shipment
{
    public long Id { get; set; }

    public long OrderId { get; set; }

    public string? CarrierName { get; set; }

    public string? TrackingCode { get; set; }

    public decimal? ShippingFee { get; set; }

    public string? ShippingStatus { get; set; }

    public DateTime? ShippedAt { get; set; }

    public DateTime? DeliveredAt { get; set; }

    public string? Note { get; set; }

    public virtual Order Order { get; set; } = null!;
}
