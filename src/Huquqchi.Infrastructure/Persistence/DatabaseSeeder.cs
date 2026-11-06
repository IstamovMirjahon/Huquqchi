using Huquqchi.Domain;
using Microsoft.EntityFrameworkCore;

namespace Huquqchi.Infrastructure;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(AppDbContext db, CancellationToken cancellationToken = default)
    {
        if (await db.Templates.AnyAsync(cancellationToken)) return;
        db.Templates.AddRange(
            new Template("rental", "Ijara shartnomasi", "Shartnoma", "{\"fields\":[\"landlord\",\"tenant\",\"subject\",\"price\",\"term\"]}", "IJARA SHARTNOMASI\nIjaraga beruvchi: {{landlord}}\nIjarachi: {{tenant}}\nObyekt: {{subject}}\nNarx: {{price}}\nMuddat: {{term}}"),
            new Template("service", "Xizmat ko‘rsatish shartnomasi", "Shartnoma", "{\"fields\":[\"provider\",\"customer\",\"service\",\"price\",\"term\"]}", "XIZMAT KO‘RSATISH SHARTNOMASI\nIjrochi: {{provider}}\nBuyurtmachi: {{customer}}\nXizmat: {{service}}\nNarx: {{price}}\nMuddat: {{term}}"),
            new Template("sale", "Oldi-sotdi shartnomasi", "Shartnoma", "{\"fields\":[\"seller\",\"buyer\",\"subject\",\"price\"]}", "OLDI-SOTDI SHARTNOMASI\nSotuvchi: {{seller}}\nXaridor: {{buyer}}\nPredmet: {{subject}}\nNarx: {{price}}"));
        await db.SaveChangesAsync(cancellationToken);
    }
}
