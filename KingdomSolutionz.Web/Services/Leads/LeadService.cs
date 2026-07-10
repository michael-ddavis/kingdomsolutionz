using System.Text.Json;
using KingdomSolutionz.Web.DTOs.Leads;
using KingdomSolutionz.Web.Tables;

namespace KingdomSolutionz.Web.Services.Leads;

public class LeadService : ILeadService
{
    private readonly LeadTable _leadTable;

    public LeadService(LeadTable leadTable)
    {
        _leadTable = leadTable;
    }

    public async Task<CreateLeadResponse> CreateLeadAsync(CreateLeadRequest request)
    {
        ValidateLeadRequest(
            request.FullName,
            request.Email,
            request.ProjectType,
            request.RecommendedPackage);

        var createdAtUtc = DateTime.UtcNow;

        var lead = new LeadTableRow
        {
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim(),
            Phone = request.Phone,
            BusinessName = request.BusinessName,
            CurrentWebsiteUrl = request.CurrentWebsiteUrl,
            ProjectType = request.ProjectType.Trim(),
            Timeline = request.Timeline,
            BudgetRange = request.BudgetRange,
            FeaturesJson = JsonSerializer.Serialize(request.Features ?? new List<string>()),
            Message = request.Message,
            RecommendedPackage = request.RecommendedPackage.Trim(),
            CreatedAtUtc = createdAtUtc
        };

        var leadId = await _leadTable.CreateAsync(lead);

        return new CreateLeadResponse
        {
            LeadId = leadId,
            Message = "Project request received.",
            RecommendedPackage = lead.RecommendedPackage,
            ReceivedAtUtc = createdAtUtc
        };
    }

    public async Task<GetLeadResponse?> GetLeadByIdAsync(int id)
    {
        var lead = await _leadTable.GetByIdAsync(id);

        return lead == null
            ? null
            : MapToGetLeadResponse(lead);
    }

    public async Task<GetLeadsResponse> GetLeadsAsync()
    {
        var leads = await _leadTable.GetAllAsync();

        return new GetLeadsResponse
        {
            Leads = leads.Select(MapToGetLeadResponse).ToList()
        };
    }

    public async Task<UpdateLeadResponse> UpdateLeadAsync(int id, UpdateLeadRequest request)
    {
        ValidateLeadRequest(
            request.FullName,
            request.Email,
            request.ProjectType,
            request.RecommendedPackage);

        var lead = new LeadTableRow
        {
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim(),
            Phone = request.Phone,
            BusinessName = request.BusinessName,
            CurrentWebsiteUrl = request.CurrentWebsiteUrl,
            ProjectType = request.ProjectType.Trim(),
            Timeline = request.Timeline,
            BudgetRange = request.BudgetRange,
            FeaturesJson = JsonSerializer.Serialize(request.Features ?? new List<string>()),
            Message = request.Message,
            RecommendedPackage = request.RecommendedPackage.Trim()
        };

        var updated = await _leadTable.UpdateAsync(id, lead);

        return new UpdateLeadResponse
        {
            Updated = updated,
            Message = updated
                ? "Lead updated."
                : "Lead was not found."
        };
    }

    public async Task<DeleteLeadResponse> DeleteLeadAsync(int id)
    {
        var deleted = await _leadTable.DeleteAsync(id);

        return new DeleteLeadResponse
        {
            Deleted = deleted,
            Message = deleted
                ? "Lead deleted."
                : "Lead was not found."
        };
    }

    private static void ValidateLeadRequest(
        string fullName,
        string email,
        string projectType,
        string recommendedPackage)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new ArgumentException("Full name is required.");
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email is required.");
        }

        if (string.IsNullOrWhiteSpace(projectType))
        {
            throw new ArgumentException("Project type is required.");
        }

        if (string.IsNullOrWhiteSpace(recommendedPackage))
        {
            throw new ArgumentException("Recommended package is required.");
        }
    }

    private static GetLeadResponse MapToGetLeadResponse(LeadTableRow lead)
    {
        return new GetLeadResponse
        {
            Id = lead.Id,
            FullName = lead.FullName,
            Email = lead.Email,
            Phone = lead.Phone,
            BusinessName = lead.BusinessName,
            CurrentWebsiteUrl = lead.CurrentWebsiteUrl,
            ProjectType = lead.ProjectType,
            Timeline = lead.Timeline,
            BudgetRange = lead.BudgetRange,
            Features = DeserializeFeatures(lead.FeaturesJson),
            Message = lead.Message,
            RecommendedPackage = lead.RecommendedPackage,
            CreatedAtUtc = lead.CreatedAtUtc,
            UpdatedAtUtc = lead.UpdatedAtUtc
        };
    }

    private static List<string> DeserializeFeatures(string featuresJson)
    {
        if (string.IsNullOrWhiteSpace(featuresJson))
        {
            return new List<string>();
        }

        try
        {
            return JsonSerializer.Deserialize<List<string>>(featuresJson) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }
}