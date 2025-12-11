// Permissions par rôle - peut être utilisé côté client
export const PERMISSIONS = {
  ADMIN: {
    canManageUsers: true,
    canManageTeams: true,
    canManageQuais: true,
    canManageClients: true,
    canGenerateInvites: true,
    canCreateReport: true,
    canEditReport: true,
    canEditReportStatus: true,
    canViewDashboard: true,
    canChat: true,
  },
  SUPERVISOR: {
    canManageUsers: false,
    canManageTeams: false,
    canManageQuais: false,
    canManageClients: false,
    canGenerateInvites: false,
    canCreateReport: true,
    canEditReport: true,
    canEditReportStatus: true,
    canViewDashboard: true,
    canChat: true,
  },
  OPERATOR: {
    canManageUsers: false,
    canManageTeams: false,
    canManageQuais: false,
    canManageClients: false,
    canGenerateInvites: false,
    canCreateReport: true,
    canEditReport: false,
    canEditReportStatus: true,
    canViewDashboard: false,
    canChat: true,
  },
} as const;

export type Role = keyof typeof PERMISSIONS;
export type Permission = keyof typeof PERMISSIONS.ADMIN;

export function hasPermission(role: string, permission: Permission): boolean {
  const rolePermissions = PERMISSIONS[role as Role];
  if (!rolePermissions) return false;
  return rolePermissions[permission];
}

