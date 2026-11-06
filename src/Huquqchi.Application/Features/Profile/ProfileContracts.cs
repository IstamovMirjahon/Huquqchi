using Huquqchi.Domain;

namespace Huquqchi.Application;

public sealed record WorkspaceResponse(Guid Id, string Name, WorkspaceKind Kind);
public sealed record ProfileResponse(Guid Id, string Name, string Phone, string Language, WorkspaceResponse Workspace, string Role);
public sealed record UpdateProfileCommand(string Name, string Language);
