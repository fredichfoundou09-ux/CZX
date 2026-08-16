import { describe, expect, it } from "vitest";
import { isValidPassword, strength, strengthLabel } from "@/lib/auth";

describe("politique de mot de passe", () => {
  it("refuse un mot de passe faible", () => {
    expect(isValidPassword("password123")).toBe(false);
  });

  it("accepte un mot de passe conforme", () => {
    expect(isValidPassword("Sentinelle#2026")).toBe(true);
    expect(strength("Sentinelle#2026").score).toBe(5);
    expect(strengthLabel(5).label).toBe("Forte");
  });
});