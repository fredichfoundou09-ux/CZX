import { useState } from "react";
import { CheckCircle2, KeyRound, Lock } from "lucide-react";
import { Btn, Card, Field, Input, PageHead } from "@/lib/ui";
import { isValidPassword, strength, strengthLabel } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/client";
import { updatePassword } from "@/lib/supabase/auth";

export default function SecurityPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const info = strengthLabel(strength(password).score);

  const save = async () => {
    setError(""); setMessage("");
    if (!supabaseConfigured) { setError("Le changement sécurisé sera disponible lorsque Supabase sera configuré."); return; }
    if (!isValidPassword(password)) { setError("Le mot de passe ne respecte pas la politique de sécurité."); return; }
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    try {
      await updatePassword(password);
      setPassword(""); setConfirm(""); setMessage("Mot de passe modifié avec succès.");
    }
    catch { setError("La modification du mot de passe a échoué."); }
  };

  return (
    <div>
      <PageHead title="Sécurité du compte" subtitle="Gérez votre mot de passe Supabase Auth" />
      <Card className="max-w-xl p-6">
        <div className="mb-5 flex items-center gap-3"><div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-2.5"><KeyRound size={20} className="text-cyan-300" /></div><div><p className="font-display text-sm font-bold text-white">Modifier le mot de passe</p><p className="text-xs text-slate-500">La session reste gérée par Supabase Auth.</p></div></div>
        <div className="space-y-4">
          <Field label="Nouveau mot de passe"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></Field>
          <div><div className="mb-1 flex justify-between text-[11px]"><span className="text-slate-500">Force</span><span className="text-cyan-300">{info.label}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/5"><div className={`h-full bg-gradient-to-r ${info.color}`} style={{ width: `${info.pct}%` }} /></div></div>
          <Field label="Confirmer"><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" /></Field>
          {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400"><Lock size={13} className="mr-1 inline" />{error}</p>}
          {message && <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-xs text-emerald-300"><CheckCircle2 size={13} className="mr-1 inline" />{message}</p>}
          <Btn className="w-full" onClick={save}>Enregistrer le nouveau mot de passe</Btn>
        </div>
      </Card>
    </div>
  );
}