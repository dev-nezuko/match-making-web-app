# .NET Core 3.1 went out of support in December 2022. The images are still
# published, so the project runs as written; upgrading the target framework is
# a separate piece of work.
FROM --platform=linux/amd64 mcr.microsoft.com/dotnet/sdk:3.1 AS build
WORKDIR /src
COPY *.csproj ./
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app --no-restore

FROM --platform=linux/amd64 mcr.microsoft.com/dotnet/aspnet:3.1 AS runtime
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "DatingApp.API.dll"]
