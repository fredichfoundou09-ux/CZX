import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  GraduationCap,
  UserCircle2,
  LogIn,
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  AlertTriangle,
  CheckCircle2,
  Handshake,
  KeyRound,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/utils/cn";
import { Btn, Field, Input, Card, Modal } from "@/lib/ui";
import { getLock, registerFailure, resetLock, strength, strengthLabel, isValidPassword } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/client";
import { sendPasswordReset, bootstrapFirstSuperadmin } from "@/lib/supabase/auth";
import { toast } from "sonner";

type SpaceKey = "superadmin" | "teacher" | "student" | "partner";
const SPACES: { key: SpaceKey; label: string; icon: React.ReactNode; hint: string }[] = [
  { key: "superadmin", label: "Administrateur", icon: <ShieldCheck size={20} />, hint: "Super Admin, direction & gestion" },
  { key: "teacher", label: "Formateur", icon: <GraduationCap size={20} />, hint: "Espace enseignant" },
  { key: "student", label: "Apprenant", icon: <UserCircle2 size={20} />, hint: "Espace apprenant" },
  { key: "partner", label: "Partenaire", icon: <Handshake size={20} />, hint: "Consultation institutionnelle" },
];

type Step = "login" | "bootstrap" | "done";

export default function LoginPage() {
  const { login, hasAnyAdmin, adminCheckReady, user } = useStore();
  const navigate = useNavigate();

  const [space, setSpace] = useState<SpaceKey>("superadmin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(0);

  const [step, setStep] = useState<Step>("login");
  const [bs, setBs] = useState({ name: "", username: "", password: "", confirm: "" });
  const [bsError, setBsError] = useState("");
  const [bsSuccess, setBsSuccess] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  useEffect(() => {
    if (user) navigate("/app/dashboard", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const upd = () => {
      const l = getLock();
      setRemaining(l.until > Date.now() ? Math.ceil((l.until - Date.now()) / 1000) : 0);
    };
    upd();
    const i = setInterval(upd, 500);
    return () => clearInterval(i);
  }, []);

  const onLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const l = getLock();
    if (l.until > Date.now()) {
      setError(`Trop de tentatives. Réessayez dans ${Math.ceil((l.until - Date.now()) / 1000)}s.`);
      return;
    }
    if (!username.trim() || !password) {
      setError("Veuillez saisir votre identifiant et votre mot de passe.");
      return;
    }
    login(username.trim(), password, space)
      .then((res) => {
        if (res.ok) {
          resetLock();
          navigate(res.mustChangePassword ? "/app/securite" : "/app/dashboard");
        } else {
          const lockMs = registerFailure();
          if (lockMs > 0) {
            setError(`Compte temporairement bloqué (${Math.round(lockMs / 1000)}s). Trop d'échecs.`);
          } else {
            setError(res.error || "Erreur d'authentification.");
          }
        }
      })
      .catch(() => setError("Une erreur inattendue est survenue lors de l'authentification."));
  };

  const onBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setBsError("");
    if (!bs.name.trim()) {
      setBsError("Veuillez indiquer le nom complet du responsable.");
      return;
    }
    if (bs.username.trim().length < 3) {
      setBsError("Nom d'utilisateur trop court (3 caractères minimum).");
      return;
    }
    if (!isValidPassword(bs.password)) {
      setBsError("Le mot de passe ne respecte pas les critères de sécurité (12 caractères, majuscule, minuscule, chiffre, spécial).");
      return;
    }
    if (bs.password !== bs.confirm) {
      setBsError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!supabaseConfigured) {
      setBsError("Supabase n'est pas configuré. Configurez VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY puis réessayez.");
      return;
    }
    try {
      const email = `${bs.username.trim().toLowerCase()}@sentinelles.local`;
      const res = await bootstrapFirstSuperadmin(bs.name.trim(), bs.username.trim(), bs.password, email);
      if (res) {
        setBsSuccess(`Compte "${bs.username}" créé. Vous allez être redirigé.`);
        toast.success("Compte Super Admin créé avec succès.");
        setStep("done");
        resetLock();
        setTimeout(() => navigate("/app/dashboard"), 1200);
      }
    } catch (err) {
      setBsError(err instanceof Error ? err.message : "Erreur lors de la création du compte.");
    }
  };

  const pw = strength(bs.password);
  const pwLabel = strengthLabel(pw.score);

  return (
    <div className="bg-circuit scanlines relative flex min-h-[calc(100vh-65px)] items-center justify-center px-4 py-14">
      <div className="bg-grid-hex pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_30px_-4px_rgba(0,229,255,0.8)]">
            <ShieldCheck size={30} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-black text-white">SENTINELLES NUMÉRIQUES</h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Espace sécurisé</p>
        </div>

        <Card className="p-6" glow="cyan">
          {step === "login" && (
            <>
              <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SPACES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => {
                      setSpace(s.key);
                      setError("");
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all",
                      space === s.key
                        ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-300 shadow-[0_0_20px_-6px_rgba(0,229,255,0.5)]"
                        : "border-white/10 text-slate-400 hover:bg-white/5",
                    )}
                  >
                    {s.icon}
                    <span className="text-[9px] font-bold uppercase tracking-wider">{s.label}</span>
                  </button>
                ))}
              </div>

              <p className="mb-4 text-center text-[11px] text-slate-500">
                {SPACES.find((x) => x.key === space)?.hint}. Le rôle est vérifié par le serveur.
              </p>

              {remaining > 0 && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 text-xs text-amber-300">
                  <AlertTriangle size={15} />
                  Compte temporairement bloqué. Réessayez dans <b>{remaining}s</b>.
                </div>
              )}

              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-400">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={onLogin} className="space-y-4">
                <Field label="Nom d'utilisateur">
                  <div className="relative">
                    <UserIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      placeholder="votre.identifiant"
                      className="pl-10"
                      disabled={remaining > 0}
                    />
                  </div>
                </Field>
                <Field label="Mot de passe">
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      className="pl-10 pr-10"
                      disabled={remaining > 0}
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </Field>

                <Btn type="submit" className="w-full py-3" disabled={remaining > 0}>
                  <LogIn size={16} /> Se connecter
                </Btn>
              </form>

              {supabaseConfigured && (
                <button
                  type="button"
                  onClick={() => {
                    setResetOpen(true);
                    setResetMessage("");
                  }}
                  className="mt-3 w-full text-center text-xs font-semibold text-cyan-300 hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              )}

              <div className="mt-5 border-t border-white/10 pt-4">
                {!adminCheckReady ? (
                  <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 text-center text-[11px] text-cyan-300">
                    Vérification sécurisée de l'état de la plateforme...
                  </div>
                ) : hasAnyAdmin ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center text-[11px] text-slate-500">
                    <CheckCircle2 size={13} className="mx-auto mb-1 text-emerald-400" />
                    <b className="text-slate-300">Plateforme déjà initialisée.</b>
                    <br />
                    La création du compte principal n'est plus disponible. Contactez l'administrateur système.
                  </div>
                ) : (
                  <button
                    onClick={() => setStep("bootstrap")}
                    className="w-full rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 text-left transition hover:border-amber-400/50 hover:bg-amber-400/10"
                  >
                    <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                      <KeyRound size={15} /> Première utilisation
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Aucun administrateur configuré. Créez le premier compte Super Admin.
                    </p>
                  </button>
                )}
              </div>

              <div className="mt-4 text-center">
                <Link to="/" className="text-[11px] text-slate-500 hover:text-cyan-300">
                  ← Retour au site
                </Link>
              </div>
            </>
          )}

          {step === "bootstrap" && (
            <form onSubmit={onBootstrap} className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                <KeyRound size={15} /> Création du premier Super Admin
              </div>
              <p className="text-[11px] text-slate-400">
                Ce compte aura tous les droits. Il ne peut être créé qu'une seule fois.
              </p>

              <Field label="Nom complet du responsable">
                <Input value={bs.name} onChange={(e) => setBs({ ...bs, name: e.target.value })} placeholder="Prénom NOM" autoFocus />
              </Field>
              <Field label="Nom d'utilisateur">
                <Input value={bs.username} onChange={(e) => setBs({ ...bs, username: e.target.value })} placeholder="ex: admin" autoComplete="username" />
              </Field>

              <Field label="Mot de passe">
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Input
                    type={show ? "text" : "password"}
                    value={bs.password}
                    onChange={(e) => setBs({ ...bs, password: e.target.value })}
                    placeholder="Mot de passe fort (12+ caractères)"
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Force du mot de passe</span>
                  <span className={cn("font-bold", pw.score >= 4 ? "text-emerald-300" : pw.score >= 3 ? "text-cyan-300" : "text-amber-300")}>{pwLabel.label}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div className={cn("h-full rounded-full bg-gradient-to-r transition-all", pwLabel.color)} style={{ width: `${pwLabel.pct}%` }} />
                </div>
              </div>

              <Field label="Confirmer le mot de passe">
                <Input type="password" value={bs.confirm} onChange={(e) => setBs({ ...bs, confirm: e.target.value })} placeholder="Retapez le mot de passe" autoComplete="new-password" />
              </Field>

              {bsError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-400">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {bsError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Btn type="submit" variant="primary" className="flex-1 py-3" disabled={!bs.name || !bs.username || bs.password.length < 12}>
                  <KeyRound size={15} /> Créer le Super Admin
                </Btn>
                <Btn type="button" variant="ghost" onClick={() => setStep("login")}>
                  Annuler
                </Btn>
              </div>
            </form>
          )}

          {step === "done" && (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-400/10">
                <CheckCircle2 size={30} className="text-emerald-300" />
              </div>
              <p className="font-display text-lg font-black text-white">Compte créé</p>
              <p className="mt-2 text-sm text-slate-300">{bsSuccess}</p>
            </div>
          )}
        </Card>

        <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Mot de passe oublié">
          <div className="space-y-4">
            <p className="text-sm text-slate-400">Saisissez l'adresse email associée à votre compte.</p>
            <Field label="Email">
              <Input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="votre@email.com" />
            </Field>
            {resetMessage && <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 text-xs text-cyan-300">{resetMessage}</div>}
            <Btn
              className="w-full"
              onClick={async () => {
                try {
                  await sendPasswordReset(resetEmail);
                  setResetMessage("Si ce compte existe, un email a été envoyé.");
                } catch {
                  setResetMessage("Impossible d'envoyer l'email.");
                }
              }}
            >
              Envoyer le lien
            </Btn>
          </div>
        </Modal>

        <p className="mt-4 text-center text-[10px] leading-relaxed text-slate-600">
          Connexion chiffrée · Politique no-store · Supabase Auth
        </p>
      </div>
    </div>
  );
}
