using System;
using KurdMap.Domain.Businesses.ValueObjects;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KurdMap.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddReviewsAdvertisementsFavorites : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "opening_hours",
                table: "businesses",
                type: "text",
                nullable: true,
                oldClrType: typeof(OpeningHours),
                oldType: "jsonb",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "advertisements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    title_ku = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    title_kmr = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    title_de = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    title_en = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description_ku = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    description_kmr = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    description_de = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    description_en = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    LinkUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: true),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_advertisements", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "favorites",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_favorites", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "reviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    IsApproved = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reviews", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_advertisements_active_dates",
                table: "advertisements",
                columns: new[] { "IsActive", "StartDate", "EndDate" });

            migrationBuilder.CreateIndex(
                name: "IX_favorites_BusinessId_UserId",
                table: "favorites",
                columns: new[] { "BusinessId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_favorites_UserId",
                table: "favorites",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_reviews_BusinessId",
                table: "reviews",
                column: "BusinessId");

            migrationBuilder.CreateIndex(
                name: "IX_reviews_BusinessId_UserId",
                table: "reviews",
                columns: new[] { "BusinessId", "UserId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "advertisements");

            migrationBuilder.DropTable(
                name: "favorites");

            migrationBuilder.DropTable(
                name: "reviews");

            migrationBuilder.AlterColumn<OpeningHours>(
                name: "opening_hours",
                table: "businesses",
                type: "jsonb",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }
    }
}
