using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;

namespace KingdomSolutionz.Web.Security;

public static class KingdomIdentity
{
    public const string Scheme = "KingdomOS.Identity";
    public const string TenantClaim = "kingdom:tenant";
    public const string TenantRoleClaim = "kingdom:tenant-role";
    public const string PermissionClaim = "kingdom:permission";

    public static IServiceCollection AddKingdomIdentity(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var keyPath = configuration["KingdomOS:Identity:KeyPath"];
        if (!string.IsNullOrWhiteSpace(keyPath))
        {
            Directory.CreateDirectory(keyPath);
            services.AddDataProtection()
                .PersistKeysToFileSystem(new DirectoryInfo(keyPath))
                .SetApplicationName(Scheme);
        }

        services
            .AddAuthentication(Scheme)
            .AddCookie(Scheme, options =>
            {
                options.Cookie.Name = ".KingdomOS.Identity";
                options.Cookie.HttpOnly = true;
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.SlidingExpiration = true;
                options.ExpireTimeSpan = TimeSpan.FromHours(12);
                options.Events.OnRedirectToLogin = context =>
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                };
                options.Events.OnRedirectToAccessDenied = context =>
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return Task.CompletedTask;
                };
            });
        services.AddAuthorization();
        return services;
    }
}
