using System;
using System.Collections.Generic;

namespace LuxeHome.Domain.Entities;

public partial class CustomerAddress
{
    public long Id { get; set; }

    public long UserId { get; set; }

    public string? ReceiverName { get; set; }

    public string? ReceiverPhone { get; set; }

    public string? Province { get; set; }

    public string? District { get; set; }

    public string? Ward { get; set; }

    public string? AddressDetail { get; set; }

    public string? FullAddress { get; set; }

    public bool? IsDefault { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
