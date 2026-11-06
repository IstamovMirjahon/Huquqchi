using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Huquqchi.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class BackfillTelegramAccounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                INSERT INTO telegram_account (id, telegram_user_id, phone, created_at, updated_at)
                SELECT gen_random_uuid(), candidate.external_user_id, candidate.phone, candidate.created_at, NULL
                FROM (
                    SELECT DISTINCT ON (external_user_id)
                        external_user_id,
                        phone,
                        created_at
                    FROM otp_challenge
                    WHERE channel = 'Telegram' AND external_user_id <> 0
                    ORDER BY external_user_id, created_at DESC
                ) AS candidate
                WHERE NOT EXISTS (
                    SELECT 1 FROM telegram_account account
                    WHERE account.telegram_user_id = candidate.external_user_id
                       OR account.phone = candidate.phone
                )
                ON CONFLICT DO NOTHING;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Historical account links are user data and must not be deleted on rollback.
        }
    }
}
