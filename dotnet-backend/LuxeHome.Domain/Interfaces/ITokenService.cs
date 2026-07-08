using LuxeHome.Domain.Entities;

namespace LuxeHome.Domain.Interfaces
{
    public interface ITokenService
    {
        // Hàm này nhận vào User và trả về một chuỗi JWT hợp lệ
        string CreateToken(User user);
    }
}