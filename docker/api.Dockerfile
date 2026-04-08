# KurdMap API — Multi-stage build
# Build: podman build -f docker/api.Dockerfile -t kurdmap-api .
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

# Copy csproj files first for layer caching
COPY src/KurdMap.Domain/KurdMap.Domain.csproj KurdMap.Domain/
COPY src/KurdMap.Application/KurdMap.Application.csproj KurdMap.Application/
COPY src/KurdMap.Infrastructure/KurdMap.Infrastructure.csproj KurdMap.Infrastructure/
COPY src/KurdMap.Shared/KurdMap.Shared.csproj KurdMap.Shared/
COPY src/KurdMap.Migrator/KurdMap.Migrator.csproj KurdMap.Migrator/
COPY src/KurdMap.API/KurdMap.API.csproj KurdMap.API/
RUN dotnet restore KurdMap.API/KurdMap.API.csproj

# Copy all source and publish
COPY src/ .
RUN dotnet publish KurdMap.API/KurdMap.API.csproj -c Release -o /app/publish --no-restore

# Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS runtime
WORKDIR /app

COPY --from=build /app/publish .

USER app

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

ENTRYPOINT ["dotnet", "KurdMap.API.dll"]
