namespace LuxeHome.API.Configurations
{
    public static class JwtSettings
    {
        // Secret Key này phải đủ dài (ít nhất 16-32 ký tự)
        public const string Secret = "LuxeHome_Super_Secret_Key_2026_Pro_Project_Long_String_For_Security";
        
        // Bạn có thể thêm các thông số khác tại đây
        public const string Issuer = "LuxeHome";
        public const string Audience = "LuxeHomeUsers";
    }
}