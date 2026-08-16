import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, GraduationCap, BookOpen, Wallet, ClipboardCheck, UserX, Timer,
  TestTube2, Award, BadgeDollarSign, TrendingUp, Activity, AlertTriangle, PlusCircle, RotateCcw,
  CalendarDays, DollarSign, ShieldCheck,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Card, Stat, PageHead, Badge, Btn, Field, Input, today, money, Empty, formationLabel } from "@/lib/ui";
import { InitializerModal } from "./Initializer";
import { supabaseConfigured } from "@/lib/supabase/client";

/* ---------- helpers ---------- */
function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 truncate text-[11px] font-semibold text-slate-400">{label}</span>
      <div className="h-5 flex-1 overflow-hidden rounded-md bg-white/5">
        <div className={`h-full rounded-md bg-gradient-to-r ${color}`} style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right font-mono text-xs text-slate-300">{value}</span>
    </div>
  );
}

export function AdminDashboard() {
  const { db } = useStore();
  const d = today();
  const students = db.students;
  const attToday = db.attendance.filter((a) => a.date === d);
  const revenue = db.payments.filter((p) => p.statut === "paye").reduce((a, p) => a + p.montant, 0);
  const isClean = db.modules.length === 0 && db.students.length === 0 && db.teachers.length === 0;
  const partial = db.payments.filter((p) => p.statut === "partiel");
  const unpaid = db.students.filter((s) => s.statutPaiement === "impaye").length;

  const byMonth: Record<string, number> = {};
  students.forEach((s) => {
    const m = s.dateInscription.slice(0, 7);
    byMonth[m] = (byMonth[m] ?? 0) + 1;
  });
  const months = Object.keys(byMonth).sort();
  const maxMonth = Math.max(1, ...Object.values(byMonth));

  const infoCount = students.filter((s) => s.formation === "informatique").length;
  const indCount = students.filter((s) => s.formation === "industriel").length;
  const total = Math.max(1, students.length);
  const infoPct = (infoCount / total) * 100;

  const paidCount = db.payments.filter((p) => p.statut === "paye").length;
  const paidPct = total ? Math.round((paidCount / Math.max(1, db.payments.length)) * 100) : 0;

  const avgNote = db.grades.length ? (db.grades.reduce((a, g) => a + g.note, 0) / db.grades.length).toFixed(1) : "—";
  const scholarshipsGranted = db.scholarships.filter((s) => s.statut === "bourse_attribuee").length;

  return (
    <div>
      <PageHead
        title={`Tableau de bord`}
        subtitle="Vue d'ensemble de la plateforme SENTINELLES NUMÉRIQUES"
        actions={
          <>
            <Link to="/app/etudiants"><Btn><PlusCircle size={16} /> Nouvel apprenant</Btn></Link>
            <Link to="/app/contenu"><Btn variant="outline">Modifier le site</Btn></Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon={<Users size={20} />} label="Apprenants" value={students.length} color="cyan" sub={`${infoCount} Info • ${indCount} Ind.`} />
        <Stat icon={<GraduationCap size={20} />} label="Enseignants" value={db.teachers.length} color="blue" />
        <Stat icon={<BookOpen size={20} />} label="Modules" value={db.modules.length} color="red" sub="2 formations" />
        <Stat icon={<Wallet size={20} />} label="Revenus (payés)" value={money(revenue)} color="green" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon={<ClipboardCheck size={20} />} label="Présents aujourd'hui" value={attToday.filter((a) => a.statut === "present").length} color="green" />
        <Stat icon={<UserX size={20} />} label="Absents" value={attToday.filter((a) => a.statut === "absent").length} color="red" />
        <Stat icon={<Timer size={20} />} label="Retards" value={attToday.filter((a) => a.statut === "retard").length} color="gold" />
        <Stat icon={<BadgeDollarSign size={20} />} label="Bourses attribuées" value={scholarshipsGranted} color="gold" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* inscriptions chart */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-cyan-300" />
            <h3 className="font-display text-sm font-bold text-white">Évolution des inscriptions</h3>
          </div>
          {months.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune inscription enregistrée.</p>
          ) : (
            <div className="space-y-2.5">
              {months.map((m) => (
                <Bar key={m} label={m} value={byMonth[m]} max={maxMonth} color="from-cyan-400 to-blue-500" />
              ))}
            </div>
          )}
        </Card>

        {/* formation split */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Users size={16} className="text-cyan-300" />
            <h3 className="font-display text-sm font-bold text-white">Répartition des formations</h3>
          </div>
          <div className="flex items-center justify-center gap-6">
            <div className="relative h-32 w-32 rounded-full" style={{ background: `conic-gradient(#FF1744 0 ${infoPct}%, #00E5FF ${infoPct}% 100%)` }}>
              <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-[#0A1224]">
                <span className="font-display text-xl font-black text-white">{students.length}</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-500">apprenants</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Génie Info <b className="text-white">{infoCount}</b></div>
              <div className="flex items-center gap-2 text-sm"><span className="h-2.5 w-2.5 rounded-full bg-cyan-400" /> Génie Ind. <b className="text-white">{indCount}</b></div>
            </div>
          </div>
        </Card>

        {/* payments + success */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-300" />
            <h3 className="font-display text-sm font-bold text-white">Santé financière & réussite</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-400"><span>Paiements réglés</span><span className="font-bold text-emerald-300">{paidPct}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${paidPct}%` }} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-center">
                <p className="font-display text-lg font-black text-white">{partial.length}</p>
                <p className="text-[9px] uppercase tracking-wider text-slate-500">Partiels</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-center">
                <p className="font-display text-lg font-black text-red-400">{unpaid}</p>
                <p className="text-[9px] uppercase tracking-wider text-slate-500">Impayés</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-center">
                <p className="font-display text-lg font-black text-cyan-300">{avgNote}/20</p>
                <p className="text-[9px] uppercase tracking-wider text-slate-500">Moyenne</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* recent registrations */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-white">Pré-inscriptions récentes</h3>
            <Link to="/app/etudiants" className="text-xs font-bold text-cyan-300 hover:underline">Gérer →</Link>
          </div>
          {db.registrations.length === 0 ? (
            <Empty icon={<Users size={32} />} title="Aucune pré-inscription" />
          ) : (
            <div className="space-y-2">
              {db.registrations.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5">
                  <div>
                    <p className="text-sm font-bold text-slate-200">{r.nom} {r.prenom}</p>
                    <p className="text-[11px] text-slate-500">{formationLabel(r.formation)} • {r.modules.length} module(s) • {r.date}</p>
                  </div>
                  <Badge color={r.statut === "en_attente" ? "gold" : r.statut === "confirmee" ? "green" : "red"}>{r.statut.replace("_", " ")}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* activity log */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-white">Activité récente</h3>
            <Link to="/app/journal" className="text-xs font-bold text-cyan-300 hover:underline">Journal →</Link>
          </div>
          <div className="space-y-2">
            {db.log.slice(0, 6).map((l) => (
              <div key={l.id} className="flex items-start gap-2.5 text-sm">
                <Activity size={14} className="mt-1 shrink-0 text-cyan-400" />
                <div className="min-w-0">
                  <p className="truncate text-slate-300">{l.action}</p>
                  <p className="text-[10px] text-slate-600">{l.user} • {l.date}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ============ ÉTAT PROPRE POST-INITIALISATION ============ */}
      {isClean && (
        <Card className="mb-6 overflow-hidden" glow="cyan">
          <div className="bg-grid-hex relative p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-400/10 shadow-[0_0_30px_-8px_rgba(0,229,255,0.6)]">
              <ShieldCheck size={30} className="text-cyan-300" />
            </div>
            <h2 className="font-display text-xl font-black text-white">Bienvenue dans votre plateforme.</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              Aucune donnée n'est encore configurée. Commencez par configurer votre établissement, puis construisez progressivement votre écosystème.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { to: "/app/modules", l: "CRÉER UNE FORMATION", d: "Modules, programmes & chapitres", i: <BookOpen size={20} className="text-red-400" /> },
                { to: "/app/utilisateurs", l: "CRÉER UN ADMINISTRATEUR", d: "Comptes & permissions RBAC", i: <ShieldCheck size={20} className="text-amber-300" /> },
                { to: "/app/enseignants", l: "AJOUTER UN FORMATEUR", d: "Équipe pédagogique", i: <GraduationCap size={20} className="text-cyan-300" /> },
                { to: "/app/etudiants", l: "AJOUTER UN APPRENANT", d: "Inscription & compte auto", i: <Users size={20} className="text-emerald-300" /> },
              ].map((a, i) => (
                <Link key={i} to={a.to} className="group rounded-2xl border border-white/10 bg-[#07152B]/80 p-5 text-left transition hover:border-cyan-400/50 hover:shadow-[0_0_25px_-8px_rgba(0,229,255,0.5)]">
                  <div className="mb-3">{a.i}</div>
                  <p className="font-display text-[13px] font-black tracking-wide text-white group-hover:text-cyan-300">{a.l}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{a.d}</p>
                </Link>
              ))}
            </div>
            <p className="mt-5 text-[10px] uppercase tracking-[0.25em] text-slate-600">Formations → Modules → Formateurs → Apprenants → Cours → Emplois du temps → Tests → Paiements</p>
          </div>
        </Card>
      )}

      {/* quick actions */}
      <Card className="mt-4 p-5">
        <h3 className="font-display mb-3 text-sm font-bold text-white">Actions rapides</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {[
            { to: "/app/etudiants", l: "Apprenants", i: <Users size={16} /> },
            { to: "/app/presences", l: "Présences", i: <ClipboardCheck size={16} /> },
            { to: "/app/tests", l: "Tests", i: <TestTube2 size={16} /> },
            { to: "/app/certificats", l: "Certificats", i: <Award size={16} /> },
            { to: "/app/bourses", l: "Bourses", i: <BadgeDollarSign size={16} /> },
            { to: "/app/contenu", l: "Contenu site", i: <CalendarDays size={16} /> },
          ].map((a, i) => (
            <Link key={i} to={a.to} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-sm font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300">
              {a.i} {a.l}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ---------- Journal ---------- */
export function JournalPage() {
  const { db } = useStore();
  return (
    <div>
      <PageHead title="Journal d'activité" subtitle="Toutes les actions effectuées sur la plateforme" />
      <Card className="overflow-hidden">
        <div className="divide-y divide-white/5">
          {db.log.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <Activity size={14} className="shrink-0 text-cyan-400" />
              <p className="min-w-0 flex-1 text-sm text-slate-300">{l.action}</p>
              <Badge color="gray">{l.user}</Badge>
              <span className="font-mono text-[11px] text-slate-500">{l.date}</span>
            </div>
          ))}
          {db.log.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-500">Journal vide.</p>}
        </div>
      </Card>
    </div>
  );
}

/* ---------- Paramètres ---------- */
export function ParametresPage() {
  const { db, update, log, user } = useStore();
  const s = db.settings;
  const [email, setEmail] = useState(s.contact.email);
  const [adresse, setAdresse] = useState(s.contact.adresse);
  const [initOpen, setInitOpen] = useState(false);

  return (
    <div>
      <PageHead title="Paramètres" subtitle="Configuration générale de la plateforme" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-display mb-4 text-sm font-bold text-white">Coordonnées de contact</h3>
          <div className="space-y-4">
            <Field label="Email de contact"><Input value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="Adresse"><Input value={adresse} onChange={(e) => setAdresse(e.target.value)} /></Field>
            <Btn
              onClick={() => { update((d) => ({ ...d, settings: { ...d.settings, contact: { email, adresse } } })); log("Paramètres de contact mis à jour"); }}
              className="w-full"
            >
              Enregistrer les coordonnées
            </Btn>
          </div>
        </Card>

        {/* ============ INITIALISATION DE PRODUCTION ============ */}
        <Card className="p-6" glow="red">
          <h3 className="font-display mb-2 flex items-center gap-2 text-sm font-bold text-red-400"><AlertTriangle size={16} /> Zone d'initialisation</h3>
          <p className="text-sm text-slate-400">
            Réinitialisez sélectivement les catégories de données pour repartir avec une base propre de <b className="text-slate-200">production</b>.
          </p>
          <ul className="mt-3 space-y-1 text-[11px] text-slate-500">
            <li>• L'architecture, les tables et les rôles RBAC sont conservés</li>
            <li>• Votre compte <b>Admin Sup</b> et la session sont conservés</li>
            <li>• Sélection précise : formations, modules, apprenants, paiements...</li>
            <li>• Protection : avertissement + saisie obligatoire de confirmation</li>
          </ul>
          {supabaseConfigured ? (
            <div className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-xs text-cyan-200">
              En production Supabase, la réinitialisation des données s'effectue uniquement via une procédure administrée, après sauvegarde, avec les migrations et outils Supabase. Cette interface locale est désactivée.
            </div>
          ) : user?.role === "superadmin" ? (
            <Btn variant="red" className="mt-5 w-full py-3" onClick={() => setInitOpen(true)}>
              <RotateCcw size={16} /> INITIALISER LE LOGICIEL
            </Btn>
          ) : (
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center text-xs text-slate-500">
              Seul l'Administrateur Supérieur peut initialiser la plateforme.
            </div>
          )}
        </Card>
      </div>

      {!supabaseConfigured && initOpen && <InitializerModal onClose={() => setInitOpen(false)} />}
    </div>
  );
}
