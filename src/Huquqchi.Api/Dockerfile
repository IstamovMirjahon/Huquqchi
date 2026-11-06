FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
EXPOSE 8080
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore Huquqchi.slnx
RUN dotnet publish src/Huquqchi.Api/Huquqchi.Api.csproj -c Release -o /app/publish --no-restore

FROM runtime AS final
WORKDIR /app
COPY --from=build /app/publish .
RUN mkdir -p /app/storage && chown -R app:app /app
USER app
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 CMD curl --fail --silent http://localhost:8080/health || exit 1
ENTRYPOINT ["dotnet", "Huquqchi.Api.dll"]
