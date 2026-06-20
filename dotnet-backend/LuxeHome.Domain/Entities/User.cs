using System;
using System.Collections.Generic;

namespace LuxeHome.Domain.Entities;

public partial class User
{
    public long Id { get; set; }

    public long RoleId { get; set; }

    public string? FullName { get; set; }

    public string Email { get; set; } = null!;

    public string? Phone { get; set; }

    public string? PasswordHash { get; set; }

    public string? AvatarUrl { get; set; }

    public string? Status { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Cart> Carts { get; set; } = new List<Cart>();

    public virtual ICollection<CustomerAddress> CustomerAddresses { get; set; } = new List<CustomerAddress>();

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    public virtual ICollection<PriceHistory> PriceHistories { get; set; } = new List<PriceHistory>();

    public virtual ICollection<ProductPrice> ProductPriceApprovedByNavigations { get; set; } = new List<ProductPrice>();

    public virtual ICollection<ProductPrice> ProductPriceCreatedByNavigations { get; set; } = new List<ProductPrice>();

    public virtual ICollection<ProductReview> ProductReviews { get; set; } = new List<ProductReview>();

    public virtual ICollection<ReturnWarrantyRequest> ReturnWarrantyRequestHandledByNavigations { get; set; } = new List<ReturnWarrantyRequest>();

    public virtual ICollection<ReturnWarrantyRequest> ReturnWarrantyRequestUsers { get; set; } = new List<ReturnWarrantyRequest>();

    public virtual Role Role { get; set; } = null!;
}
