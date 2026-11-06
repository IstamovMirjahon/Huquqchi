using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Huquqchi.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class TelegramOtpChallenges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "otp_challenge",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    code_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    channel = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    external_user_id = table.Column<long>(type: "bigint", nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    attempts = table.Column<int>(type: "integer", nullable: false),
                    is_used = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_otp_challenge", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_otp_challenge_expires_at",
                table: "otp_challenge",
                column: "expires_at");

            migrationBuilder.CreateIndex(
                name: "IX_otp_challenge_phone_created_at",
                table: "otp_challenge",
                columns: new[] { "phone", "created_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "otp_challenge");
        }
    }
}
