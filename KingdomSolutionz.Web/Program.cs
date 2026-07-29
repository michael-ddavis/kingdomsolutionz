using KingdomSolutionz.Web.Middleware;
using KingdomSolutionz.Web.Services.Leads;
using KingdomSolutionz.Web.Tables;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddScoped<LeadTable>();
builder.Services.AddScoped<ILeadService, LeadService>();

var app = builder.Build();
app.UseMiddleware<ApiExceptionMiddleware>();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/health", () => Results.Ok(new
{
    status = "Healthy",
    service = "KingdomOperations"
}));

app.MapControllers();

// This lets Angular handle routes like /pricing, /portfolio, /admin, etc.
app.MapFallbackToFile("index.html");

app.Run();