FROM mcr.microsoft.com/dotnet/runtime:10.0 AS runtime
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore Huquqchi.slnx
RUN dotnet publish src/Huquqchi.TelegramBot/Huquqchi.TelegramBot.csproj -c Release -o /app/publish --no-restore

FROM runtime AS final
WORKDIR /app
COPY --from=build /app/publish .
USER app
ENTRYPOINT ["dotnet", "Huquqchi.TelegramBot.dll"]
