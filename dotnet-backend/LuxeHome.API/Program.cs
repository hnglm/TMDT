using System.Text.Json.Serialization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using LuxeHome.Domain.Interfaces;
using Microsoft.OpenApi.Models;
using LuxeHome.Infrastructure.Data;
using LuxeHome.Infrastructure.Services;
using LuxeHome.Application.UseCases;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// ĐOẠN CODE MỚI: Ép cứng chuỗi kết nối trực tiếp không qua file appsettings.json
builder.Services.AddDbContext<LuxeHomeDbContext>(options =>
    options.UseNpgsql("Host=localhost;Port=5432;Database=luxhomedb;Username=postgres;Password=050705"));

builder.Services.AddEndpointsApiExplorer();

// Cấu hình Swagger hỗ trợ nhập Token JWT khi test API
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "LuxeHome API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Nhập token theo định dạng: Bearer {your_token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

// Khởi tạo dịch vụ Xác thực nhận diện Token JWT
var jwtSecret = builder.Configuration["JwtConfig:Secret"] ?? "LuxeHome_Super_Secret_Key_2026_Pro_Project_Long_String_For_Security";
var key = Encoding.UTF8.GetBytes(jwtSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddHttpClient<IAIService, GeminiAIService>();

// Đăng ký các UseCase Nghiệp vụ
builder.Services.AddScoped<ChatUseCase>();
builder.Services.AddScoped<ImageSearchUseCase>();
builder.Services.AddScoped<UserUseCase>(); // Đăng ký UseCase User mới

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin() // Cho phép tất cả các nguồn
              .AllowAnyMethod() // Cho phép tất cả các loại request (GET, POST, PUT, DELETE...)
              .AllowAnyHeader(); // Cho phép tất cả các header
    });
});
var app = builder.Build();

app.UseRouting();
app.UseCors("AllowAll");

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseSwagger();
app.UseSwaggerUI(c => 
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "LuxeHome API V1");
    c.RoutePrefix = "swagger";
});

// Kích hoạt Authentication trước Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<LuxeHomeDbContext>();
        await context.Database.MigrateAsync(); 
        var configuration = services.GetRequiredService<IConfiguration>();
        bool enableSeeding = configuration.GetValue<bool>("SeedDataConfig:EnableSeeding");
        await DataSeeder.SeedAsync(context, enableSeeding);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}

app.Run("http://localhost:5200");