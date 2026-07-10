using KingdomSolutionz.Web.DTOs.Leads;

namespace KingdomSolutionz.Web.Services.Leads;

public interface ILeadService
{
    Task<CreateLeadResponse> CreateLeadAsync(CreateLeadRequest request);

    Task<GetLeadResponse?> GetLeadByIdAsync(int id);

    Task<GetLeadsResponse> GetLeadsAsync();

    Task<UpdateLeadResponse> UpdateLeadAsync(int id, UpdateLeadRequest request);

    Task<DeleteLeadResponse> DeleteLeadAsync(int id);
}