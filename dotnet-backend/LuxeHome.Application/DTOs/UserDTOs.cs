namespace LuxeHome.Application.DTOs
{
    public class RegisterRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public UserProfileResponse User { get; set; } = new();
    }

    public class UserProfileResponse
    {
        public long Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Status { get; set; }
        public string RoleCode { get; set; } = string.Empty;
    }

    public class UpdateProfileRequest
    {
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? AvatarUrl { get; set; }
    }

    public class AddressRequest
    {
        public string? ReceiverName { get; set; }
        public string? ReceiverPhone { get; set; }
        public string? Province { get; set; }
        public string? District { get; set; }
        public string? Ward { get; set; }
        public string? AddressDetail { get; set; }
        public bool IsDefault { get; set; }
    }

    public class UserResponse
    {
        public long Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string RoleCode { get; set; } = string.Empty;
        public string CreatedAt { get; set; } = string.Empty;

        // 👑 BỔ SUNG THÊM TRƯỜNG NÀY ĐỂ FIX LỖI TRONG HÌNH:
        public string Status { get; set; } = "ACTIVE";
    }

    public class AdminUpdateUserRequest
    {
        public string RoleCode { get; set; } = string.Empty;
        
        // 👑 ĐỒNG BỘ THÊM 3 TRƯỜNG NÀY ĐỂ FIX TRIỆT ĐỂ LỖI GẠCH ĐỎ:
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
    public class SocialLoginRequest {
    public string Token { get; set; }
}
}