# syntax=docker/dockerfile:1
FROM node:22-alpine AS client
WORKDIR /src/KingdomSolutionz.Web/ClientApp
COPY KingdomSolutionz.Web/ClientApp/package*.json ./
RUN npm ci
COPY KingdomSolutionz.Web/ClientApp/ ./
RUN npm run build -- --configuration production --output-path /app/client

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS publish
WORKDIR /src
COPY . .
RUN dotnet restore KingdomSolutionz.Web/KingdomSolutionz.Web.csproj
RUN dotnet publish KingdomSolutionz.Web/KingdomSolutionz.Web.csproj --configuration Release --output /app/publish --no-restore -p:BuildAngular=false
COPY --from=client /app/client /app/publish/wwwroot

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
RUN apt-get update && apt-get install --yes --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "KingdomSolutionz.Web.dll"]
