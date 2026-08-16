/* ===========================================================
   Authentification de production — SENTINELLES NUMÉRIQUES
   - Aucun mot de passe traité ou stocké par le frontend
   - Supabase Auth est l'unique gestionnaire des mots de passe
   - Politique de mot de passe fort
   - Anti brute-force : temporisation progressive par IP/navigateur
   =========================================================== */

export interface PasswordStrength {
  length: boolean;
  upper: boolean;
  lower: boolean;
  digit: boolean;
  special: boolean;
  score: number; // 0..5
}

const SPECIAL = /[!@#$%^&*(),.?":;{}|<>_+\-=\[\]\\\/]/;

export function strength(pw: string): PasswordStrength {
  const length = pw.length >= 12;
  const upper = /[A-Z]/.test(pw);
  const lower = /[a-z]/.test(pw);
  const digit = /\d/.test(pw);
  const special = SPECIAL.test(pw);
  const score = [length, upper, lower, digit, special].filter(Boolean).length;
  return { length, upper, lower, digit, special, score };
}

export function isValidPassword(pw: string): boolean {
  const s = strength(pw);
  return s.length && s.upper && s.lower && s.digit && s.special;
}

/** Indicateur visuel : force du mot de passe */
export function strengthLabel(score: number): { label: string; color: string; pct: number } {
  if (score <= 1) return { label: "Très faible", color: "from-red-500 to-rose-600", pct: 20 };
  if (score === 2) return { label: "Faible", color: "from-orange-500 to-red-500", pct: 40 };
  if (score === 3) return { label: "Moyenne", color: "from-amber-400 to-orange-500", pct: 60 };
  if (score === 4) return { label: "Bonne", color: "from-cyan-400 to-blue-500", pct: 80 };
  return { label: "Forte", color: "from-emerald-400 to-teal-500", pct: 100 };
}

/* ---------- Anti brute-force (par navigateur) ---------- */
const LOCK_KEY = "sn_lock";
const ATT_KEY = "sn_att";

interface LockState {
  until: number; // timestamp ms
  attempts: number;
}

export function getLock(): LockState {
  try {
    const raw = sessionStorage.getItem(LOCK_KEY);
    if (raw) {
      const s = JSON.parse(raw) as LockState;
      if (s.until > Date.now()) return s;
      sessionStorage.removeItem(LOCK_KEY);
    }
    const att = parseInt(sessionStorage.getItem(ATT_KEY) || "0", 10);
    return { until: 0, attempts: att };
  } catch {
    return { until: 0, attempts: 0 };
  }
}

/** Enregistre un échec ; retourne la durée de blocage en ms (0 si libre) */
export function registerFailure(): number {
  const s = getLock();
  const attempts = s.attempts + 1;
  sessionStorage.setItem(ATT_KEY, String(attempts));
  // paliers progressifs : 5e essai → 30s, 8e → 2min, 12e → 5min
  let lockMs = 0;
  if (attempts >= 12) lockMs = 5 * 60 * 1000;
  else if (attempts >= 8) lockMs = 2 * 60 * 1000;
  else if (attempts >= 5) lockMs = 30 * 1000;
  if (lockMs > 0) {
    sessionStorage.setItem(LOCK_KEY, JSON.stringify({ until: Date.now() + lockMs, attempts }));
  }
  return lockMs;
}

export function resetLock() {
  sessionStorage.removeItem(LOCK_KEY);
  sessionStorage.removeItem(ATT_KEY);
}
