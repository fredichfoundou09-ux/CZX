import { describe, expect, it } from "vitest";
import { isReadOnlyRole, roleHasPermission } from "@/types/rbac";

describe("RBAC", () => {
  it("interdit toute gestion au partenaire", () => {
    expect(isReadOnlyRole("partner")).toBe(true);
    expect(roleHasPermission("partner", "formations.manage")).toBe(false);
  });

  it("autorise uniquement les lectures prévues", () => {
    expect(roleHasPermission("partner", "formations.read")).toBe(true);
    expect(roleHasPermission("partner_admin", "finance.manage")).toBe(false);
  });

  it("accorde les permissions globales au Super Admin", () => {
    expect(roleHasPermission("superadmin", "users.delete")).toBe(true);
    expect(roleHasPermission("superadmin", "audit.read")).toBe(true);
  });
});