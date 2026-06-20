using System;
using System.Collections.Generic;

namespace LuxeHome.Domain.Entities;

public partial class Order
{
    public long Id { get; set; }

    public string? OrderCode { get; set; }

    public long UserId { get; set; }

    public string? ReceiverName { get; set; }

    public string? ReceiverPhone { get; set; }

    public string? ShippingAddress { get; set; }

    public decimal? SubtotalAmount { get; set; }

    public decimal? DiscountAmount { get; set; }

    public decimal? ShippingFee { get; set; }

    public decimal? FinalAmount { get; set; }

    public string? OrderStatus { get; set; }

    public string? PaymentStatus { get; set; }

    public string? ShippingStatus { get; set; }

    public string? CouponCode { get; set; }

    public string? CustomerNote { get; set; }

    public string? StaffNote { get; set; }

    public long? ConfirmedBy { get; set; }

    public DateTime? ConfirmedAt { get; set; }

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public virtual ICollection<ProductReview> ProductReviews { get; set; } = new List<ProductReview>();

    public virtual ICollection<ReturnWarrantyRequest> ReturnWarrantyRequests { get; set; } = new List<ReturnWarrantyRequest>();

    public virtual ICollection<Shipment> Shipments { get; set; } = new List<Shipment>();

    public virtual User User { get; set; } = null!;
}
