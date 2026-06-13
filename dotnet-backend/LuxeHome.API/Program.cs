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
builder.Services.AddControllers();

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

var app = builder.Build();

// 2. Định hình đường ống yêu cầu HTTP (Request Pipeline)
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseCors("LuxeHomeCorsPolicy");

app.UseAuthorization();

app.MapControllers();

// Khởi chạy Máy chủ .NET
app.Run("http://0.0.0.0:5000");
