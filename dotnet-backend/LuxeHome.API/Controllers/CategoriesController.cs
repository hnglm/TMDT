using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LuxeHome.Infrastructure.Data;
using LuxeHome.Application.DTOs;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly LuxeHomeDbContext _context; 

    public CategoriesController(LuxeHomeDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _context.Categories
            .Where(c => c.IsVisible == true)
            .OrderBy(c => c.SortOrder)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                ParentId = c.ParentId,
                CategoryName = c.CategoryName,
                Slug = c.Slug,
                ThumbnailUrl = c.ThumbnailUrl,
                SortOrder = c.SortOrder
            })
            .ToListAsync();

        return Ok(categories);
    }
}