using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LuxeHome.LuxeHome.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCommentCreatedAtToProductReview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Comment",
                table: "product_reviews",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "product_reviews",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Comment",
                table: "product_reviews");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "product_reviews");
        }
    }
}
