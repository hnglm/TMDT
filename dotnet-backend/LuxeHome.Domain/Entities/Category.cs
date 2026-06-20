using System;
using System.Collections.Generic;

namespace LuxeHome.Domain.Entities;

public partial class Category
{
    public long Id { get; set; }

    public long? ParentId { get; set; }

    public string? CategoryName { get; set; }

    public string? Slug { get; set; }

    public string? Description { get; set; }

    public string? ThumbnailUrl { get; set; }

    public string? MetaTitle { get; set; }

    public string? MetaDescription { get; set; }

    public string? CanonicalUrl { get; set; }

    public bool? IsVisible { get; set; }

    public int? SortOrder { get; set; }

    public string? Status { get; set; }

    public virtual ICollection<Category> InverseParent { get; set; } = new List<Category>();

    public virtual Category? Parent { get; set; }

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}
