import { MembershipRole, Permission } from "@ProofBase/shared/enums.js";

const rolePermissions: Record<MembershipRole, readonly Permission[]> = {
  [MembershipRole.Owner]: Object.values(Permission),
  [MembershipRole.Admin]: [
    Permission.ReadOrganization,
    Permission.ManageOrganization,
    Permission.ManageMemberships,
    Permission.ManageAudits,
    Permission.WriteSoA,
    Permission.WriteAssessments,
    Permission.WriteEvidence,
    Permission.WriteFindings,
  ],
  [MembershipRole.Auditor]: [
    Permission.ReadOrganization,
    Permission.ManageAudits,
    Permission.WriteAssessments,
    Permission.WriteEvidence,
    Permission.WriteFindings,
  ],
  [MembershipRole.Contributor]: [
    Permission.ReadOrganization,
    Permission.WriteSoA,
    Permission.WriteAssessments,
    Permission.WriteFindings,
    Permission.WriteEvidence,
  ],
  [MembershipRole.Viewer]: [Permission.ReadOrganization],
};

export function roleHasPermission(
  role: MembershipRole,
  permission: Permission,
): boolean {
  return rolePermissions[role].includes(permission);
}
