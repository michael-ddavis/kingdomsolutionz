namespace KingdomSolutionz.Web.DTOs.Leads;

public class GetLeadsResponse
{
    public List<GetLeadResponse> Leads { get; set; } = new();
}