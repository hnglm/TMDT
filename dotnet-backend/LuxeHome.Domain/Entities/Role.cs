using System;
using System.Collections.Generic;

namespace LuxeHome.LuxeHome.Domain.Entities;

public partial class Role
{
    public long Id { get; set; }

    public string RoleCode { get; set; } = null!;

    public string RoleName { get; set; } = null!;

    public string? Description { get; set; }

    public string? Status { get; set; }

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
