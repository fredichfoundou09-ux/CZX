import { describe, expect, it } from "vitest";
import { calcFee, totalDue } from "@/lib/ui";

const fees = {
  inscription: 5000,
  informatique: [
    { label: "2 modules", modules: 2, montant: 7500 },
    { label: "4 modules", modules: 4, montant: 15000 },
  ],
  industriel: [{ label: "3 modules", modules: 3, montant: 10000 }],
};

describe("calcul des frais", () => {
  it("applique la formule exacte", () => {
    expect(calcFee(fees, "informatique", 2)).toEqual({ montant: 7500, formule: "2 modules" });
  });

  it("applique le pack supérieur et calcule le total", () => {
    expect(calcFee(fees, "informatique", 3).montant).toBe(15000);
    expect(totalDue(fees, "informatique", 3)).toBe(20000);
  });

  it("gère un catalogue sans tarif", () => {
    expect(calcFee({ ...fees, informatique: [] }, "informatique", 1)).toEqual({ montant: 0, formule: "Sur devis" });
  });
});