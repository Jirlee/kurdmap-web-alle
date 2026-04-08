using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KurdMap.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessDiscounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "discount_description_de",
                table: "businesses",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "discount_description_en",
                table: "businesses",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "discount_description_kmr",
                table: "businesses",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "discount_description_ku",
                table: "businesses",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "discount_end_date",
                table: "businesses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "discount_percentage",
                table: "businesses",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "discount_start_date",
                table: "businesses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "contact_messages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Message = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contact_messages", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_contact_messages_CreatedAt",
                table: "contact_messages",
                column: "CreatedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "contact_messages");

            migrationBuilder.DropColumn(
                name: "discount_description_de",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "discount_description_en",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "discount_description_kmr",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "discount_description_ku",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "discount_end_date",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "discount_percentage",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "discount_start_date",
                table: "businesses");
        }
    }
}
