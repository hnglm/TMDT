using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using LuxeHome.Domain.Entities;
using LuxeHome.Domain.Interfaces; // Cần dùng cái này để lấy ITokenService đã định nghĩa ở Domain
using LuxeHome.API.Configurations;

namespace LuxeHome.Infrastructure.Services
{
    // XÓA PHẦN INTERFACE Ở ĐÂY ĐI

    public class TokenService : ITokenService // Bây giờ nó sẽ tự hiểu ITokenService từ Domain.Interfaces
    {
        public string CreateToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("role", "CUSTOMER")
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtSettings.Secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(1), // Dùng UtcNow cho chuẩn
                SigningCredentials = creds,
                Issuer = JwtSettings.Issuer,
                Audience = JwtSettings.Audience
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }
    }
}