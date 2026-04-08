using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KurdMap.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddIsFeaturedToBusiness : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsFeatured",
                table: "businesses",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsFeatured",
                table: "businesses");
        }
    }
}
