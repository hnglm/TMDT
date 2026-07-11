using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace LuxeHome.LuxeHome.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddReturnWarrantyDescriptionImages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "return_warranty_requests",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "AccountInfo",
                table: "return_warranty_requests",
                newName: "account_info");

            migrationBuilder.AddColumn<string>(
                name: "description",
                table: "return_warranty_requests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "image_urls",
                table: "return_warranty_requests",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "customer_promotion_wallets",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    promotion_id = table.Column<long>(type: "bigint", nullable: false),
                    saved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    used_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_customer_promotion_wallets", x => x.id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "customer_promotion_wallets");

            migrationBuilder.DropColumn(
                name: "description",
                table: "return_warranty_requests");

            migrationBuilder.DropColumn(
                name: "image_urls",
                table: "return_warranty_requests");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "return_warranty_requests",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "account_info",
                table: "return_warranty_requests",
                newName: "AccountInfo");
        }
    }
}
