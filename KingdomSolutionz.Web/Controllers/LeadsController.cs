using Microsoft.AspNetCore.Mvc;

namespace KingdomSolutionz.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeadsController : ControllerBase
{
    [HttpPost]
    public IActionResult CreateLead([FromBody] CreateLeadRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new
            {
                message = "Full name and email are required."
            });
        }

        var leadId = Guid.NewGuid();

        Console.WriteLine("New KingdomSolutionz Lead");
        Console.WriteLine($"Lead Id: {leadId}");
        Console.WriteLine($"Name: {request.FullName}");
        Console.WriteLine($"Email: {request.Email}");
        Console.WriteLine($"Business: {request.BusinessName}");
        Console.WriteLine($"Recommended Package: {request.RecommendedPackage}");

        return Ok(new
        {
            leadId,
            message = "Project request received.",
            recommendedPackage = request.RecommendedPackage,
            receivedAtUtc = DateTime.UtcNow
        });
    }
}

public class CreateLeadRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? BusinessName { get; set; }
    public string? CurrentWebsiteUrl { get; set; }
    public string ProjectType { get; set; } = string.Empty;
    public string? Timeline { get; set; }
    public string? BudgetRange { get; set; }
    public List<string> Features { get; set; } = [];
    public string? Message { get; set; }
    public string RecommendedPackage { get; set; } = string.Empty;
}