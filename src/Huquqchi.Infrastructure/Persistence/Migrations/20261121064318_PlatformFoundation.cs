using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Huquqchi.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PlatformFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_refresh_session_user_id",
                table: "refresh_session");

            migrationBuilder.AlterColumn<string>(
                name: "phone",
                table: "user",
                type: "character varying(48)",
                maxLength: 48,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(32)",
                oldMaxLength: 32);

            migrationBuilder.AddColumn<Guid>(
                name: "avatar_file_id",
                table: "user",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "deleted_at",
                table: "user",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "email",
                table: "user",
                type: "character varying(254)",
                maxLength: 254,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_blocked",
                table: "user",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "role",
                table: "user",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Client");

            migrationBuilder.AddColumn<string>(
                name: "device",
                table: "refresh_session",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ip_address",
                table: "refresh_session",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "last_active_at",
                table: "refresh_session",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "session_started_at",
                table: "refresh_session",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            // Existing sessions: treat the token's creation as both the sign-in and the last activity.
            migrationBuilder.Sql("UPDATE refresh_session SET session_started_at = created_at, last_active_at = created_at;");

            migrationBuilder.CreateTable(
                name: "data_export_request",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_data_export_request", x => x.id);
                    table.ForeignKey(
                        name: "FK_data_export_request_user_user_id",
                        column: x => x.user_id,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "lawyer_profile",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lawyer_profile", x => x.id);
                    table.ForeignKey(
                        name: "FK_lawyer_profile_user_user_id",
                        column: x => x.user_id,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "notification_preference",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    channel_settings = table.Column<string>(type: "jsonb", nullable: false),
                    type_settings = table.Column<string>(type: "jsonb", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notification_preference", x => x.id);
                    table.ForeignKey(
                        name: "FK_notification_preference_user_user_id",
                        column: x => x.user_id,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "otp_delivery_request",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    channel = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    external_user_id = table.Column<long>(type: "bigint", nullable: true),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    attempts = table.Column<int>(type: "integer", nullable: false),
                    last_error = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    sent_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_otp_delivery_request", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "stored_file",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    owner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false),
                    purpose = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    mime = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    size = table.Column<long>(type: "bigint", nullable: false),
                    storage_key = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    sha256 = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    scan_status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stored_file", x => x.id);
                    table.ForeignKey(
                        name: "FK_stored_file_user_owner_id",
                        column: x => x.owner_id,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_stored_file_workspace_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspace",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_user_role",
                table: "user",
                column: "role");

            migrationBuilder.CreateIndex(
                name: "IX_refresh_session_user_id_revoked_at",
                table: "refresh_session",
                columns: new[] { "user_id", "revoked_at" });

            migrationBuilder.CreateIndex(
                name: "IX_data_export_request_status_created_at",
                table: "data_export_request",
                columns: new[] { "status", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_data_export_request_user_id",
                table: "data_export_request",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_lawyer_profile_status",
                table: "lawyer_profile",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_lawyer_profile_user_id",
                table: "lawyer_profile",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_notification_preference_user_id",
                table: "notification_preference",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_otp_delivery_request_phone_created_at",
                table: "otp_delivery_request",
                columns: new[] { "phone", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_otp_delivery_request_status_channel_created_at",
                table: "otp_delivery_request",
                columns: new[] { "status", "channel", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_stored_file_owner_id_is_deleted",
                table: "stored_file",
                columns: new[] { "owner_id", "is_deleted" });

            migrationBuilder.CreateIndex(
                name: "IX_stored_file_sha256",
                table: "stored_file",
                column: "sha256");

            migrationBuilder.CreateIndex(
                name: "IX_stored_file_workspace_id",
                table: "stored_file",
                column: "workspace_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "data_export_request");

            migrationBuilder.DropTable(
                name: "lawyer_profile");

            migrationBuilder.DropTable(
                name: "notification_preference");

            migrationBuilder.DropTable(
                name: "otp_delivery_request");

            migrationBuilder.DropTable(
                name: "stored_file");

            migrationBuilder.DropIndex(
                name: "IX_user_role",
                table: "user");

            migrationBuilder.DropIndex(
                name: "IX_refresh_session_user_id_revoked_at",
                table: "refresh_session");

            migrationBuilder.DropColumn(
                name: "avatar_file_id",
                table: "user");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "user");

            migrationBuilder.DropColumn(
                name: "email",
                table: "user");

            migrationBuilder.DropColumn(
                name: "is_blocked",
                table: "user");

            migrationBuilder.DropColumn(
                name: "role",
                table: "user");

            migrationBuilder.DropColumn(
                name: "device",
                table: "refresh_session");

            migrationBuilder.DropColumn(
                name: "ip_address",
                table: "refresh_session");

            migrationBuilder.DropColumn(
                name: "last_active_at",
                table: "refresh_session");

            migrationBuilder.DropColumn(
                name: "session_started_at",
                table: "refresh_session");

            migrationBuilder.AlterColumn<string>(
                name: "phone",
                table: "user",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(48)",
                oldMaxLength: 48);

            migrationBuilder.CreateIndex(
                name: "IX_refresh_session_user_id",
                table: "refresh_session",
                column: "user_id");
        }
    }
}
