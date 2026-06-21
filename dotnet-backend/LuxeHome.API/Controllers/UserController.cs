using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using LuxeHome.Application.UseCases;
using LuxeHome.Application.DTOs;

namespace LuxeHome.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly UserUseCase _userUseCase;

        public UserController(UserUseCase userUseCase)
        {
            _userUseCase = userUseCase;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try { return Ok(await _userUseCase.RegisterAsync(request)); }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try { return Ok(await _userUseCase.LoginAsync(request)); }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                long userId = long.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                return Ok(await _userUseCase.GetProfileAsync(userId));
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            try
            {
                long userId = long.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                return Ok(await _userUseCase.UpdateProfileAsync(userId, request));
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [Authorize]
        [HttpGet("addresses")]
        public async Task<IActionResult> GetAddresses()
        {
            try
            {
                long userId = long.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                return Ok(await _userUseCase.GetAddressesAsync(userId));
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [Authorize]
        [HttpPost("addresses")]
        public async Task<IActionResult> AddAddress([FromBody] AddressRequest request)
        {
            try
            {
                long userId = long.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                return Ok(await _userUseCase.AddAddressAsync(userId, request));
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        // =========================================================================
        // 👑 ĐOẠN CODE BỔ SUNG NÂNG CẤP: TIẾP NHẬN SỬA THÔNG TIN & KHÓA USER TỪ FRONTEND
        // =========================================================================

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
                // Gọi hàm nạp full cụm data (Quyền, Tên, Số điện thoại, Trạng thái Khóa) xuống DB
                var result = await _userUseCase.UpdateUserRoleAndInfoAsync(id, request);
                return Ok(new { success = result, message = "Đồng bộ cấu hình tài khoản thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}