import { useMemo, useState } from "react";
import {
  AlertTriangle, CheckSquare, Square, RotateCcw, BookOpen, Layers,
  Users, GraduationCap, ShieldCheck, Handshake, FileText, FolderOpen, CalendarDays,
  ClipboardCheck, TestTube2, PenLine, Wallet, Award, BadgeDollarSign, Bell, Archive,
  CheckCircle2, Type, Lock,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { initSelection, categoryCount, InitKey } from "@/lib/init";
import { cn } from "@/utils/cn";
import { Btn, Modal, Input } from "@/lib/ui";

const CATS: { key: InitKey; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: "formations", label: "Formations", icon: <BookOpen size={17} />, desc: "Titres & descriptions des formations" },
  { key: "modules", label: "Modules", icon: <Layers size={17} />, desc: "Tous les modules, programmes & chapitres" },
  { key: "apprenants", label: "Apprenants", icon: <Users size={17} />, desc: "Apprenants, comptes et données liées" },
  { key: "formateurs", label: "Formateurs", icon: <GraduationCap size={17} />, desc: "Enseignants, comptes et contenus" },
  { key: "admins", label: "Administrateurs", icon: <ShieldCheck size={17} />, desc: "Admins & gestionnaires (sauf vous)" },
  { key: "partenaires", label: "Partenaires", icon: <Handshake size={17} />, desc: "Partenaires et logos personnalisés" },
  { key: "cours", label: "Cours", icon: <FileText size={17} />, desc: "Cours publiés et devoirs" },
  { key: "supports", label: "Supports", icon: <FolderOpen size={17} />, desc: "Documents et supports pédagogiques" },
  { key: "edt", label: "Emplois du temps", icon: <CalendarDays size={17} />, desc: "Tous les créneaux planifiés" },
  { key: "presences", label: "Présences", icon: <ClipboardCheck size={17} />, desc: "Historique complet de présence" },
  { key: "tests", label: "Tests / évaluations", icon: <TestTube2 size={17} />, desc: "Tests, questions et résultats" },
  { key: "notes", label: "Notes", icon: <PenLine size={17} />, desc: "Toutes les notes saisies" },
  { key: "paiements", label: "Paiements", icon: <Wallet size={17} />, desc: "Transactions et reçus" },
  { key: "certificats", label: "Certificats", icon: <Award size={17} />, desc: "Certificats émis" },
  { key: "bourses", label: "Bourses", icon: <BadgeDollarSign size={17} /> , desc: "Dossiers BOURSE MON AVENIR" },
  { key: "notifications", label: "Notifications", icon: <Bell size={17} />, desc: "Toutes les notifications (sauf les vôtres)" },
  { key: "enia", label: "Module ENIA 2.0", icon: <GraduationCap size={17} />, desc: "Affiche, frais, pièces, bourse & lien" },
  { key: "autres", label: "Autres données", icon: <Archive size={17} />, desc: "Pré-inscriptions & messages" },
];

type Step = "select" | "warning" | "type" | "done";

export function InitializerModal({ onClose }: { onClose: () => void }) {
  const { db, user, update } = useStore();
  const [selected, setSelected] = useState<Set<InitKey>>(new Set());
  const [step, setStep] = useState<Step>("select");
  const [confirmText, setConfirmText] = useState("");
  const [recap, setRecap] = useState<string[]>([]);
  const [error, setError] = useState("");

  const allSelected = CATS.every((c) => selected.has(c.key));
  const selectedCount = [...selected].length;

  const totalRecords = useMemo(
    () => [...selected].reduce((acc, k) => acc + (categoryCount(db, k, user!.id) || 0), 0),
    [selected, db, user]
  );

  const toggle = (k: InitKey) => {
    setSelected((p) => {
      const n = new Set(p);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  };

  const selectAll = () => setSelected(new Set(CATS.map((c) => c.key)));
  const deselectAll = () => setSelected(new Set());

  const run = () => {
    const { db: nd, recap: r } = initSelection(db, [...selected], user!, user!.name);
    update(() => nd);
    setRecap(r);
    setStep("done");
  };

  /* ================== ÉTAPE : SÉLECTION ================== */
  if (step === "select")
    return (
      <Modal open onClose={onClose} title={<span className="flex items-center gap-2"><RotateCcw size={18} className="text-red-400" /> Initialiser le logiciel</span>} wide>
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Sélectionnez précisément les données à initialiser. L'architecture, les rôles, les permissions et votre compte Admin Sup seront <b className="text-emerald-300">conservés</b>.
          </p>

          {/* options globales */}
          <div className="flex gap-2">
            <Btn variant="outline" className="px-3 py-1.5 text-xs" onClick={selectAll}><CheckSquare size={13} /> Tout sélectionner</Btn>
            <Btn variant="outline" className="px-3 py-1.5 text-xs" onClick={deselectAll}><Square size={13} /> Tout désélectionner</Btn>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/5 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400">
              <AlertTriangle size={19} />
            </div>
            <p className="text-xs text-slate-300">
              Cette opération supprime <b className="text-red-300">définitivement</b> les données réelles des catégories cochées.
              Aucune donnée n'est rechargée automatiquement : la plateforme repart d'une base vide que vous reconstruisez vous-même.
            </p>
          </div>

          {/* catégories individuelles */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {CATS.map((c) => {
              const on = selected.has(c.key);
              const count = categoryCount(db, c.key, user!.id);
              return (
                <button key={c.key} onClick={() => toggle(c.key)}
                  className={cn("flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all",
                    on ? "border-cyan-400/50 bg-cyan-400/10" : "border-white/10 hover:bg-white/5")}>
                  <div className={cn("shrink-0", on ? "text-cyan-300" : "text-slate-500")}>{c.icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-xs font-bold", on ? "text-white" : "text-slate-300")}>{c.label}</p>
                    <p className="truncate text-[10px] text-slate-500">{c.desc}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono text-[10px] text-slate-500">{count}</span>
                    <div className={cn("flex h-4.5 w-4.5 h-[18px] w-[18px] items-center justify-center rounded border", on ? "border-cyan-400 bg-cyan-400 text-[#05070D]" : "border-white/20")}>
                      {on && <CheckSquare size={11} />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
            <p className="text-xs text-slate-500">
              <b className="text-white">{allSelected ? "Tout sélectionné" : `${selectedCount} catégorie(s)`}</b>
              {" "}• ~{totalRecords} enregistrement(s) concerné(s)
            </p>
            <div className="flex gap-2">
              <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
              <Btn variant="red" onClick={() => setStep("warning")} disabled={selected.size === 0}>
                INITIALISER LA SÉLECTION →
              </Btn>
            </div>
          </div>
        </div>
      </Modal>
    );

  /* ================== ÉTAPE : AVERTISSEMENT ================== */
  if (step === "warning")
    return (
      <Modal open onClose={onClose} title="">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 border-red-500/50 bg-red-500/10 shadow-[0_0_40px_-10px_rgba(255,23,68,0.7)]">
            <AlertTriangle size={38} className="text-red-400" />
          </div>
          <h3 className="font-display text-2xl font-black text-red-400 tracking-wider">⚠️ ATTENTION</h3>
          <p className="mt-1 font-bold text-white">Cette opération est irréversible.</p>
          <div className="mx-auto mt-4 max-w-md rounded-2xl border border-red-500/25 bg-red-500/5 p-4 text-left">
            <p className="text-sm text-slate-300">
              Les données sélectionnées seront <b className="text-red-400">définitivement supprimées</b>.
              Elles ne pourront pas être récupérées depuis l'application.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Seront conservés : la structure de la base de données, les tables, les rôles RBAC, le système JWT, les permissions, les fonctionnalités et votre compte <b>Admin Sup</b>.
            </p>
          </div>
          <p className="mt-5 text-sm font-bold text-white">Êtes-vous certain de vouloir continuer ?</p>
          <div className="mt-6 flex justify-center gap-3">
            <Btn variant="ghost" onClick={() => setStep("select")}>← ANNULER</Btn>
            <Btn variant="red" onClick={() => setStep("type")}>CONTINUER →</Btn>
          </div>
        </div>
      </Modal>
    );

  /* ================== ÉTAPE : SAISIE DE CONFIRMATION ================== */
  if (step === "type")
    return (
      <Modal open onClose={onClose} title="">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-400/10">
            <Lock size={28} className="text-amber-300" />
          </div>
          <h3 className="font-display text-lg font-black text-white">Confirmation finale</h3>
          <p className="mt-2 text-sm text-slate-400">
            Pour valider, saisissez exactement <br />
            <span className="my-1 inline-flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 font-mono text-lg font-black tracking-widest text-red-400">
              <Type size={16} /> INITIALISER
            </span>
          </p>
          <div className="mx-auto mt-4 max-w-xs">
            <Input
              value={confirmText}
              onChange={(e) => { setConfirmText(e.target.value); setError(""); }}
              placeholder="Tapez INITIALISER"
              className="text-center font-mono uppercase tracking-widest"
              autoFocus
            />
            {error && <p className="mt-2 text-xs font-semibold text-red-400">{error}</p>}
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Btn variant="ghost" onClick={() => setStep("warning")}>← Retour</Btn>
            <Btn
              variant="red"
              disabled={confirmText.trim().toUpperCase() !== "INITIALISER"}
              onClick={() => {
                if (confirmText.trim().toUpperCase() !== "INITIALISER") { setError("Veuillez saisir exactement : INITIALISER"); return; }
                run();
              }}
            >
              CONFIRMER LA SUPPRESSION
            </Btn>
          </div>
        </div>
      </Modal>
    );

  /* ================== ÉTAPE : TERMINÉ ================== */
  return (
    <Modal open onClose={onClose} title="">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-18 w-18 h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-400/50 bg-emerald-400/10 shadow-[0_0_40px_-10px_rgba(0,255,136,0.7)]">
          <CheckCircle2 size={38} className="text-emerald-300" />
        </div>
        <h3 className="font-display text-xl font-black text-emerald-300">Initialisation terminée</h3>
        <p className="mt-1 text-sm text-slate-400">La plateforme est propre et prête à recevoir les vraies données de SENTINELLES NUMÉRIQUES.</p>
        <div className="mx-auto mt-4 max-w-lg space-y-1.5 text-left">
          {recap.map((r, i) => (
            <p key={i} className="flex items-start gap-2 text-xs text-slate-300"><span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" /> {r}</p>
          ))}
        </div>
        <div className="mx-auto mt-5 max-w-md rounded-xl border border-cyan-400/25 bg-cyan-400/5 p-3.5 text-xs text-cyan-200">
          🛡️ Conservés : l'architecture, les tables, les rôles RBAC, les permissions, les fonctionnalités et votre compte Admin Sup.
        </div>
        <div className="mt-6 flex justify-center">
          <Btn variant="primary" onClick={onClose}>Accéder à l'administration</Btn>
        </div>
      </div>
    </Modal>
  );
}
