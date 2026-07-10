namespace KingdomSolutionz.Web.DTOs.Leads;

public class GetLeadResponse
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? BusinessName { get; set; }
    public string? CurrentWebsiteUrl { get; set; }
    public string ProjectType { get; set; } = string.Empty;
    public string? Timeline { get; set; }
    public string? BudgetRange { get; set; }
    public List<string> Features { get; set; } = new();
    public string? Message { get; set; }
    public string RecommendedPackage { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}