using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace LuxeHome.Infrastructure.Data
{
    public class LuxeHomeDbContextFactory : IDesignTimeDbContextFactory<LuxeHomeDbContext>
    {
        public LuxeHomeDbContext CreateDbContext(string[] args)
        {
            string apiFolderPath = Path.Combine(Directory.GetCurrentDirectory(), "LuxeHome.API");
            IConfigurationRoot configuration = new ConfigurationBuilder()
                .SetBasePath(apiFolderPath)
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddEnvironmentVariables()
                .Build();

            var builder = new DbContextOptionsBuilder<LuxeHomeDbContext>();

            var connectionString = configuration.GetConnectionString("DefaultConnection");

            builder.UseNpgsql(connectionString);

            return new LuxeHomeDbContext(builder.Options);
        }
    }
}