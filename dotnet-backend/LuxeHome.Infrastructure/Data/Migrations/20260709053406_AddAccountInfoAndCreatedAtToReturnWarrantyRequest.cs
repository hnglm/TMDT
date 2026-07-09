using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LuxeHome.LuxeHome.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAccountInfoAndCreatedAtToReturnWarrantyRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AccountInfo",
                table: "return_warranty_requests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "return_warranty_requests",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AccountInfo",
                table: "return_warranty_requests");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "return_warranty_requests");
        }
    }
}
