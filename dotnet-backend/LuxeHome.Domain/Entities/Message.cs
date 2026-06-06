namespace LuxeHome.Domain.Entities
{
    public class Message
    {
        public string Role { get; set; } = "user"; // "user" hoặc "model"
        public string Content { get; set; } = string.Empty;
    }
}
