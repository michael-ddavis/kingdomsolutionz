using KingdomSolutionz.Web.Services.Leads;
using Microsoft.AspNetCore.Mvc;
using KingdomSolutionz.Web.DTOs.Leads;

namespace KingdomSolutionz.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeadsController : ControllerBase
{
    private readonly ILeadService _leadService;

    public LeadsController(ILeadService leadService)
    {
        _leadService = leadService;
    }

    [Route("")]
    [HttpPost]
    [Produces(typeof(CreateLeadResponse))]
    public async Task<IActionResult> CreateLead([FromBody] CreateLeadRequest request)
    {
        CreateLeadResponse response = await _leadService.CreateLeadAsync(request);
        return Ok(response);
    }

    [Route("")]
    [HttpGet]
    [Produces(typeof(GetLeadsResponse))]
    public async Task<IActionResult> GetLeads()
    {
        GetLeadsResponse response = await _leadService.GetLeadsAsync();
        return Ok(response);
    }

    [Route("{id:int}")]
    [HttpGet]
    [Produces(typeof(GetLeadResponse))]
    public async Task<IActionResult> GetLeadById(int id)
    {
        GetLeadResponse? response = await _leadService.GetLeadByIdAsync(id);

        if (response == null)
        {
            return NotFound(new
            {
                message = "Lead was not found."
            });
        }

        return Ok(response);
    }

    [Route("{id:int}")]
    [HttpPut]
    [Produces(typeof(UpdateLeadResponse))]
    public async Task<IActionResult> UpdateLead(
        int id,
        [FromBody] UpdateLeadRequest request)
    {
        UpdateLeadResponse response = await _leadService.UpdateLeadAsync(id, request);

        if (!response.Updated)
        {
            return NotFound(response);
        }

        return Ok(response);
    }

    [Route("{id:int}")]
    [HttpDelete]
    [Produces(typeof(DeleteLeadResponse))]
    public async Task<IActionResult> DeleteLead(int id)
    {
        DeleteLeadResponse response = await _leadService.DeleteLeadAsync(id);

        if (!response.Deleted)
        {
            return NotFound(response);
        }

        return Ok(response);
    }
}