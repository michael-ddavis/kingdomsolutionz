namespace KingdomSolutionz.Web.Helpers.Classes.Errors;

public class ServerErrorAppException : Exception
{
    public ServerErrorAppException(string message)
        : base(message)
    {
    }

    public ServerErrorAppException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}