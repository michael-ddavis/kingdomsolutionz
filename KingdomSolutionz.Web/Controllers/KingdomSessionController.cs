using System.Security.Claims;
using KingdomSolutionz.Web.Security;
using Microsoft.AspNetCore.Mvc;

namespace KingdomSolutionz.Web.Controllers;

[ApiController]
[Route("api/kingdomos/session")]
public sealed class KingdomSessionController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        var authenticated = User.Identity?.IsAuthenticated == true;
        return Ok(new
        {
            isAuthenticated = authenticated,
            subject = authenticated
                ? User.FindFirstValue(ClaimTypes.NameIdentifier)
                : null,
            displayName = authenticated ? User.Identity?.Name : null,
            tenantId = authenticated
                ? User.FindFirstValue(KingdomIdentity.TenantClaim)
                : null,
            tenantRole = authenticated
                ? User.FindFirstValue(KingdomIdentity.TenantRoleClaim)
                : null,
            roles = authenticated
                ? User.FindAll(ClaimTypes.Role).Select(claim => claim.Value).ToArray()
                : []
        });
    }
}
