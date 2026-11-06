using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Huquqchi.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SolidArchitectureConfigurations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "name",
                table: "workspace",
                type: "character varying(160)",
                maxLength: 160,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "language",
                table: "user",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "tags",
                table: "uploaded_document",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "content_type",
                table: "uploaded_document",
                type: "character varying(128)",
                maxLength: 128,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.Sql(
                "ALTER TABLE template ALTER COLUMN schema_json TYPE jsonb USING schema_json::jsonb;");

            migrationBuilder.AlterColumn<string>(
                name: "name",
                table: "template",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "code",
                table: "template",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "category",
                table: "template",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "source_url",
                table: "legal_version",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "title",
                table: "legal_section",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "number",
                table: "legal_section",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "type",
                table: "legal_document",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "title",
                table: "legal_document",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "official_url",
                table: "legal_document",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "number",
                table: "legal_document",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "title",
                table: "finding",
                type: "character varying(250)",
                maxLength: 250,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "locator",
                table: "finding",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "name",
                table: "draft",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.Sql(
                "ALTER TABLE draft ALTER COLUMN data_json TYPE jsonb USING data_json::jsonb;");

            migrationBuilder.AlterColumn<string>(
                name: "storage_key",
                table: "document_version",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "title",
                table: "conversation",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "version",
                table: "consent",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "policy",
                table: "consent",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "locator",
                table: "citation",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "resource_type",
                table: "audit_event",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "resource_id",
                table: "audit_event",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "action",
                table: "audit_event",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "user_role",
                table: "analysis",
                type: "character varying(160)",
                maxLength: 160,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "purpose",
                table: "analysis",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.CreateIndex(
                name: "IX_uploaded_document_owner_id",
                table: "uploaded_document",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "IX_message_conversation_id_created_at",
                table: "message",
                columns: new[] { "conversation_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_membership_workspace_id",
                table: "membership",
                column: "workspace_id");

            migrationBuilder.CreateIndex(
                name: "IX_legal_version_legal_document_id_effective_from",
                table: "legal_version",
                columns: new[] { "legal_document_id", "effective_from" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_legal_section_legal_version_id_number",
                table: "legal_section",
                columns: new[] { "legal_version_id", "number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_finding_analysis_id",
                table: "finding",
                column: "analysis_id");

            migrationBuilder.CreateIndex(
                name: "IX_draft_owner_id",
                table: "draft",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "IX_draft_template_id",
                table: "draft",
                column: "template_id");

            migrationBuilder.CreateIndex(
                name: "IX_draft_workspace_id_created_at",
                table: "draft",
                columns: new[] { "workspace_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_document_version_document_id_version",
                table: "document_version",
                columns: new[] { "document_id", "version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_document_version_sha256",
                table: "document_version",
                column: "sha256");

            migrationBuilder.CreateIndex(
                name: "IX_conversation_document_document_id",
                table: "conversation_document",
                column: "document_id");

            migrationBuilder.CreateIndex(
                name: "IX_conversation_owner_id",
                table: "conversation",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "IX_consent_user_id_policy_version",
                table: "consent",
                columns: new[] { "user_id", "policy", "version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_citation_legal_version_id",
                table: "citation",
                column: "legal_version_id");

            migrationBuilder.CreateIndex(
                name: "IX_citation_message_id",
                table: "citation",
                column: "message_id");

            migrationBuilder.CreateIndex(
                name: "IX_audit_event_user_id",
                table: "audit_event",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_audit_event_workspace_id_created_at",
                table: "audit_event",
                columns: new[] { "workspace_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_analysis_document_version_id",
                table: "analysis",
                column: "document_version_id");

            migrationBuilder.CreateIndex(
                name: "IX_analysis_workspace_id_created_at",
                table: "analysis",
                columns: new[] { "workspace_id", "created_at" });

            migrationBuilder.AddForeignKey(
                name: "FK_analysis_document_version_document_version_id",
                table: "analysis",
                column: "document_version_id",
                principalTable: "document_version",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_analysis_workspace_workspace_id",
                table: "analysis",
                column: "workspace_id",
                principalTable: "workspace",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_audit_event_user_user_id",
                table: "audit_event",
                column: "user_id",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_audit_event_workspace_workspace_id",
                table: "audit_event",
                column: "workspace_id",
                principalTable: "workspace",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_citation_legal_version_legal_version_id",
                table: "citation",
                column: "legal_version_id",
                principalTable: "legal_version",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_citation_message_message_id",
                table: "citation",
                column: "message_id",
                principalTable: "message",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_consent_user_user_id",
                table: "consent",
                column: "user_id",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_conversation_user_owner_id",
                table: "conversation",
                column: "owner_id",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_conversation_workspace_workspace_id",
                table: "conversation",
                column: "workspace_id",
                principalTable: "workspace",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_conversation_document_conversation_conversation_id",
                table: "conversation_document",
                column: "conversation_id",
                principalTable: "conversation",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_conversation_document_uploaded_document_document_id",
                table: "conversation_document",
                column: "document_id",
                principalTable: "uploaded_document",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_document_version_uploaded_document_document_id",
                table: "document_version",
                column: "document_id",
                principalTable: "uploaded_document",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_draft_template_template_id",
                table: "draft",
                column: "template_id",
                principalTable: "template",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_draft_user_owner_id",
                table: "draft",
                column: "owner_id",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_draft_workspace_workspace_id",
                table: "draft",
                column: "workspace_id",
                principalTable: "workspace",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_finding_analysis_analysis_id",
                table: "finding",
                column: "analysis_id",
                principalTable: "analysis",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_legal_section_legal_version_legal_version_id",
                table: "legal_section",
                column: "legal_version_id",
                principalTable: "legal_version",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_legal_version_legal_document_legal_document_id",
                table: "legal_version",
                column: "legal_document_id",
                principalTable: "legal_document",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_membership_user_user_id",
                table: "membership",
                column: "user_id",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_membership_workspace_workspace_id",
                table: "membership",
                column: "workspace_id",
                principalTable: "workspace",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_message_conversation_conversation_id",
                table: "message",
                column: "conversation_id",
                principalTable: "conversation",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_uploaded_document_user_owner_id",
                table: "uploaded_document",
                column: "owner_id",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_uploaded_document_workspace_workspace_id",
                table: "uploaded_document",
                column: "workspace_id",
                principalTable: "workspace",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_analysis_document_version_document_version_id",
                table: "analysis");

            migrationBuilder.DropForeignKey(
                name: "FK_analysis_workspace_workspace_id",
                table: "analysis");

            migrationBuilder.DropForeignKey(
                name: "FK_audit_event_user_user_id",
                table: "audit_event");

            migrationBuilder.DropForeignKey(
                name: "FK_audit_event_workspace_workspace_id",
                table: "audit_event");

            migrationBuilder.DropForeignKey(
                name: "FK_citation_legal_version_legal_version_id",
                table: "citation");

            migrationBuilder.DropForeignKey(
                name: "FK_citation_message_message_id",
                table: "citation");

            migrationBuilder.DropForeignKey(
                name: "FK_consent_user_user_id",
                table: "consent");

            migrationBuilder.DropForeignKey(
                name: "FK_conversation_user_owner_id",
                table: "conversation");

            migrationBuilder.DropForeignKey(
                name: "FK_conversation_workspace_workspace_id",
                table: "conversation");

            migrationBuilder.DropForeignKey(
                name: "FK_conversation_document_conversation_conversation_id",
                table: "conversation_document");

            migrationBuilder.DropForeignKey(
                name: "FK_conversation_document_uploaded_document_document_id",
                table: "conversation_document");

            migrationBuilder.DropForeignKey(
                name: "FK_document_version_uploaded_document_document_id",
                table: "document_version");

            migrationBuilder.DropForeignKey(
                name: "FK_draft_template_template_id",
                table: "draft");

            migrationBuilder.DropForeignKey(
                name: "FK_draft_user_owner_id",
                table: "draft");

            migrationBuilder.DropForeignKey(
                name: "FK_draft_workspace_workspace_id",
                table: "draft");

            migrationBuilder.DropForeignKey(
                name: "FK_finding_analysis_analysis_id",
                table: "finding");

            migrationBuilder.DropForeignKey(
                name: "FK_legal_section_legal_version_legal_version_id",
                table: "legal_section");

            migrationBuilder.DropForeignKey(
                name: "FK_legal_version_legal_document_legal_document_id",
                table: "legal_version");

            migrationBuilder.DropForeignKey(
                name: "FK_membership_user_user_id",
                table: "membership");

            migrationBuilder.DropForeignKey(
                name: "FK_membership_workspace_workspace_id",
                table: "membership");

            migrationBuilder.DropForeignKey(
                name: "FK_message_conversation_conversation_id",
                table: "message");

            migrationBuilder.DropForeignKey(
                name: "FK_uploaded_document_user_owner_id",
                table: "uploaded_document");

            migrationBuilder.DropForeignKey(
                name: "FK_uploaded_document_workspace_workspace_id",
                table: "uploaded_document");

            migrationBuilder.DropIndex(
                name: "IX_uploaded_document_owner_id",
                table: "uploaded_document");

            migrationBuilder.DropIndex(
                name: "IX_message_conversation_id_created_at",
                table: "message");

            migrationBuilder.DropIndex(
                name: "IX_membership_workspace_id",
                table: "membership");

            migrationBuilder.DropIndex(
                name: "IX_legal_version_legal_document_id_effective_from",
                table: "legal_version");

            migrationBuilder.DropIndex(
                name: "IX_legal_section_legal_version_id_number",
                table: "legal_section");

            migrationBuilder.DropIndex(
                name: "IX_finding_analysis_id",
                table: "finding");

            migrationBuilder.DropIndex(
                name: "IX_draft_owner_id",
                table: "draft");

            migrationBuilder.DropIndex(
                name: "IX_draft_template_id",
                table: "draft");

            migrationBuilder.DropIndex(
                name: "IX_draft_workspace_id_created_at",
                table: "draft");

            migrationBuilder.DropIndex(
                name: "IX_document_version_document_id_version",
                table: "document_version");

            migrationBuilder.DropIndex(
                name: "IX_document_version_sha256",
                table: "document_version");

            migrationBuilder.DropIndex(
                name: "IX_conversation_document_document_id",
                table: "conversation_document");

            migrationBuilder.DropIndex(
                name: "IX_conversation_owner_id",
                table: "conversation");

            migrationBuilder.DropIndex(
                name: "IX_consent_user_id_policy_version",
                table: "consent");

            migrationBuilder.DropIndex(
                name: "IX_citation_legal_version_id",
                table: "citation");

            migrationBuilder.DropIndex(
                name: "IX_citation_message_id",
                table: "citation");

            migrationBuilder.DropIndex(
                name: "IX_audit_event_user_id",
                table: "audit_event");

            migrationBuilder.DropIndex(
                name: "IX_audit_event_workspace_id_created_at",
                table: "audit_event");

            migrationBuilder.DropIndex(
                name: "IX_analysis_document_version_id",
                table: "analysis");

            migrationBuilder.DropIndex(
                name: "IX_analysis_workspace_id_created_at",
                table: "analysis");

            migrationBuilder.AlterColumn<string>(
                name: "name",
                table: "workspace",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(160)",
                oldMaxLength: 160);

            migrationBuilder.AlterColumn<string>(
                name: "language",
                table: "user",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(16)",
                oldMaxLength: 16);

            migrationBuilder.AlterColumn<string>(
                name: "tags",
                table: "uploaded_document",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "content_type",
                table: "uploaded_document",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(128)",
                oldMaxLength: 128);

            migrationBuilder.Sql(
                "ALTER TABLE template ALTER COLUMN schema_json TYPE text USING schema_json::text;");

            migrationBuilder.AlterColumn<string>(
                name: "name",
                table: "template",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<string>(
                name: "code",
                table: "template",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "category",
                table: "template",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "source_url",
                table: "legal_version",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(2048)",
                oldMaxLength: 2048);

            migrationBuilder.AlterColumn<string>(
                name: "title",
                table: "legal_section",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "number",
                table: "legal_section",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "type",
                table: "legal_document",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(80)",
                oldMaxLength: 80);

            migrationBuilder.AlterColumn<string>(
                name: "title",
                table: "legal_document",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "official_url",
                table: "legal_document",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(2048)",
                oldMaxLength: 2048);

            migrationBuilder.AlterColumn<string>(
                name: "number",
                table: "legal_document",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "title",
                table: "finding",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(250)",
                oldMaxLength: 250);

            migrationBuilder.AlterColumn<string>(
                name: "locator",
                table: "finding",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "name",
                table: "draft",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255);

            migrationBuilder.Sql(
                "ALTER TABLE draft ALTER COLUMN data_json TYPE text USING data_json::text;");

            migrationBuilder.AlterColumn<string>(
                name: "storage_key",
                table: "document_version",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "title",
                table: "conversation",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<string>(
                name: "version",
                table: "consent",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(32)",
                oldMaxLength: 32);

            migrationBuilder.AlterColumn<string>(
                name: "policy",
                table: "consent",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "locator",
                table: "citation",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<string>(
                name: "resource_type",
                table: "audit_event",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "resource_id",
                table: "audit_event",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "action",
                table: "audit_event",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "user_role",
                table: "analysis",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(160)",
                oldMaxLength: 160,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "purpose",
                table: "analysis",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000);
        }
    }
}
