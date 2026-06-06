using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KurdMap.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessSearchIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "ix_businesses_city_id",
                table: "businesses",
                column: "city_id");

            // Full-text search GIN index. The expression MUST match the tsvector
            // built in BusinessRepository.ApplyFullTextSearch / OrderBySearchRelevance
            // (config 'simple', columns in order ku, de, kmr, en) so the planner can
            // use this index instead of a sequential scan.
            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ix_businesses_search ON businesses USING gin (
                    to_tsvector('simple',
                        name_ku || ' ' || name_de || ' ' ||
                        COALESCE(name_kmr, '') || ' ' || COALESCE(name_en, '')));");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP INDEX IF EXISTS ix_businesses_search;");

            migrationBuilder.DropIndex(
                name: "ix_businesses_city_id",
                table: "businesses");
        }
    }
}
