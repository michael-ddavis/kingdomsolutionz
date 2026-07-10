using KingdomSolutionz.Web.DTOs.Common;
using KingdomSolutionz.Web.Helpers.Classes.Errors;

namespace KingdomSolutionz.Web.Middleware;

public class ApiExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiExceptionMiddleware> _logger;

    public ApiExceptionMiddleware(
        RequestDelegate next,
        ILogger<ApiExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ArgumentException exception)
        {
            await WriteErrorResponseAsync(
                context,
                StatusCodes.Status400BadRequest,
                exception.Message);
        }
        catch (ServerErrorAppException exception)
        {
            _logger.LogError(exception, exception.Message);

            await WriteErrorResponseAsync(
                context,
                StatusCodes.Status500InternalServerError,
                exception.Message);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "An unexpected server error occurred.");

            await WriteErrorResponseAsync(
                context,
                StatusCodes.Status500InternalServerError,
                "An unexpected server error occurred.");
        }
    }

    private static async Task WriteErrorResponseAsync(
        HttpContext context,
        int statusCode,
        string message)
    {
        if (context.Response.HasStarted)
        {
            return;
        }

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        await context.Response.WriteAsJsonAsync(new ApiErrorResponse
        {
            Message = message
        });
    }
}