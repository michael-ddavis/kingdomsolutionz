using System.Net.Http.Json;
using System.Security.Claims;
using KingdomSolutionz.Web.Security;
using Microsoft.AspNetCore.Mvc;

namespace KingdomSolutionz.Web.Controllers;

public sealed record KingdomModuleRuntime(
    string Key,
    string Name,
    bool Enabled,
    string Url,
    string HealthUrl);

[ApiController]
[Route("api/kingdomos/session")]
public sealed class KingdomSessionController(
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    ILogger<KingdomSessionController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var authenticated = User.Identity?.IsAuthenticated == true;
        var tenantValue = User.FindFirstValue(KingdomIdentity.TenantClaim)
            ?? configuration["KingdomOS:TenantId"];
        var subject = authenticated
            ? User.FindFirstValue(ClaimTypes.NameIdentifier)
            : null;
        var tenantRole = authenticated
            ? User.FindFirstValue(KingdomIdentity.TenantRoleClaim)
            : null;
        var enabledModules = await GetEnabledModulesAsync(
            tenantValue,
            subject,
            tenantRole,
            cancellationToken);

        return Ok(new
        {
            isAuthenticated = authenticated,
            subject,
            displayName = authenticated ? User.Identity?.Name : null,
            tenantId = tenantValue,
            tenantRole,
            module = "engagements",
            product = "Kingdom Engagements",
            roles = authenticated
                ? User.FindAll(ClaimTypes.Role).Select(claim => claim.Value).ToArray()
                : [],
            enabledModules
        });
    }

    private async Task<string[]> GetEnabledModulesAsync(
        string? tenantValue,
        string? subject,
        string? tenantRole,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(tenantValue, out _))
        {
            return [];
        }

        var platformUrl = (configuration["KingdomOS:PlatformUrl"]
            ?? "http://localhost:5100").TrimEnd('/');
        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"{platformUrl}/api/modules");
        request.Headers.TryAddWithoutValidation("X-Kingdom-Tenant", tenantValue);
        request.Headers.TryAddWithoutValidation(
            "X-Kingdom-Subject",
            string.IsNullOrWhiteSpace(subject) ? "engagements-session" : subject);
        request.Headers.TryAddWithoutValidation(
            "X-Kingdom-Role",
            string.IsNullOrWhiteSpace(tenantRole) ? "viewer" : tenantRole);

        try
        {
            using var response = await httpClientFactory
                .CreateClient()
                .SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "Platform returned {StatusCode} while Engagements resolved module entitlements.",
                    response.StatusCode);
                return [];
            }

            var modules = await response.Content
                .ReadFromJsonAsync<KingdomModuleRuntime[]>(
                    cancellationToken: cancellationToken);
            return modules?
                .Where(module => module.Enabled)
                .Select(module => module.Key)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(key => key)
                .ToArray()
                ?? [];
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogWarning(
                exception,
                "Engagements failed closed while resolving module entitlements.");
            return [];
        }
    }
}
