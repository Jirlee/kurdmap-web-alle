using System;
using KurdMap.Domain.Businesses.ValueObjects;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace KurdMap.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "categories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    name_ku = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    name_kmr = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    name_de = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    name_en = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Slug = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Icon = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_categories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "cities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    name_ku = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    name_kmr = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    name_de = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    name_en = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Slug = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Latitude = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: false),
                    Longitude = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "roles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FullName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: true),
                    SecurityStamp = table.Column<string>(type: "text", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "role_claims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoleId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_role_claims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_role_claims_roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "businesses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    name_ku = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    name_kmr = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    name_de = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    name_en = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Slug = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    description_ku = table.Column<string>(type: "text", nullable: false),
                    description_kmr = table.Column<string>(type: "text", nullable: false),
                    description_de = table.Column<string>(type: "text", nullable: false),
                    description_en = table.Column<string>(type: "text", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    street = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    postal_code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    city_id = table.Column<Guid>(type: "uuid", nullable: false),
                    latitude = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: false),
                    longitude = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: false),
                    Phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Website = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    opening_hours = table.Column<OpeningHours>(type: "jsonb", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    IsVerified = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    OwnerId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_businesses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_businesses_categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_businesses_users_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "user_claims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_claims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_claims_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_logins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    ProviderKey = table.Column<string>(type: "text", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_logins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_user_logins_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_roles",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoleId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_roles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_user_roles_roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_user_roles_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_tokens",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_tokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_user_tokens_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "business_images",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    Url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    AltText = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_business_images", x => x.Id);
                    table.ForeignKey(
                        name: "FK_business_images_businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalTable: "businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "business_services",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    name_ku = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    name_kmr = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    name_de = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    name_en = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description_ku = table.Column<string>(type: "text", nullable: true),
                    description_kmr = table.Column<string>(type: "text", nullable: true),
                    description_de = table.Column<string>(type: "text", nullable: true),
                    description_en = table.Column<string>(type: "text", nullable: true),
                    Price = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_business_services", x => x.Id);
                    table.ForeignKey(
                        name: "FK_business_services_businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalTable: "businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "menu_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    name_ku = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    name_kmr = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    name_de = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    name_en = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description_ku = table.Column<string>(type: "text", nullable: true),
                    description_kmr = table.Column<string>(type: "text", nullable: true),
                    description_de = table.Column<string>(type: "text", nullable: true),
                    description_en = table.Column<string>(type: "text", nullable: true),
                    Price = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    ImageUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_menu_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_menu_items_businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalTable: "businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "categories",
                columns: new[] { "Id", "CreatedAt", "Icon", "Slug", "SortOrder", "UpdatedAt", "name_de", "name_en", "name_kmr", "name_ku" },
                values: new object[,]
                {
                    { new Guid("d1a1b2c3-0001-0001-0001-000000000001"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "material-symbols:restaurant", "restaurant", 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Restaurant", "Restaurant", "Xwaringeh", "چێشتخانە" },
                    { new Guid("d1a1b2c3-0001-0001-0001-000000000002"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "material-symbols:local-grocery-store", "grocery", 2, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Lebensmittelgeschäft", "Grocery", "Dikana firotanê", "سوپەرمارکێت" },
                    { new Guid("d1a1b2c3-0001-0001-0001-000000000003"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "material-symbols:content-cut", "barber", 3, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Friseur", "Barber", "Berber", "دەلاک" },
                    { new Guid("d1a1b2c3-0001-0001-0001-000000000004"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "material-symbols:bakery-dining", "bakery", 4, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Bäckerei", "Bakery", "Firna nan", "نانەوا" },
                    { new Guid("d1a1b2c3-0001-0001-0001-000000000005"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "material-symbols:flight", "travel-agency", 5, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Reisebüro", "Travel Agency", "Ajansa rêwîtiyê", "ئاژانسی گەشتوگوزار" },
                    { new Guid("d1a1b2c3-0001-0001-0001-000000000006"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "material-symbols:medical-services", "doctor", 6, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Arzt", "Doctor", "Doktor", "دکتۆر" },
                    { new Guid("d1a1b2c3-0001-0001-0001-000000000007"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "material-symbols:gavel", "lawyer", 7, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Anwalt", "Lawyer", "Parêzer", "پارێزەر" },
                    { new Guid("d1a1b2c3-0001-0001-0001-000000000008"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "material-symbols:house", "real-estate", 8, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Immobilien", "Real Estate", "Xanî û milk", "خانووبەرە" },
                    { new Guid("d1a1b2c3-0001-0001-0001-000000000009"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "material-symbols:more-horiz", "other", 9, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Sonstiges", "Other", "Yên din", "هی تر" }
                });

            migrationBuilder.InsertData(
                table: "cities",
                columns: new[] { "Id", "CreatedAt", "Latitude", "Longitude", "Slug", "UpdatedAt", "name_de", "name_en", "name_kmr", "name_ku" },
                values: new object[,]
                {
                    { new Guid("c1c1c1c1-0001-0001-0001-000000000001"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 50.9375m, 6.9603m, "koeln", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Köln", "Cologne", "Köln", "کۆڵن" },
                    { new Guid("c1c1c1c1-0001-0001-0001-000000000002"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 51.2277m, 6.7735m, "duesseldorf", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Düsseldorf", "Düsseldorf", "Düsseldorf", "دۆسڵدۆرف" }
                });

            migrationBuilder.CreateIndex(
                name: "ix_business_images_sort",
                table: "business_images",
                columns: new[] { "BusinessId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "ix_business_services_sort",
                table: "business_services",
                columns: new[] { "BusinessId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "ix_businesses_city_category",
                table: "businesses",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "ix_businesses_owner",
                table: "businesses",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "ix_businesses_slug",
                table: "businesses",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_businesses_status",
                table: "businesses",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "ix_categories_slug",
                table: "categories",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_categories_sort",
                table: "categories",
                column: "SortOrder");

            migrationBuilder.CreateIndex(
                name: "ix_cities_slug",
                table: "cities",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_menu_items_sort",
                table: "menu_items",
                columns: new[] { "BusinessId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_role_claims_RoleId",
                table: "role_claims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "roles",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_claims_UserId",
                table: "user_claims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_user_logins_UserId",
                table: "user_logins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_user_roles_RoleId",
                table: "user_roles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "users",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "users",
                column: "NormalizedUserName",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "business_images");

            migrationBuilder.DropTable(
                name: "business_services");

            migrationBuilder.DropTable(
                name: "cities");

            migrationBuilder.DropTable(
                name: "menu_items");

            migrationBuilder.DropTable(
                name: "role_claims");

            migrationBuilder.DropTable(
                name: "user_claims");

            migrationBuilder.DropTable(
                name: "user_logins");

            migrationBuilder.DropTable(
                name: "user_roles");

            migrationBuilder.DropTable(
                name: "user_tokens");

            migrationBuilder.DropTable(
                name: "businesses");

            migrationBuilder.DropTable(
                name: "roles");

            migrationBuilder.DropTable(
                name: "categories");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
