using System.Data.Common;
using KingdomSolutionz.Web.Helpers.Classes.Errors;
using Microsoft.Data.SqlClient;

namespace KingdomSolutionz.Web.Helpers;

public static class SqlHelper
{
    private static readonly int _insertCommandLimit = 1000;

    public static readonly string DbNull = "NULL";

    public static int InsertCommandLimit => _insertCommandLimit;

    #region Value Getters

    public static int? GetAsInt(SqlDataReader reader, string columnName)
    {
        return reader[columnName] != DBNull.Value
            ? Convert.ToInt32(reader[columnName])
            : null;
    }

    public static int? GetAsInt(DbDataReader reader, string columnName)
    {
        return reader[columnName] != DBNull.Value
            ? Convert.ToInt32(reader[columnName])
            : null;
    }

    public static string GetAsString(SqlDataReader reader, string columnName)
    {
        var result = reader[columnName] != DBNull.Value
            ? reader[columnName].ToString()
            : "";

        return result ?? "";
    }

    public static string GetAsString(DbDataReader reader, string columnName)
    {
        var result = reader[columnName] != DBNull.Value
            ? reader[columnName].ToString()
            : "";

        return result ?? "";
    }

    public static string? GetAsNullableString(SqlDataReader reader, string columnName)
    {
        return reader[columnName] != DBNull.Value
            ? reader[columnName].ToString()
            : null;
    }

    public static DateTime GetAsDateTime(SqlDataReader reader, string columnName, bool isUtc)
    {
        var result = new DateTime();

        var databaseResponse = reader[columnName] != DBNull.Value
            ? reader[columnName].ToString()
            : "";

        if (!string.IsNullOrEmpty(databaseResponse))
        {
            result = DateTime.Parse(databaseResponse);
        }

        if (isUtc)
        {
            result = DateTime.SpecifyKind(result, DateTimeKind.Utc);
        }

        return result;
    }

    public static DateTime? GetAsDateTimeNullable(SqlDataReader reader, string columnName, bool isUtc)
    {
        var databaseResponse = reader[columnName] != DBNull.Value
            ? reader[columnName].ToString()
            : "";

        DateTime? result = null;

        if (!string.IsNullOrEmpty(databaseResponse))
        {
            result = DateTime.Parse(databaseResponse);
        }

        if (result != null && isUtc)
        {
            result = DateTime.SpecifyKind(result.Value, DateTimeKind.Utc);
        }

        return result;
    }

    public static decimal? GetAsDecimal(SqlDataReader reader, string columnName)
    {
        return reader[columnName] != DBNull.Value
            ? Convert.ToDecimal(reader[columnName])
            : null;
    }

    public static bool GetAsBool(SqlDataReader reader, string columnName)
    {
        return reader[columnName] != DBNull.Value &&
               Convert.ToBoolean(reader[columnName]);
    }

    #endregion

    #region Parameters

    public static void AddParameter(SqlCommand command, string parameterName, object? value)
    {
        command.Parameters.AddWithValue(parameterName, ToDbValue(value));
    }

    public static void AddNullableStringParameter(SqlCommand command, string parameterName, string? value)
    {
        command.Parameters.AddWithValue(parameterName, ToDbValue(value));
    }

    public static object ToDbValue(object? value)
    {
        if (value == null)
        {
            return DBNull.Value;
        }

        if (value is string stringValue && string.IsNullOrWhiteSpace(stringValue))
        {
            return DBNull.Value;
        }

        return value;
    }

    #endregion

    #region Command Runners

    public static async Task ExecuteNonQueryCommandAsync(
        string sql,
        SqlConnection connection,
        string errorMessage)
    {
        await using var command = new SqlCommand(sql, connection);

        try
        {
            await command.ExecuteNonQueryAsync();
        }
        catch (Exception exception)
        {
            throw new ServerErrorAppException(errorMessage, exception);
        }
    }

    public static async Task ExecuteNonQueryCommandAsync(
        string sql,
        SqlConnection connection,
        SqlTransaction transaction,
        string errorMessage)
    {
        await using var command = new SqlCommand(sql, connection, transaction);

        try
        {
            await command.ExecuteNonQueryAsync();
        }
        catch (Exception exception)
        {
            await transaction.RollbackAsync();
            throw new ServerErrorAppException(errorMessage, exception);
        }
    }

    #endregion

    #region Query Builders

    public static string GetWhereSqlFromAllConditions(List<string> conditions)
    {
        return GetWhereSqlFromConditions(conditions, "AND");
    }

    public static string GetWhereSqlFromAnyConditions(List<string> conditions)
    {
        return GetWhereSqlFromConditions(conditions, "OR");
    }

    private static string GetWhereSqlFromConditions(List<string> conditions, string joinWord)
    {
        var cleanConditions = conditions
            .Where(condition => !string.IsNullOrWhiteSpace(condition))
            .ToList();

        if (!cleanConditions.Any())
        {
            return "";
        }

        var result = "";

        for (var i = 0; i < cleanConditions.Count; i++)
        {
            result += i == 0 ? "WHERE " : $" {joinWord} ";
            result += cleanConditions[i];
        }

        return result;
    }

    public static string GetUpdateCommand(string tableName, List<string> setValueCommands, string whereSql)
    {
        var commandPrefix = $"UPDATE {tableName} SET";
        var commandBody = "";

        foreach (var valueCommand in setValueCommands)
        {
            commandBody += !string.IsNullOrWhiteSpace(commandBody)
                ? $", {valueCommand}"
                : valueCommand;
        }

        return $"{commandPrefix} {commandBody} {whereSql}";
    }

    #endregion

    #region Strings And Dates

    public static string GetSqlDateTime(DateTime dateTime)
    {
        return dateTime.ToString("s");
    }

    public static string GetSqlSafeString(string input, int? characterCount = null)
    {
        var result = input.Trim().Replace("'", "''");

        if (characterCount != null && result.Length > characterCount)
        {
            var suffix = "...";
            result = result[..(characterCount.Value - suffix.Length)] + suffix;
        }

        return result;
    }

    public static string GetNullableStringValue(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? DbNull
            : $"'{GetSqlSafeString(value.Trim())}'";
    }

    #endregion
}