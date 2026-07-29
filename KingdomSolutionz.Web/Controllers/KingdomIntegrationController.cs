using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace KingdomSolutionz.Web.Controllers;

public sealed record OperationsIntegrationEventRequest(
    Guid EventId,
    string EventName,
    DateTimeOffset OccurredAtUtc,
    string CorrelationId,
    string Classification,
    JsonElement Data);

[ApiController]
[Route("api/kingdomos/integration/events")]
public sealed class KingdomIntegrationController(
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    ILogger<KingdomIntegrationController> logger) : ControllerBase
{
    private static readonly HashSet<string> AllowedEvents = new(
        ["AssignmentApproved", "ResponseHandoffCreated"],
        StringComparer.Ordinal);

    [HttpPost]
    public async Task<IActionResult> Publish(
        OperationsIntegrationEventRequest request,
        CancellationToken cancellationToken)
    {
        if (request.EventId == Guid.Empty ||
            !AllowedEvents.Contains(request.EventName) ||
            string.IsNullOrWhiteSpace(request.CorrelationId))
        {
            return BadRequest(new { message = "A valid Operations integration event is required." });
        }

        var tenantId = Guid.TryParse(configuration["KingdomOS:TenantId"], out var configuredTenant)
            ? configuredTenant
            : Guid.Parse("a1ab45e2-1746-4d91-9de0-9cf70ae75d3a");
        var payload = JsonSerializer.Serialize(new
        {
            eventId = request.EventId,
            eventName = request.EventName,
            eventVersion = 1,
            occurredAtUtc = request.OccurredAtUtc,
            tenantId,
            correlationId = request.CorrelationId.Trim(),
            producer = "kingdom-operations",
            classification = string.IsNullOrWhiteSpace(request.Classification)
                ? "Internal"
                : request.Classification.Trim(),
            data = request.Data
        });

        try
        {
            var platformUrl = (configuration["KingdomOS:PlatformUrl"] ?? "http://localhost:5100")
                .TrimEnd('/');
            using var content = new StringContent(payload, Encoding.UTF8, "application/json");
            using var response = await httpClientFactory.CreateClient().PostAsync(
                $"{platformUrl}/api/integration/events",
                content,
                cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "Platform rejected Operations event {EventId} with {StatusCode}.",
                    request.EventId,
                    response.StatusCode);
                return StatusCode(StatusCodes.Status503ServiceUnavailable);
            }

            return Accepted();
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogWarning(
                exception,
                "Operations event {EventId} remains queued in the browser.",
                request.EventId);
            Response.Headers.RetryAfter = "2";
            return StatusCode(StatusCodes.Status503ServiceUnavailable);
        }
    }
}
