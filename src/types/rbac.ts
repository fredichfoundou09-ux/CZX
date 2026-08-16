/** Source TypeScript unique, alignée sur public.permissions. */
export type AppRole = "superadmin" | "admin" | "partner_admin" | "teacher" | "student" | "partner";

export type PermissionKey =
  | "dashboard.read"
  | "users.read" | "users.create" | "users.update" | "users.delete"
  | "formations.read" | "formations.manage" | "modules.read" | "modules.manage"
  | "students.read" | "students.create" | "students.update" | "students.delete"
  | "teachers.read" | "teachers.manage" | "courses.read" | "courses.manage"
  | "files.read" | "files.manage" | "schedule.read" | "schedule.manage"
  | "attendance.read" | "attendance.manage" | "submissions.read" | "submissions.manage"
  | "tests.read" | "tests.manage" | "grades.read" | "grades.manage"
  | "finance.read" | "finance.manage" | "teacher_payroll.manage"
  | "messages.read" | "messages.manage" | "notifications.read" | "notifications.manage"
  | "certificates.read" | "certificates.manage" | "scholarships.read" | "scholarships.manage"
  | "enia.read" | "enia.manage" | "audit.read" | "audit.manage" | "reports.read"
  | "partner.dashboard.read" | "partner.vitrine.read" | "partner.certificates.read";

export const ALL_PERMISSIONS: PermissionKey[] = [
  "dashboard.read", "users.read", "users.create", "users.update", "users.delete",
  "formations.read", "formations.manage", "modules.read", "modules.manage",
  "students.read", "students.create", "students.update", "students.delete",
  "teachers.read", "teachers.manage", "courses.read", "courses.manage",
  "files.read", "files.manage", "schedule.read", "schedule.manage",
  "attendance.read", "attendance.manage", "submissions.read", "submissions.manage",
  "tests.read", "tests.manage", "grades.read", "grades.manage",
  "finance.read", "finance.manage", "teacher_payroll.manage", "messages.read", "messages.manage",
  "notifications.read", "notifications.manage", "certificates.read", "certificates.manage",
  "scholarships.read", "scholarships.manage", "enia.read", "enia.manage", "audit.read", "audit.manage",
  "reports.read", "partner.dashboard.read", "partner.vitrine.read", "partner.certificates.read",
];

const READ_ONLY = ALL_PERMISSIONS.filter((key) => key.endsWith(".read"));
export const RBAC_MATRIX: Record<AppRole, PermissionKey[]> = {
  superadmin: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS.filter((key) => key !== "users.delete" && key !== "audit.manage"),
  partner_admin: READ_ONLY,
  partner: ["dashboard.read", "formations.read", "modules.read", "courses.read", "files.read", "certificates.read", "scholarships.read", "enia.read", "reports.read", "partner.dashboard.read", "partner.vitrine.read", "partner.certificates.read"],
  teacher: ["dashboard.read", "students.read", "teachers.read", "formations.read", "modules.read", "schedule.read", "attendance.read", "attendance.manage", "courses.read", "courses.manage", "files.read", "files.manage", "submissions.read", "submissions.manage", "tests.read", "tests.manage", "grades.read", "grades.manage", "messages.read", "messages.manage", "notifications.read", "enia.read", "reports.read"],
  student: ["dashboard.read", "formations.read", "modules.read", "schedule.read", "attendance.read", "courses.read", "files.read", "submissions.read", "submissions.manage", "tests.read", "grades.read", "finance.read", "certificates.read", "scholarships.read", "messages.read", "messages.manage", "notifications.read", "enia.read"],
};

export const ROLE_LABELS: Record<AppRole, string> = { superadmin: "Super Admin", admin: "Administration", partner_admin: "Admin Partenaire", teacher: "Formateur", student: "Apprenant", partner: "Partenaire" };
export const ROLE_COLORS: Record<AppRole, string> = { superadmin: "red", admin: "gold", partner_admin: "gold", teacher: "cyan", student: "green", partner: "blue" };

export type DataVisibility = "public" | "internal" | "partner" | "private" | "restricted";
export const DATA_VISIBILITY: Record<string, DataVisibility> = {
  "student.nom": "partner", "student.prenom": "partner", "student.email": "private", "student.telephone": "private", "student.adresse": "private", "student.formation": "partner", "student.niveau": "partner", "student.statut": "partner", "teacher.nom": "partner", "teacher.prenom": "partner", "teacher.specialite": "partner", "grade.note": "restricted", "payment.montant": "restricted", "certificate.numero": "partner", "certificate.note": "partner",
};

export type PartnerScope = "viewer" | "academic" | "finance" | "institutional";
export const PARTNER_SCOPE_PERMISSIONS: Record<PartnerScope, PermissionKey[]> = {
  viewer: ["dashboard.read", "formations.read", "modules.read", "enia.read"],
  academic: ["dashboard.read", "formations.read", "modules.read", "courses.read", "files.read", "attendance.read", "grades.read", "reports.read", "enia.read"],
  finance: ["dashboard.read", "formations.read", "finance.read", "reports.read", "certificates.read", "enia.read"],
  institutional: ["dashboard.read", "formations.read", "modules.read", "teachers.read", "courses.read", "files.read", "attendance.read", "grades.read", "finance.read", "certificates.read", "scholarships.read", "reports.read", "enia.read"],
};

export const roleHasPermission = (role: AppRole | null | undefined, permission: PermissionKey) => !!role && (RBAC_MATRIX[role] ?? []).includes(permission);
export const roleCanManage = (role: AppRole | null | undefined, domain: string) => roleHasPermission(role, `${domain}.manage` as PermissionKey) || role === "superadmin";
export const isReadOnlyRole = (role?: AppRole | null) => role === "partner" || role === "partner_admin";
export const isSuperAdmin = (role?: AppRole | null) => role === "superadmin";
export const isAdmin = (role?: AppRole | null) => role === "admin" || role === "superadmin";
export const isStaff = isAdmin;
export const isPartnerAdmin = (role?: AppRole | null) => role === "partner_admin";
export const isTeacher = (role?: AppRole | null) => role === "teacher";
export const isLearner = (role?: AppRole | null) => role === "student";
export const isPartner = (role?: AppRole | null) => role === "partner";