using KingdomSolutionz.Web.Helpers;
using KingdomSolutionz.Web.Helpers.Classes.Errors;
using Microsoft.Data.SqlClient;

namespace KingdomSolutionz.Web.Tables;

public class LeadTable
{
    private readonly string _connectionString;

    public LeadTable(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection connection string is missing.");
    }

    public async Task<int> CreateAsync(LeadTableRow lead)
    {
        const string sql = @"
            INSERT INTO dbo.Leads
            (
                FullName,
                Email,
                Phone,
                BusinessName,
                CurrentWebsiteUrl,
                ProjectType,
                Timeline,
                BudgetRange,
                FeaturesJson,
                Message,
                RecommendedPackage,
                CreatedAtUtc
            )
            OUTPUT INSERTED.Id
            VALUES
            (
                @FullName,
                @Email,
                @Phone,
                @BusinessName,
                @CurrentWebsiteUrl,
                @ProjectType,
                @Timeline,
                @BudgetRange,
                @FeaturesJson,
                @Message,
                @RecommendedPackage,
                @CreatedAtUtc
            );";

        try
        {
            await using var connection = new SqlConnection(_connectionString);
            await using var command = new SqlCommand(sql, connection);

            AddLeadParameters(command, lead);
            SqlHelper.AddParameter(command, "@CreatedAtUtc", lead.CreatedAtUtc);

            await connection.OpenAsync();

            var result = await command.ExecuteScalarAsync();

            return Convert.ToInt32(result);
        }
        catch (Exception exception)
        {
            throw new ServerErrorAppException("There was a problem creating the lead.", exception);
        }
    }

    public async Task<LeadTableRow?> GetByIdAsync(int id)
    {
        const string sql = @"
            SELECT
                Id,
                FullName,
                Email,
                Phone,
                BusinessName,
                CurrentWebsiteUrl,
                ProjectType,
                Timeline,
                BudgetRange,
                FeaturesJson,
                Message,
                RecommendedPackage,
                CreatedAtUtc,
                UpdatedAtUtc
            FROM dbo.Leads
            WHERE Id = @Id;";

        try
        {
            await using var connection = new SqlConnection(_connectionString);
            await using var command = new SqlCommand(sql, connection);

            SqlHelper.AddParameter(command, "@Id", id);

            await connection.OpenAsync();

            await using var reader = await command.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return null;
            }

            return MapLead(reader);
        }
        catch (Exception exception)
        {
            throw new ServerErrorAppException("There was a problem getting the lead.", exception);
        }
    }

    public async Task<List<LeadTableRow>> GetAllAsync()
    {
        const string sql = @"
            SELECT
                Id,
                FullName,
                Email,
                Phone,
                BusinessName,
                CurrentWebsiteUrl,
                ProjectType,
                Timeline,
                BudgetRange,
                FeaturesJson,
                Message,
                RecommendedPackage,
                CreatedAtUtc,
                UpdatedAtUtc
            FROM dbo.Leads
            ORDER BY CreatedAtUtc DESC;";

        try
        {
            var leads = new List<LeadTableRow>();

            await using var connection = new SqlConnection(_connectionString);
            await using var command = new SqlCommand(sql, connection);

            await connection.OpenAsync();

            await using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                leads.Add(MapLead(reader));
            }

            return leads;
        }
        catch (Exception exception)
        {
            throw new ServerErrorAppException("There was a problem getting leads.", exception);
        }
    }

    public async Task<bool> UpdateAsync(int id, LeadTableRow lead)
    {
        const string sql = @"
            UPDATE dbo.Leads
            SET
                FullName = @FullName,
                Email = @Email,
                Phone = @Phone,
                BusinessName = @BusinessName,
                CurrentWebsiteUrl = @CurrentWebsiteUrl,
                ProjectType = @ProjectType,
                Timeline = @Timeline,
                BudgetRange = @BudgetRange,
                FeaturesJson = @FeaturesJson,
                Message = @Message,
                RecommendedPackage = @RecommendedPackage,
                UpdatedAtUtc = @UpdatedAtUtc
            WHERE Id = @Id;";

        try
        {
            await using var connection = new SqlConnection(_connectionString);
            await using var command = new SqlCommand(sql, connection);

            SqlHelper.AddParameter(command, "@Id", id);
            AddLeadParameters(command, lead);
            SqlHelper.AddParameter(command, "@UpdatedAtUtc", DateTime.UtcNow);

            await connection.OpenAsync();

            var rowsAffected = await command.ExecuteNonQueryAsync();

            return rowsAffected > 0;
        }
        catch (Exception exception)
        {
            throw new ServerErrorAppException("There was a problem updating the lead.", exception);
        }
    }

    public async Task<bool> DeleteAsync(int id)
    {
        const string sql = @"
            DELETE FROM dbo.Leads
            WHERE Id = @Id;";

        try
        {
            await using var connection = new SqlConnection(_connectionString);
            await using var command = new SqlCommand(sql, connection);

            SqlHelper.AddParameter(command, "@Id", id);

            await connection.OpenAsync();

            var rowsAffected = await command.ExecuteNonQueryAsync();

            return rowsAffected > 0;
        }
        catch (Exception exception)
        {
            throw new ServerErrorAppException("There was a problem deleting the lead.", exception);
        }
    }

    private static void AddLeadParameters(SqlCommand command, LeadTableRow lead)
    {
        SqlHelper.AddParameter(command, "@FullName", lead.FullName);
        SqlHelper.AddParameter(command, "@Email", lead.Email);
        SqlHelper.AddNullableStringParameter(command, "@Phone", lead.Phone);
        SqlHelper.AddNullableStringParameter(command, "@BusinessName", lead.BusinessName);
        SqlHelper.AddNullableStringParameter(command, "@CurrentWebsiteUrl", lead.CurrentWebsiteUrl);
        SqlHelper.AddParameter(command, "@ProjectType", lead.ProjectType);
        SqlHelper.AddNullableStringParameter(command, "@Timeline", lead.Timeline);
        SqlHelper.AddNullableStringParameter(command, "@BudgetRange", lead.BudgetRange);
        SqlHelper.AddParameter(command, "@FeaturesJson", lead.FeaturesJson);
        SqlHelper.AddNullableStringParameter(command, "@Message", lead.Message);
        SqlHelper.AddParameter(command, "@RecommendedPackage", lead.RecommendedPackage);
    }

    private static LeadTableRow MapLead(SqlDataReader reader)
    {
        return new LeadTableRow
        {
            Id = SqlHelper.GetAsInt(reader, "Id") ?? 0,
            FullName = SqlHelper.GetAsString(reader, "FullName"),
            Email = SqlHelper.GetAsString(reader, "Email"),
            Phone = SqlHelper.GetAsNullableString(reader, "Phone"),
            BusinessName = SqlHelper.GetAsNullableString(reader, "BusinessName"),
            CurrentWebsiteUrl = SqlHelper.GetAsNullableString(reader, "CurrentWebsiteUrl"),
            ProjectType = SqlHelper.GetAsString(reader, "ProjectType"),
            Timeline = SqlHelper.GetAsNullableString(reader, "Timeline"),
            BudgetRange = SqlHelper.GetAsNullableString(reader, "BudgetRange"),
            FeaturesJson = SqlHelper.GetAsString(reader, "FeaturesJson"),
            Message = SqlHelper.GetAsNullableString(reader, "Message"),
            RecommendedPackage = SqlHelper.GetAsString(reader, "RecommendedPackage"),
            CreatedAtUtc = SqlHelper.GetAsDateTime(reader, "CreatedAtUtc", true),
            UpdatedAtUtc = SqlHelper.GetAsDateTimeNullable(reader, "UpdatedAtUtc", true)
        };
    }
}