using Microsoft.AspNetCore.Mvc;

namespace KingdomSolutionz.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "ok",
            app = "KingdomSolutionz",
            message = "The API is running.",
            timestampUtc = DateTime.UtcNow
        });
    }
}