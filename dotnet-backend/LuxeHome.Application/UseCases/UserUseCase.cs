using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using LuxeHome.Infrastructure.Data;
using LuxeHome.Domain.Entities;
using LuxeHome.Application.DTOs;
using BCryptNet = BCrypt.Net.BCrypt;

namespace LuxeHome.Application.UseCases
{
    public class UserUseCase
    {
        private readonly LuxeHomeDbContext _context;
        private readonly IConfiguration _configuration;

        public UserUseCase(LuxeHomeDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<UserProfileResponse> RegisterAsync(RegisterRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                throw new Exception("Email này đã tồn tại trên hệ thống!");

            var customerRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleCode == "CUSTOMER");
            if (customerRole == null) throw new Exception("Không tìm thấy vai trò mã CUSTOMER.");

            var user = new User
            {
                RoleId = customerRole.Id,
                Email = request.Email,
                FullName = request.FullName,
                Phone = request.Phone,
                PasswordHash = BCryptNet.HashPassword(request.Password),
                Status = "ACTIVE",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return new UserProfileResponse
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Phone = user.Phone,
                AvatarUrl = user.AvatarUrl,
                Status = user.Status,
                RoleCode = customerRole.RoleCode
            };
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email == request.Email.Trim());

            if (user == null) throw new Exception("Tài khoản hoặc mật khẩu không đúng.");
            if (user.Status != "ACTIVE") throw new Exception("Tài khoản của bạn đã bị vô hiệu hóa.");

            bool isValid = user.PasswordHash != null && (user.PasswordHash.StartsWith("$2a$") || user.PasswordHash.StartsWith("$2b$"))
                ? BCryptNet.Verify(request.Password, user.PasswordHash)
                : user.PasswordHash == request.Password;

            if (!isValid) throw new Exception("Tài khoản hoặc mật khẩu không đúng.");

            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var token = GenerateToken(user);

            return new AuthResponse
            {
                Token = token,
                User = new UserProfileResponse
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    Phone = user.Phone,
                    AvatarUrl = user.AvatarUrl,
                    Status = user.Status,
                    RoleCode = user.Role?.RoleCode ?? "CUSTOMER"
                }
            };
        }

        public async Task<UserProfileResponse> GetProfileAsync(long userId)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) throw new Exception("Không tìm thấy người dùng.");

            return new UserProfileResponse
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Phone = user.Phone,
                AvatarUrl = user.AvatarUrl,
                Status = user.Status,
                RoleCode = user.Role?.RoleCode ?? "CUSTOMER"
            };
        }

        public async Task<UserProfileResponse> UpdateProfileAsync(long userId, UpdateProfileRequest request)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) throw new Exception("Không tìm thấy người dùng.");

            if (!string.IsNullOrEmpty(request.FullName)) user.FullName = request.FullName.Trim();
            if (!string.IsNullOrEmpty(request.Phone)) user.Phone = request.Phone.Trim();
            if (!string.IsNullOrEmpty(request.AvatarUrl)) user.AvatarUrl = request.AvatarUrl;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new UserProfileResponse
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Phone = user.Phone,
                AvatarUrl = user.AvatarUrl,
                Status = user.Status,
                RoleCode = user.Role?.RoleCode ?? "CUSTOMER"
            };
        }

        public async Task<List<CustomerAddress>> GetAddressesAsync(long userId)
        {
            return await _context.CustomerAddresses
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.IsDefault)
                .ToListAsync();
        }

        public async Task<CustomerAddress> AddAddressAsync(long userId, AddressRequest request)
{
    if (string.IsNullOrWhiteSpace(request.ReceiverName))
        throw new Exception("Vui lòng nhập tên người nhận.");

    if (string.IsNullOrWhiteSpace(request.ReceiverPhone))
        throw new Exception("Vui lòng nhập số điện thoại người nhận.");

    var fullAddress = !string.IsNullOrWhiteSpace(request.FullAddress)
        ? request.FullAddress.Trim()
        : $"{request.AddressDetail}, {request.Ward}, {request.District}, {request.Province}"
            .Replace(",,,", ",")
            .Replace(",,", ",")
            .Trim()
            .Trim(',');

    if (string.IsNullOrWhiteSpace(fullAddress))
        throw new Exception("Vui lòng nhập địa chỉ giao hàng.");

    if (request.IsDefault)
    {
        var defaults = await _context.CustomerAddresses
            .Where(a => a.UserId == userId && a.IsDefault == true)
            .ToListAsync();

        foreach (var d in defaults)
            d.IsDefault = false;
    }

    var address = new CustomerAddress
    {
        UserId = userId,
        ReceiverName = request.ReceiverName.Trim(),
        ReceiverPhone = request.ReceiverPhone.Trim(),
        Province = request.Province,
        District = request.District,
        Ward = request.Ward,
        AddressDetail = !string.IsNullOrWhiteSpace(request.AddressDetail)
            ? request.AddressDetail.Trim()
            : fullAddress,
        FullAddress = fullAddress,
        IsDefault = request.IsDefault,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    _context.CustomerAddresses.Add(address);
    await _context.SaveChangesAsync();

    return address;
}
public async Task<CustomerAddress> UpdateAddressAsync(long userId, long addressId, AddressRequest request)
{
    var address = await _context.CustomerAddresses
        .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);

    if (address == null)
        throw new Exception("Không tìm thấy địa chỉ giao hàng hoặc địa chỉ không thuộc tài khoản của bạn.");

    if (string.IsNullOrWhiteSpace(request.ReceiverName))
        throw new Exception("Vui lòng nhập tên người nhận.");

    if (string.IsNullOrWhiteSpace(request.ReceiverPhone))
        throw new Exception("Vui lòng nhập số điện thoại người nhận.");

    var fullAddress = !string.IsNullOrWhiteSpace(request.FullAddress)
        ? request.FullAddress.Trim()
        : $"{request.AddressDetail}, {request.Ward}, {request.District}, {request.Province}"
            .Replace(",,,", ",")
            .Replace(",,", ",")
            .Trim()
            .Trim(',');

    if (string.IsNullOrWhiteSpace(fullAddress))
        throw new Exception("Vui lòng nhập địa chỉ giao hàng.");

    if (request.IsDefault)
    {
        var defaults = await _context.CustomerAddresses
            .Where(a => a.UserId == userId && a.Id != addressId)
            .ToListAsync();

        foreach (var d in defaults)
            d.IsDefault = false;
    }

    address.ReceiverName = request.ReceiverName.Trim();
    address.ReceiverPhone = request.ReceiverPhone.Trim();
    address.Province = request.Province;
    address.District = request.District;
    address.Ward = request.Ward;
    address.AddressDetail = !string.IsNullOrWhiteSpace(request.AddressDetail)
        ? request.AddressDetail.Trim()
        : fullAddress;
    address.FullAddress = fullAddress;
    address.IsDefault = request.IsDefault;
    address.UpdatedAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return address;
}

        private string GenerateToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var secret = _configuration["JwtConfig:Secret"] ?? "LuxeHome_Super_Secret_Key_2026_Pro_Project_Long_String_For_Security";
            var key = Encoding.UTF8.GetBytes(secret);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Role, user.Role?.RoleCode ?? "CUSTOMER")
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public async Task<List<UserResponse>> GetAllUsersAsync()
        {
            return await _context.Users
                .Include(u => u.Role)
                .OrderBy(u => u.Id)
                .Select(u => new UserResponse
                {
                    Id = u.Id,
                    FullName = u.FullName ?? "Thành viên VIP",
                    Email = u.Email,
                    Phone = u.Phone ?? "Chưa cập nhật",
                    RoleCode = u.Role != null ? u.Role.RoleCode : "CUSTOMER",
                    CreatedAt = u.CreatedAt.HasValue ? u.CreatedAt.Value.ToString("yyyy-MM-dd") : "",
                    Status = u.Status ?? "ACTIVE"
                })
                .ToListAsync();
        }

        public async Task<bool> UpdateUserRoleAndInfoAsync(long targetUserId, AdminUpdateUserRequest request)
        {
            var user = await _context.Users.FindAsync(targetUserId);
            if (user == null) throw new Exception("Không tìm thấy tài khoản yêu cầu.");

            if (!string.IsNullOrEmpty(request.FullName)) user.FullName = request.FullName.Trim();
            if (!string.IsNullOrEmpty(request.Phone)) user.Phone = request.Phone.Trim();
            if (!string.IsNullOrEmpty(request.Status)) user.Status = request.Status.ToUpper().Trim();

            var role = await _context.Roles.FirstOrDefaultAsync(r => r.RoleCode == request.RoleCode.ToUpper().Trim());
            if (role == null) throw new Exception($"Không tìm thấy quyền {request.RoleCode} trong hệ thống.");

            user.RoleId = role.Id;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }
        public Task<object> GenerateSocialLoginResponse(User user)
{
    var result = new
    {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email,
        Phone = user.Phone,
        AvatarUrl = user.AvatarUrl,
        Status = user.Status,
        Token = ""
    };

    return Task.FromResult<object>(result);
}
    }
}