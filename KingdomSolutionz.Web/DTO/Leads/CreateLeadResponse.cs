namespace KingdomSolutionz.Web.DTOs.Leads;

public class CreateLeadResponse
{
    public int LeadId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string RecommendedPackage { get; set; } = string.Empty;
    public DateTime ReceivedAtUtc { get; set; }
}