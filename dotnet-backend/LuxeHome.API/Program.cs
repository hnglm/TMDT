using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using LuxeHome.Domain.Interfaces;
using LuxeHome.Infrastructure.Data;
using LuxeHome.Infrastructure.Services;
using LuxeHome.Application.UseCases;

var builder = WebApplication.CreateBuilder(args);

// 1. Cấu hình các dịch vụ vào vùng chứa (DI Container)
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Bỏ qua vòng lặp vô tận khi Serialize dữ liệu có quan hệ 2 chiều (EF Core)
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

// Đọc chuỗi kết nối từ appsettings.json thông qua tên "DefaultConnection"
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<LuxeHomeDbContext>(options =>
    options.UseNpgsql(connectionString));

// Đăng ký HttpClient cho dịch vụ AI
builder.Services.AddHttpClient<IAIService, GeminiAIService>();

// Đăng ký các trường hợp nghiệm vụ (Application Use Cases)
builder.Services.AddScoped<ChatUseCase>();
builder.Services.AddScoped<ImageSearchUseCase>();

// Cấu hình chính sách cho phép CORS giúp Frontend React gọi API dễ dàng
builder.Services.AddCors(options =>
{
    options.AddPolicy("LuxeHomeCorsPolicy", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy.WithOrigins("http://localhost:3000", "http://localhost:5173") 
                        .AllowAnyHeader()
                        .AllowAnyMethod());
});

var app = builder.Build();

app.UseRouting();
// 2. Định hình đường ống yêu cầu HTTP (Request Pipeline)
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseCors("LuxeHomeCorsPolicy");
app.UseCors("AllowReactApp");

app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<LuxeHomeDbContext>();
        await context.Database.MigrateAsync(); 

        // Lấy đối tượng cấu hình IConfiguration từ hệ thống
        var configuration = services.GetRequiredService<IConfiguration>();
        
        // Đọc giá trị từ file appsettings.json, mặc định là false nếu không tìm thấy cấu hình
        bool enableSeeding = configuration.GetValue<bool>("SeedDataConfig:EnableSeeding");

        // Truyền biến này vào hàm (Áp dụng kèm theo thay đổi ở Bước 1 của Cách 1)
        await DataSeeder.SeedAsync(context, enableSeeding);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}

// Khởi chạy Máy chủ .NET
app.Run("http://localhost:5200");


