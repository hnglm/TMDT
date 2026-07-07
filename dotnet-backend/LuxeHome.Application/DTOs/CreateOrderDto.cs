namespace LuxeHome.Application.DTOs
{
    public class CreateOrderDto
    {
        public long UserId { get; set; }

        public string? ReceiverName { get; set; }

        public string? ReceiverPhone { get; set; }

        public string? ShippingAddress { get; set; }

        public string? CustomerNote { get; set; }

        public string? CouponCode { get; set; }

        public string? PaymentMethod { get; set; }

        public decimal TotalAmount { get; set; }

        public List<CreateOrderItemDto> Items { get; set; } = new();
    }

    public class CreateOrderItemDto
    {
        public long ProductId { get; set; }

        public long VariantId { get; set; }

        public int Quantity { get; set; }
    }
}