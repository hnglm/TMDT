using System;
using System.Collections.Generic;

namespace LuxeHome.LuxeHome.Domain.Entities;

public partial class SlugRedirect
{
    public long Id { get; set; }

    public string? EntityType { get; set; }

    public long? EntityId { get; set; }

    public string? OldSlug { get; set; }

    public string? NewSlug { get; set; }

    public int? RedirectType { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }
}
