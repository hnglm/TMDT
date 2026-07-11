using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LuxeHome.Domain.Entities
{
    [Table("customer_promotion_wallets")]
    public class CustomerPromotionWallet
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("user_id")]
        public long UserId { get; set; }

        [Column("promotion_id")]
        public long PromotionId { get; set; }

        [Column("saved_at")]
        public DateTime? SavedAt { get; set; }

        [Column("used_at")]
        public DateTime? UsedAt { get; set; }

        [Column("status")]
        public string? Status { get; set; }
    }
}