using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using LuxeHome.Application.UseCases;
using LuxeHome.Application.DTOs;
using Newtonsoft.Json;
using LuxeHome.Domain.Entities;
using LuxeHome.Infrastructure.Data;
using LuxeHome.API.Configurations;
using LuxeHome.Domain.Interfaces; 
using LuxeHome.Infrastructure.Services; 
namespace LuxeHome.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {   private readonly ITokenService _tokenService; 
        private readonly UserUseCase _userUseCase;
        private readonly LuxeHomeDbContext _context;

        public UserController(
            UserUseCase userUseCase,
            LuxeHomeDbContext context,
            ITokenService tokenService)
        {
            _userUseCase = userUseCase;
            _context = context;
            _tokenService = tokenService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                return Ok(await _userUseCase.RegisterAsync(request));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                return Ok(await _userUseCase.LoginAsync(request));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("facebook-login")]
        [HttpPost("/user/facebook-login")]
        public async Task<IActionResult> FacebookLogin([FromBody] SocialLoginRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.Token))
                {
                    return BadRequest(new { message = "Token Facebook không hợp lệ." });
                }

                using var client = new HttpClient();

                var url = $"https://graph.facebook.com/me?access_token={request.Token}&fields=id,name,email";
                var response = await client.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    return Unauthorized(new { message = "Token Facebook không hợp lệ." });
                }

                var json = await response.Content.ReadAsStringAsync();
                var fbUser = JsonConvert.DeserializeObject<dynamic>(json);

                string? facebookId = fbUser?.id;
                string? email = fbUser?.email;
                string? fullName = fbUser?.name;

                if (string.IsNullOrWhiteSpace(email))
                {
                    if (string.IsNullOrWhiteSpace(facebookId))
                    {
                        return BadRequest(new { message = "Không lấy được thông tin Facebook." });
                    }

                    email = $"facebook_{facebookId}@luxehome.local";
                }

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == email);

                if (user == null)
                {
                    var customerRole = await _context.Roles
                        .FirstOrDefaultAsync(r => r.RoleCode == "CUSTOMER");

                    if (customerRole == null)
                    {
                        return StatusCode(500, new
                        {
                            message = "Không tìm thấy role CUSTOMER trong database."
                        });
                    }

                    var ticks = DateTime.Now.Ticks.ToString();
                    var fakePhone = "09" + ticks.Substring(ticks.Length - 8);

                    user = new User
                    {
                        RoleId = customerRole.Id,
                        Email = email,
                        FullName = fullName ?? email,
                        Phone = fakePhone,
                        PasswordHash = "FACEBOOK_LOGIN",
                        AvatarUrl = "",
                        Status = "Active",
                        CreatedAt = DateTime.Now
                    };

                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();
                }
                var token = _tokenService.CreateToken(user);
                return Ok(new
                {
                    token = token,
                    user = new
                    {
                        id = user.Id,
                        fullName = user.FullName,
                        email = user.Email,
                        phone = user.Phone,
                        avatarUrl = user.AvatarUrl,
                        status = user.Status,
                        role = "CUSTOMER"
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("FACEBOOK LOGIN ERROR:");
                Console.WriteLine(ex.ToString());

                return StatusCode(500, new
                {
                    message = ex.Message,
                    detail = ex.InnerException?.Message
                });
            }
        }
        [HttpPost("google-login")]
[HttpPost("/user/google-login")]
public async Task<IActionResult> GoogleLogin([FromBody] SocialLoginRequest request)
{
    try
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Token))
        {
            return BadRequest(new { message = "Token Google không hợp lệ." });
        }

        using var client = new HttpClient();

        var url = $"https://www.googleapis.com/oauth2/v3/userinfo?access_token={request.Token}";
        var response = await client.GetAsync(url);

        if (!response.IsSuccessStatusCode)
        {
            return Unauthorized(new { message = "Token Google không hợp lệ hoặc đã hết hạn." });
        }

        var json = await response.Content.ReadAsStringAsync();
        var googleUser = JsonConvert.DeserializeObject<dynamic>(json);

        string? googleId = googleUser?.sub;
        string? email = googleUser?.email;
        string? fullName = googleUser?.name;
        string? avatarUrl = googleUser?.picture;

        if (string.IsNullOrWhiteSpace(email))
        {
            if (string.IsNullOrWhiteSpace(googleId))
            {
                return BadRequest(new { message = "Không lấy được thông tin Google." });
            }

            email = $"google_{googleId}@luxehome.local";
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            var customerRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.RoleCode == "CUSTOMER");

            if (customerRole == null)
            {
                return StatusCode(500, new
                {
                    message = "Không tìm thấy role CUSTOMER trong database."
                });
            }

            var ticks = DateTime.Now.Ticks.ToString();
            var fakePhone = "09" + ticks.Substring(ticks.Length - 8);

            user = new User
            {
                RoleId = customerRole.Id,
                Email = email,
                FullName = fullName ?? email,
                Phone = fakePhone,
                PasswordHash = "GOOGLE_LOGIN",
                AvatarUrl = avatarUrl ?? "",
                Status = "Active",
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }
        else
        {
            var hasChange = false;

            if (!string.IsNullOrWhiteSpace(fullName) && user.FullName != fullName)
            {
                user.FullName = fullName;
                hasChange = true;
            }

            if (!string.IsNullOrWhiteSpace(avatarUrl) && string.IsNullOrWhiteSpace(user.AvatarUrl))
            {
                user.AvatarUrl = avatarUrl;
                hasChange = true;
            }

            if (hasChange)
            {
                await _context.SaveChangesAsync();
            }
        }
        var token = _tokenService.CreateToken(user);
        return Ok(new
        {
            token = token,
            user = new
            {
                id = user.Id,
                fullName = user.FullName,
                email = user.Email,
                phone = user.Phone,
                avatarUrl = user.AvatarUrl,
                status = user.Status,
                role = "CUSTOMER"
            }
        });
    }
    catch (Exception ex)
    {
        Console.WriteLine("GOOGLE LOGIN ERROR:");
        Console.WriteLine(ex.ToString());

        return StatusCode(500, new
        {
            message = ex.Message,
            detail = ex.InnerException?.Message
        });
    }
}
        [Authorize]
        [HttpGet("profile")]
        [HttpGet("/user/profile")]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                long userId = long.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                return Ok(await _userUseCase.GetProfileAsync(userId));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpPut("profile")]
        [HttpPut("/user/profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            try
            {
                long userId = long.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                return Ok(await _userUseCase.UpdateProfileAsync(userId, request));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpGet("addresses")]
        [HttpGet("/user/addresses")]
        public async Task<IActionResult> GetAddresses()
        {
            try
            {
                long userId = long.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                return Ok(await _userUseCase.GetAddressesAsync(userId));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        
        [Authorize]
        [HttpPost("addresses")]
        [HttpPost("/user/addresses")]
        public async Task<IActionResult> AddAddress([FromBody] AddressRequest request)
        {
            try
            {
                long userId = long.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                return Ok(await _userUseCase.AddAddressAsync(userId, request));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        [Authorize]
        [HttpPut("addresses/{id}")]
        [HttpPut("/user/addresses/{id}")]
        public async Task<IActionResult> UpdateAddress(long id, [FromBody] AddressRequest request)
        {
            try
            {
                long userId = long.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                return Ok(await _userUseCase.UpdateAddressAsync(userId, id, request));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        [Authorize(Roles = "ADMIN,MANAGER")]
        [HttpGet("/api/admin/users")]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                return Ok(await _userUseCase.GetAllUsersAsync());
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "ADMIN")]
        [HttpPut("/api/admin/users/{id}/role")]
        public async Task<IActionResult> UpdateUserRole(long id, [FromBody] AdminUpdateUserRequest request)
        {
            try
            {
                var result = await _userUseCase.UpdateUserRoleAndInfoAsync(id, request);

                return Ok(new
                {
                    success = result,
                    message = "Đồng bộ cấu hình tài khoản thành công!"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}