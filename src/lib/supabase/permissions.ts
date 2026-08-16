// Compatibility re-exports. The unique RBAC source is src/types/rbac.ts.
export {
  ALL_PERMISSIONS,
  DATA_VISIBILITY,
  PARTNER_SCOPE_PERMISSIONS,
  RBAC_MATRIX,
  ROLE_COLORS,
  ROLE_LABELS,
  isAdmin,
  isLearner,
  isPartner,
  isPartnerAdmin,
  isReadOnlyRole,
  isStaff,
  isSuperAdmin,
  isTeacher,
  roleCanManage,
  roleHasPermission,
} from "@/types/rbac";
export type { AppRole, DataVisibility, PartnerScope, PermissionKey } from "@/types/rbac";