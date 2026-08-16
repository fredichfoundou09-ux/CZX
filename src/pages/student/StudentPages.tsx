import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  UserCircle2, CalendarDays, Clock, MapPin, ClipboardCheck, PenLine, Wallet, Award,
  BadgeDollarSign, CheckCircle2, XCircle, Timer, Phone, Mail, FileText, TestTube2, PlayCircle,
  ShieldCheck, ChevronRight, Printer, ReceiptText, TrendingUp,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/utils/cn";
import {
  Btn, Badge, Card, Empty, Field, Input, PageHead, Progress, Modal, Stat, moduleIcon, money,
  formationLabel, today, printHTML, uid, readImage, totalDue,
} from "@/lib/ui";
import { Test } from "@/lib/types";
import { supabaseConfigured } from "@/lib/supabase/client";
import { getStudentTest, submitStudentTest } from "@/lib/supabase/tests";
import { toast } from "sonner";
import { ModuleDetailModal } from "@/pages/shared/ModuleFeature";

export function StudentDashboard() {
  const { db, user } = useStore();
  const student = db.students.find((s) => s.userId === user!.id);
  if (!student) return <Empty icon={<UserCircle2 size={40} />} title="Profil apprenant introuvable. Contactez l'administration." />;

  const myMods = db.modules.filter((m) => student.modules.includes(m.id));
  const att = db.attendance.filter((a) => a.studentId === student.id);
  const grades = db.grades.filter((g) => g.studentId === student.id);
  const avg = grades.length ? (grades.reduce((a, g) => a + g.note, 0) / grades.length).toFixed(1) : "—";
  const present = att.filter((a) => a.statut === "present").length;
  const absent = att.filter((a) => a.statut === "absent").length;
  const progression = Math.min(100, Math.round(((grades.length + att.length) / Math.max(6, myMods.length * 3)) * 100));
  const todaySessions = db.schedule.filter((s) => s.formation === student.formation && s.jour === new Date().toLocaleDateString("fr-FR", { weekday: "long" }).replace(/^\w/, (c) => c.toUpperCase()));
  const notifs = db.notifications.filter((n) => n.toId === user!.id || n.toId === "all").slice(0, 3);

  return (
    <div>
      <PageHead title={`Bonjour, ${student.prenom} 👋`} subtitle={`${student.id} — ${formationLabel(student.formation)}`} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon={<TrendingUp size={20} />} label="Progression" value={`${progression}%`} color="cyan" />
        <Stat icon={<ClipboardCheck size={20} />} label="Présences" value={present} color="green" />
        <Stat icon={<XCircle size={20} />} label="Absences" value={absent} color="red" />
        <Stat icon={<PenLine size={20} />} label="Moyenne" value={avg} color="gold" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-white">Mes prochaines sessions</h3>
            <Badge color="gray">{todaySessions.length} aujourd'hui</Badge>
          </div>
          {todaySessions.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune session aujourd'hui. Consultez votre emploi du temps.</p>
          ) : (
            <div className="space-y-2">
              {todaySessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3">
                  <Clock size={16} className="shrink-0 text-cyan-300" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{db.modules.find((m) => m.id === s.moduleId)?.titre}</p>
                    <p className="text-[11px] text-slate-400">{s.heureDebut} — {s.heureFin} • Salle {s.salle}</p>
                  </div>
                  <ChevronRight size={15} className="text-slate-600" />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-display mb-3 text-sm font-bold text-white">Mes modules ({myMods.length})</h3>
          <div className="space-y-2.5">
            {myMods.slice(0, 4).map((m) => {
              const g = grades.filter((x) => x.moduleId === m.id);
              const pct = g.length ? Math.min(100, Math.round((g[0].note / 20) * 100)) : 15;
              return (
                <div key={m.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="truncate text-sm font-bold text-slate-200">{m.numero}. {m.titre}</p>
                    {g.length ? <Badge color={g[0].note >= 10 ? "green" : "red"}>{g[0].note}/20</Badge> : <Badge color="gray">En cours</Badge>}
                  </div>
                  <Progress value={pct} color={g.length && g[0].note < 10 ? "red" : "cyan"} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-display mb-3 text-sm font-bold text-white">Notifications récentes</h3>
          {notifs.length === 0 ? <p className="text-sm text-slate-500">Aucune notification.</p> : (
            <div className="space-y-2">
              {notifs.map((n) => (
                <div key={n.id} className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <BellIcon type={n.type} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-200">{n.title}</p>
                    <p className="text-xs text-slate-500">{n.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-display mb-3 text-sm font-bold text-white">Ma carte d'apprenant</h3>
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white p-2">
              <QRCodeSVG value={`SN|${student.id}|${student.nom}|${student.prenom}|${student.formation}`} size={90} />
            </div>
            <div>
              <p className="font-display text-base font-black text-white">{student.prenom} {student.nom}</p>
              <p className="font-mono text-xs text-cyan-300">{student.id}</p>
              <p className="mt-1 text-xs text-slate-400">{formationLabel(student.formation)} • {myMods.length} modules</p>
              <Badge color="green" className="mt-2">{student.statut}</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function BellIcon({ type }: { type: string }) {
  const c = type === "paiement" ? "text-amber-300 border-amber-400/30" : type === "test" ? "text-red-400 border-red-500/30" : type === "certif" ? "text-blue-400 border-blue-500/30" : "text-cyan-300 border-cyan-400/30";
  return <div className={cn("rounded-lg border p-1.5", c)}><ShieldCheck size={14} /></div>;
}

/* ---------- profile ---------- */
export function StudentProfile() {
  const { db, user, update, log } = useStore();
  const student = db.students.find((s) => s.userId === user!.id)!;
  const [form, setForm] = useState({ telephone: student.telephone, whatsapp: student.whatsapp, email: student.email, adresse: student.adresse });
  const att = db.attendance.filter((a) => a.studentId === student.id);
  const pays = db.payments.filter((p) => p.studentId === student.id);
  const totalDueAmt = totalDue(db.settings.frais, student.formation, student.modules.length);
  const totalPaid = pays.reduce((a, p) => a + p.montant, 0);
  const solde = Math.max(0, totalDueAmt - totalPaid);

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const img = await readImage(f, 300);
      update((d) => ({ ...d, students: d.students.map((s) => (s.id === student.id ? { ...s, photo: img } : s)) }));
      log(`Photo de profil mise à jour (${student.id})`);
    }
  };

  return (
    <div>
      <PageHead title="Mon profil" subtitle="Vos informations personnelles et votre carte d'apprenant" />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-4">
            <div className="relative">
              {student.photo ? (
                <img src={student.photo} alt="" className="h-20 w-20 rounded-2xl border-2 border-cyan-400/50 object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30"><UserCircle2 size={40} className="text-cyan-300" /></div>
              )}
              <label className="absolute -bottom-1.5 -right-1.5 cursor-pointer rounded-lg border border-cyan-400/50 bg-[#05070D] p-1.5 text-cyan-300 hover:bg-cyan-400/10" title="Changer la photo">
                📷
                <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
              </label>
            </div>
            <div>
              <p className="font-display text-xl font-black text-white">{student.prenom} {student.nom}</p>
              <p className="font-mono text-sm text-cyan-300">{student.id}</p>
              <p className="mt-0.5 font-mono text-[11px] text-slate-500">username : {user?.username}</p>
              <Badge color="green" className="mt-1.5">{formationLabel(student.formation)}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Info label="Date de naissance" value={student.dateNaissance || "—"} />
            <Info label="Sexe" value={student.sexe === "M" ? "Masculin" : "Féminin"} />
            <Info label="Niveau d'étude" value={student.niveau || "—"} />
            <Info label="Inscrit le" value={student.dateInscription} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3">
              <p className="text-[10px] uppercase text-slate-500">Total payé</p>
              <p className="font-display text-base font-black text-emerald-300">{money(totalPaid)}</p>
            </div>
            <div className={cn("rounded-xl border p-3", solde > 0 ? "border-red-500/20 bg-red-500/5" : "border-emerald-400/20 bg-emerald-400/5")}>
              <p className="text-[10px] uppercase text-slate-500">Solde restant</p>
              <p className={cn("font-display text-base font-black", solde > 0 ? "text-red-400" : "text-emerald-300")}>{money(solde)}</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-white p-2">
            <QRCodeSVG value={`SN|${student.id}|${student.nom}|${student.prenom}|${student.formation}`} size={140} className="mx-auto" />
          </div>
          <p className="mt-2 text-center text-[10px] uppercase tracking-[0.25em] text-slate-500">Présentez ce QR Code en salle</p>
        </Card>

        <Card className="p-6">
          <h3 className="font-display mb-4 text-sm font-bold text-white">Modifier mes coordonnées</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Téléphone"><Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></Field>
            <Field label="WhatsApp"><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Adresse"><Input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} /></Field>
          </div>
          <Btn className="mt-5" onClick={() => { update((d) => ({ ...d, students: d.students.map((s) => (s.id === student.id ? { ...s, ...form } : s)) })); log(`Profil mis à jour par ${student.prenom} ${student.nom}`); }}>
            Enregistrer
          </Btn>
          <div className="mt-6 border-t border-white/5 pt-4">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-cyan-300">Mes statistiques</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3"><p className="text-[10px] uppercase text-slate-500">Présences</p><p className="font-display text-lg font-black text-emerald-300">{att.filter((a) => a.statut === "present").length}</p></div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3"><p className="text-[10px] uppercase text-slate-500">Absences</p><p className="font-display text-lg font-black text-red-400">{att.filter((a) => a.statut === "absent").length}</p></div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3"><p className="text-[10px] uppercase text-slate-500">Retards</p><p className="font-display text-lg font-black text-amber-300">{att.filter((a) => a.statut === "retard").length}</p></div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3"><p className="text-[10px] uppercase text-slate-500">Modules</p><p className="font-display text-lg font-black text-cyan-300">{student.modules.length}</p></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="font-bold text-slate-200">{value}</p>
    </div>
  );
}

/* ---------- ma formation ---------- */
export function MyFormation() {
  const { db, user } = useStore();
  const student = db.students.find((s) => s.userId === user!.id)!;
  const info = db.settings.infos;
  const myMods = db.modules.filter((m) => student.modules.includes(m.id));
  const grades = db.grades.filter((g) => g.studentId === student.id);

  return (
    <div>
      <PageHead title="Ma formation" subtitle={`${formationLabel(student.formation)} — ${info.duree}`} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { icon: <CalendarDays size={18} className="text-cyan-300" />, t: "Début", v: info.debut },
          { icon: <Clock size={18} className="text-red-400" />, t: "Durée", v: info.duree },
          { icon: <MapPin size={18} className="text-blue-400" />, t: "Lieu", v: info.lieu },
        ].map((c, i) => (
          <div key={i} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="mt-0.5">{c.icon}</div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{c.t}</p>
              <p className="text-sm font-bold text-slate-200">{c.v}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {myMods.map((m) => {
          const g = grades.find((x) => x.moduleId === m.id);
          const pct = g ? Math.min(100, Math.round((g.note / 20) * 100)) : 10;
          return (
            <Card key={m.id} className="p-5" glow={student.formation === "informatique" ? "red" : "cyan"}>
              <div className="flex items-center gap-3">
                <div className={cn("rounded-xl border p-2.5", student.formation === "informatique" ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300")}>
                  {moduleIcon(m.icon, "h-5 w-5")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] font-bold tracking-[0.25em] text-slate-500">MODULE {String(m.numero).padStart(2, "0")}</p>
                  <h4 className="font-display text-sm font-bold text-white">{m.titre}</h4>
                </div>
                {g && <Badge color={g.note >= 10 ? "green" : "red"}>{g.note}/20</Badge>}
              </div>
              <div className="mt-3">
                <Progress value={pct} color={g && g.note < 10 ? "red" : "cyan"} />
                <p className="mt-1 text-[11px] text-slate-500">{g ? `Note : ${g.note}/20 — ${g.appreciation}` : "Module en cours..."}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- mes modules ---------- */
export function MyModules() {
  const { db, user } = useStore();
  const student = db.students.find((s) => s.userId === user!.id)!;
  const myMods = db.modules.filter((m) => student.modules.includes(m.id));
  const [previewMod, setPreviewMod] = useState<(typeof myMods)[number] | null>(null);

  return (
    <div>
      <PageHead title="Mes modules" subtitle={`${myMods.length} module(s) — ${formationLabel(student.formation)}`} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {myMods.map((m) => (
          <Card key={m.id} className="group relative cursor-pointer p-5" glow={student.formation === "informatique" ? "red" : "cyan"}>
            <button
              type="button"
              aria-label={`Ouvrir la fiche du module ${m.titre}`}
              onClick={() => setPreviewMod(m)}
              className="absolute inset-0 z-20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
            />
            <div className="mb-3 flex items-center justify-between">
              <div className={cn("rounded-xl border p-2.5", student.formation === "informatique" ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300")}>
                {moduleIcon(m.icon, "h-5 w-5")}
              </div>
              <span className={cn("font-mono text-[10px] font-bold tracking-[0.2em]", student.formation === "informatique" ? "text-red-400/70" : "text-cyan-400/70")}>MODULE {String(m.numero).padStart(2, "0")}</span>
            </div>
            <h4 className="relative z-10 font-display text-base font-bold text-white">{m.titre}</h4>
            <ul className="mt-3 space-y-1.5">
              {m.notions.map((n, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className={cn("mt-1.5 h-1 w-1 shrink-0 rounded-full", student.formation === "informatique" ? "bg-red-400" : "bg-cyan-400")} /> {n}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      {previewMod && <ModuleDetailModal mod={previewMod} onClose={() => setPreviewMod(null)} />}
    </div>
  );
}

/* ---------- emploi du temps ---------- */
export function MySchedule() {
  const { db, user } = useStore();
  const student = db.students.find((s) => s.userId === user!.id)!;
  const items = db.schedule.filter((s) => s.formation === student.formation && student.modules.includes(s.moduleId));

  return (
    <div>
      <PageHead title="Mon emploi du temps" subtitle="Vos sessions uniquement" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"].map((day) => {
          const dayItems = items.filter((i) => i.jour === day).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
          return (
            <Card key={day} className="p-4">
              <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
                <CalendarDays size={15} className="text-cyan-300" />
                <h4 className="font-display text-sm font-bold text-white">{day}</h4>
              </div>
              {dayItems.length === 0 ? <p className="py-3 text-center text-xs text-slate-600">Libre</p> : (
                <div className="space-y-2">
                  {dayItems.map((i) => (
                    <div key={i.id} className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3">
                      <p className="font-mono text-xs font-bold text-white">{i.heureDebut} — {i.heureFin}</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-200">{db.modules.find((m) => m.id === i.moduleId)?.titre}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500"><MapPin size={11} /> {i.salle} • {db.teachers.find((t) => t.id === i.teacherId)?.prenom} {db.teachers.find((t) => t.id === i.teacherId)?.nom}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- nouveau moteur d'évaluation ---------- */
function TestEngine({ test, studentId, onClose }: { test: Test; studentId: string; onClose: () => void }) {
  const { db, update, log } = useStore();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(test.duree * 60);
  const [fin, setFin] = useState(false);
  const [result, setResult] = useState<{ note: number; pct: number; reussi: boolean; correction?: Array<{ questionId: string; bonneReponse: string; explication?: string }> } | null>(null);
  const [showReview, setShowReview] = useState(false);

  const q = test.questions[idx];
  const totalQ = test.questions.length;
  const answered = Object.keys(answers).length;

  /* timer */
  useEffect(() => {
    if (fin) return;
    if (secondsLeft <= 0) { 
      const timer = setTimeout(() => submit(), 100);
      return () => clearTimeout(timer);
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, fin]);

  const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const submit = async () => {
    if (fin) return;
    setFin(true);
    if (supabaseConfigured) {
      try {
        const remote = await submitStudentTest(test.id, answers);
        const note = Number(remote.note || 0);
        const pct = Number(remote.pourcentage || 0);
        const reussi = remote.reussi === true;
        setResult({ note, pct, reussi, correction: remote.correction });
        update((d) => ({ ...d, results: [{ id: remote.id, testId: test.id, studentId, note, pourcentage: pct, date: today(), answers, reussi, valide: remote.valide === true }, ...d.results] }));
        log(`Test "${test.titre}" soumis : ${note}/20 (${pct}%)`);
        return;
      } catch (err) {
        setFin(false);
        toast.error(err instanceof Error ? err.message : "La soumission du test a échoué.");
        return;
      }
    }
    let pts = 0, total = 0;
    test.questions.forEach((qq) => {
      total += qq.points;
      const a = (answers[qq.id] ?? "").trim().toLowerCase();
      const good = qq.bonneReponse.trim().toLowerCase();
      if (qq.type === "qcm" || qq.type === "vf") { if (a === good) pts += qq.points; }
      else if (a && (a === good || good.includes(a) || a.includes(good))) pts += qq.points;
    });
    const note = Math.round((pts / Math.max(1, total)) * 20 * 10) / 10;
    const pct = Math.round((pts / Math.max(1, total)) * 100);
    const reussi = note >= 10;
    setResult({ note, pct, reussi });
    update((d) => ({
      ...d,
      results: [
        { id: uid("RES"), testId: test.id, studentId, note, pourcentage: pct, date: today(), answers, reussi, valide: false },
        ...d.results,
      ],
    }));
    const s = db.students.find((x) => x.id === studentId);
    log(`Test "${test.titre}" soumis par ${s?.prenom} ${s?.nom} : ${note}/20 (${pct}%)`);
  };

  /* ---------- écran résultat ---------- */
  if (result) {
    const canReview = test.corrections === "immediat" && (!supabaseConfigured || !!result.correction);
    return (
      <div>
        <div className="py-8 text-center">
          <div className={cn("mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full border-4", result.reussi ? "border-emerald-400/60 bg-emerald-400/10 shadow-[0_0_40px_-10px_rgba(0,255,136,0.6)]" : "border-red-500/60 bg-red-500/10")}>
            <span className="font-display text-3xl font-black text-white">{result.note}<span className="text-base text-slate-400">/20</span></span>
          </div>
          <p className={cn("font-display text-lg font-black", result.reussi ? "text-emerald-300" : "text-red-400")}>{result.reussi ? "Réussi" : "Échoué"} — {result.pct}%</p>
          <p className="mt-1 text-xs text-slate-500">{answered}/{totalQ} questions répondues • {test.duree} minutes</p>
          <div className="mx-auto mt-3 h-2 w-48 overflow-hidden rounded-full bg-white/5">
            <div className={cn("h-full rounded-full", result.reussi ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-gradient-to-r from-red-500 to-rose-500")} style={{ width: `${result.pct}%` }} />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {canReview ? (
              <Btn onClick={() => setShowReview(!showReview)}><FileText size={15} /> {showReview ? "Masquer la correction" : "Voir la correction"}</Btn>
            ) : (
              <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-2.5 text-xs text-amber-300">
                📋 Vos réponses ont été enregistrées. La correction sera visible après validation du formateur.
              </div>
            )}
            <Btn variant="ghost" onClick={onClose}>Fermer</Btn>
          </div>
        </div>
        {canReview && showReview && (
          <div className="border-t border-white/5 pt-4 space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">Correction détaillée</p>
            {test.questions.map((qq, i) => {
              const mine = answers[qq.id] ?? "—";
              const correction = result.correction?.find((item) => item.questionId === qq.id);
              const good = correction?.bonneReponse ?? qq.bonneReponse;
              const isOk = mine.trim().toLowerCase() === good.trim().toLowerCase();
              return (
                <div key={qq.id} className={cn("rounded-xl border p-3.5", isOk ? "border-emerald-400/20 bg-emerald-400/5" : "border-red-500/20 bg-red-500/5")}>
                  <p className="text-sm font-bold text-white">{i + 1}. {qq.question}</p>
                  <p className="mt-1.5 text-xs">
                    Votre réponse : <span className={isOk ? "font-bold text-emerald-300" : "font-bold text-red-400"}>{mine} {isOk ? "✓" : "✗"}</span>
                  </p>
                  {!isOk && <p className="text-xs text-slate-400">Bonne réponse : <span className="font-bold text-emerald-300">✓ {good}</span></p>}
                  {(correction?.explication || qq.explication) && <p className="mt-1.5 rounded-lg bg-black/30 p-2 text-[11px] italic text-slate-400">💡 {correction?.explication || qq.explication}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ---------- écran de passage ---------- */
  if (!q || totalQ === 0) {
    return <Empty icon={<TestTube2 size={36} />} title="Ce test ne contient aucune question disponible." />;
  }

  return (
    <div>
      {/* header test */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <div>
          <p className="text-sm font-bold text-slate-200">{test.titre}</p>
          <p className="text-[11px] text-slate-500">{test.chapitre ? `Chapitre : ${test.chapitre} • ` : ""}Niveau : {test.niveau ?? "moyen"}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge color={secondsLeft < 60 ? "red" : "cyan"}><Clock size={11} /> {mmss(secondsLeft)}</Badge>
          <Badge color="gray">Question {idx + 1}/{totalQ}</Badge>
        </div>
      </div>

      {/* progression */}
      <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500">
        <span>Progression : {answered}/{totalQ} répondues • {totalQ - answered} restantes</span>
        <span className="text-cyan-300">{Math.round((answered / totalQ) * 100)}%</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all" style={{ width: `${(answered / totalQ) * 100}%` }} />
      </div>

      {/* navigation rapide */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {test.questions.map((qq, i) => (
          <button key={qq.id} onClick={() => setIdx(i)}
            className={cn("flex h-8 w-8 items-center justify-center rounded-lg border font-mono text-[11px] font-bold transition-all",
              i === idx ? "border-cyan-400 bg-cyan-400/20 text-cyan-200 scale-110" : answers[qq.id] ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300" : "border-white/10 text-slate-500 hover:bg-white/5")}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* question courante */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <p className="text-base font-bold text-white leading-relaxed">
          <span className="mr-2 font-mono text-cyan-300">Q{idx + 1}.</span>
          {q.question}
          <span className="ml-2 font-mono text-xs font-normal text-slate-500">({q.points} pts)</span>
        </p>
        {q.type === "courte" ? (
          <Input className="mt-4" placeholder="Saisissez votre réponse..." value={answers[q.id] ?? ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
        ) : (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(q.options ?? []).map((o: string) => (
              <button key={o} onClick={() => setAnswers({ ...answers, [q.id]: o })}
                className={cn("rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all",
                  answers[q.id] === o ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-200 shadow-[0_0_15px_-5px_rgba(0,229,255,0.5)]" : "border-white/10 text-slate-300 hover:border-white/25 hover:bg-white/5")}>
                <span className={cn("mr-2 inline-flex h-4 w-4 items-center justify-center rounded-full border align-middle", answers[q.id] === o ? "border-cyan-300 bg-cyan-300" : "border-slate-500")} />
                {o}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* navigation */}
      <div className="mt-4 flex items-center justify-between">
        <Btn variant="ghost" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>← Précédente</Btn>
        <span className="text-xs text-slate-500">{idx + 1} / {totalQ}</span>
        <div className="flex gap-2">
          {idx < totalQ - 1 ? (
            <Btn variant="outline" onClick={() => setIdx(idx + 1)}>Suivante →</Btn>
          ) : (
            <Btn variant="red" onClick={submit}><CheckCircle2 size={16} /> Soumettre le test</Btn>
          )}
        </div>
      </div>
      {idx === totalQ - 1 && answered < totalQ - 1 && (
        <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-xs text-amber-300">
          ⚠️ Vous avez {totalQ - answered} question(s) non répondue(s). Vous pouvez y revenir via les numéros en haut avant de soumettre.
        </p>
      )}
    </div>
  );
}

/* ---------- cours + tests ---------- */
export function MyCourses() {
  const { db, user } = useStore();
  const student = db.students.find((s) => s.userId === user!.id)!;
  const courses = db.courses.filter((c) => student.modules.includes(c.moduleId));
  const tests = db.tests.filter((t) => student.modules.includes(t.moduleId));
  const [taking, setTaking] = useState<Test | null>(null);
  const [loadingTest, setLoadingTest] = useState<string | null>(null);

  const modName = (id: string) => db.modules.find((m) => m.id === id)?.titre ?? "—";

  const openTest = async (test: Test) => {
    if (!supabaseConfigured) { setTaking(test); return; }
    setLoadingTest(test.id);
    try {
      const remote = await getStudentTest(test.id);
      const secured: Test = {
        id: remote.id,
        titre: remote.titre,
        moduleId: remote.module_id,
        teacherId: test.teacherId,
        questions: (remote.questions ?? []).map((q: any) => ({
          id: q.id,
          question: q.question,
          type: q.type,
          options: (q.options ?? []).map((o: any) => o.texte),
          bonneReponse: "",
          points: Number(q.points),
        })),
        date: test.date,
        duree: remote.duree,
        niveau: remote.niveau,
        tentativesMax: remote.tentatives_max,
        corrections: remote.corrections,
      };
      setTaking(secured);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Le test n'est pas disponible.");
    } finally {
      setLoadingTest(null);
    }
  };

  return (
    <div>
      <PageHead title="Mes cours & tests" subtitle="Supports pédagogiques et évaluations" />
      <h3 className="font-display mb-3 text-lg font-bold text-white">📚 Cours et supports</h3>
      {courses.length === 0 ? (
        <Empty icon={<FileText size={40} />} title="Aucun cours publié pour vos modules" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <Card key={c.id} className="p-5" glow="cyan">
              <div className="mb-2 flex items-center justify-between">
                <Badge color={c.type === "cours" ? "cyan" : c.type === "devoir" ? "gold" : "green"}>{c.type}</Badge>
                <span className="text-[10px] text-slate-500">{c.date}</span>
              </div>
              <h4 className="font-display text-base font-bold text-white">{c.titre}</h4>
              <p className="mt-1 text-sm text-slate-400">{c.description}</p>
              <p className="mt-2 text-xs text-slate-500">{modName(c.moduleId)}</p>
              <p className="mt-3 whitespace-pre-wrap rounded-lg border border-white/5 bg-black/30 p-3 font-mono text-[11px] text-slate-400">{c.content}</p>
            </Card>
          ))}
        </div>
      )}

      <h3 className="font-display mb-3 mt-8 text-lg font-bold text-white">🧪 Tests à passer</h3>
      {tests.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun test disponible pour le moment.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tests.map((t) => {
            const attempts = db.results.filter((r) => r.testId === t.id && r.studentId === student.id);
            const best = attempts.length ? Math.max(...attempts.map((r) => r.note)) : null;
            const done = best !== null && (t.tentativesMax ?? 1) <= attempts.length;
            return (
              <Card key={t.id} className="p-5" glow="red">
                <div className="flex items-center justify-between">
                  <Badge color="red">{t.niveau ?? "moyen"}</Badge>
                  {best !== null && <Badge color={best >= 10 ? "green" : "red"}>Meilleur : {best}/20</Badge>}
                </div>
                <h4 className="font-display mt-2 text-base font-bold text-white">{t.titre}</h4>
                <p className="mt-1 text-xs text-slate-400">{modName(t.moduleId)}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>{t.questions.length > 0 ? `${t.questions.length} questions` : "Questions sécurisées"}</span>
                  <span>•</span>
                  <span>{t.duree} min</span>
                  <span>•</span>
                  <span>{attempts.length}/{t.tentativesMax ?? 1} tentative(s)</span>
                </div>
                <Btn className="mt-4 w-full" variant={done ? "outline" : "red"} disabled={done || loadingTest === t.id}
                  onClick={() => void openTest(t)}>
                  <PlayCircle size={15} /> {done ? "Tentatives épuisées" : loadingTest === t.id ? "Chargement..." : "Passer le test"}
                </Btn>
              </Card>
            );
          })}
        </div>
      )}

      {taking && (
        <Modal open onClose={() => setTaking(null)} title={taking.titre} wide>
          <TestEngine test={taking} studentId={student.id} onClose={() => setTaking(null)} />
        </Modal>
      )}
    </div>
  );
}

/* ---------- documents ---------- */
export function MyDocuments() {
  const { db, user } = useStore();
  const student = db.students.find((s) => s.userId === user!.id)!;
  const docs = db.courses.filter((c) => c.type !== "cours" && student.modules.includes(c.moduleId));
  return (
    <div>
      <PageHead title="Mes documents" subtitle="Devoirs et supports téléchargeables" />
      {docs.length === 0 ? (
        <Empty icon={<FileText size={40} />} title="Aucun document" sub="Les devoirs et documents publiés par vos formateurs apparaîtront ici." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {docs.map((c) => (
            <Card key={c.id} className="p-5" glow="green">
              <Badge color={c.type === "devoir" ? "gold" : "green"}>{c.type}</Badge>
              <h4 className="font-display mt-2 text-base font-bold text-white">{c.titre}</h4>
              <p className="mt-1 text-sm text-slate-400">{c.description}</p>
              <p className="mt-2 text-[11px] text-slate-500">{db.modules.find((m) => m.id === c.moduleId)?.titre} • {c.date}</p>
              <p className="mt-3 whitespace-pre-wrap rounded-lg border border-white/5 bg-black/30 p-3 font-mono text-[11px] text-slate-400">{c.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- présences ---------- */
export function MyAttendance() {
  const { db, user } = useStore();
  const student = db.students.find((s) => s.userId === user!.id)!;
  const att = db.attendance.filter((a) => a.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date));
  const present = att.filter((a) => a.statut === "present").length;

  return (
    <div>
      <PageHead title="Mes présences" subtitle="Historique complet" />
      <div className="mb-5 grid grid-cols-3 gap-4">
        <Stat icon={<CheckCircle2 size={20} />} label="Présences" value={present} color="green" />
        <Stat icon={<Timer size={20} />} label="Retards" value={att.filter((a) => a.statut === "retard").length} color="gold" />
        <Stat icon={<XCircle size={20} />} label="Absences" value={att.filter((a) => a.statut === "absent").length} color="red" />
      </div>
      {att.length === 0 ? (
        <Empty icon={<ClipboardCheck size={40} />} title="Aucun enregistrement" sub="Vos présences seront enregistrées par l'enseignant via votre QR Code." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                <th className="px-4 py-3">Date</th><th className="px-4 py-3">Module</th><th className="px-4 py-3">Heure</th><th className="px-4 py-3">Salle</th><th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {att.map((a) => (
                <tr key={a.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-sm text-slate-300">{a.date}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{db.modules.find((m) => m.id === a.moduleId)?.titre ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{a.heure}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{a.salle}</td>
                  <td className="px-4 py-3">
                    <Badge color={a.statut === "present" ? "green" : a.statut === "retard" ? "gold" : "red"}>{a.statut}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ---------- notes ---------- */
export function MyGrades() {
  const { db, user } = useStore();
  const student = db.students.find((s) => s.userId === user!.id)!;
  const grades = db.grades.filter((g) => g.studentId === student.id);
  const results = db.results.filter((r) => r.studentId === student.id);
  const avg = grades.length ? (grades.reduce((a, g) => a + g.note, 0) / grades.length).toFixed(1) : "—";
  const avgTest = results.length ? (results.reduce((a, r) => a + r.note, 0) / results.length).toFixed(1) : "—";

  return (
    <div>
      <PageHead title="Mes notes" subtitle="Évaluations et résultats" />
      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon={<PenLine size={20} />} label="Moyenne modules" value={avg} color="cyan" />
        <Stat icon={<TestTube2 size={20} />} label="Moyenne tests" value={avgTest} color="gold" />
        <Stat icon={<Award size={20} />} label="Tests passés" value={results.length} color="green" />
        <Stat icon={<CheckCircle2 size={20} />} label="Modules notés" value={grades.length} color="blue" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-display mb-3 text-sm font-bold text-white">Notes par module</h3>
          {grades.length === 0 ? <p className="text-sm text-slate-500">Aucune note publiée.</p> : (
            <div className="space-y-2">
              {grades.map((g) => (
                <div key={g.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div>
                    <p className="text-sm font-bold text-slate-200">{db.modules.find((m) => m.id === g.moduleId)?.titre}</p>
                    <p className="text-[11px] text-slate-500">{g.appreciation} • {g.date}</p>
                  </div>
                  <Badge color={g.note >= 10 ? "green" : "red"}>{g.note}/20</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="font-display mb-3 text-sm font-bold text-white">Résultats des tests</h3>
          {results.length === 0 ? <p className="text-sm text-slate-500">Aucun test passé.</p> : (
            <div className="space-y-2">
              {results.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div>
                    <p className="text-sm font-bold text-slate-200">{db.tests.find((t) => t.id === r.testId)?.titre ?? "Test"}</p>
                    <p className="text-[11px] text-slate-500">Réussite {r.pourcentage}% • {r.date}</p>
                  </div>
                  <Badge color={r.note >= 10 ? "green" : "red"}>{r.note}/20</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ---------- paiements ---------- */
export function MyPayments() {
  const { db, user } = useStore();
  const student = db.students.find((s) => s.userId === user!.id)!;
  const pays = db.payments.filter((p) => p.studentId === student.id);
  const total = pays.reduce((a, p) => a + p.montant, 0);

  const receipt = (p: any) => {
    printHTML(`Reçu ${p.id}`, `
      <div class="receipt">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><h1 class="accent">SENTINELLES NUMÉRIQUES</h1><p>Centre de Formation — Génie Info & Industriel</p></div>
          <div style="text-align:right"><p class="label">Reçu N°</p><p class="font-mono">${p.id}</p></div>
        </div>
        <hr style="border-color:#1d2b45;margin:16px 0">
        <div class="grid">
          <div><p class="label">Apprenant</p><p style="font-weight:700">${student.prenom} ${student.nom} (${student.id})</p></div>
          <div><p class="label">Date</p><p>${p.date}</p></div>
          <div><p class="label">Libellé</p><p>${p.libelle}</p></div>
          <div><p class="label">Mode</p><p>${p.mode}</p></div>
        </div>
        <div class="row" style="margin-top:16px"><span>Montant</span><span class="gold" style="font-size:20px;font-weight:800">${money(p.montant)}</span></div>
        <div class="row"><span>Statut</span><span class="green" style="font-weight:700">${p.statut.toUpperCase()}</span></div>
        <p style="margin-top:24px;text-align:center" class="label">SENTINELLES NUMÉRIQUES • ENIA 2.0</p>
      </div>`);
  };

  return (
    <div>
      <PageHead title="Mes paiements" subtitle="Suivi de vos règlements" />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Card className="p-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">Total réglé</p><p className="font-display text-2xl font-black text-emerald-300">{money(total)}</p></Card>
        <Card className="p-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">Statut</p><p className="mt-1.5">{student.statutPaiement === "paye" ? <Badge color="green">Payé</Badge> : student.statutPaiement === "partiel" ? <Badge color="gold">Partiel</Badge> : <Badge color="red">Impayé</Badge>}</p></Card>
        <Card className="p-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">Contact</p><p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-emerald-300"><Phone size={13} /> {db.settings.infos.whatsapp.join(" / ")}</p></Card>
      </div>
      {pays.length === 0 ? (
        <Empty icon={<Wallet size={40} />} title="Aucun paiement enregistré" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                <th className="px-4 py-3">Libellé</th><th className="px-4 py-3">Montant</th><th className="px-4 py-3">Mode</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3 text-right">Reçu</th>
              </tr>
            </thead>
            <tbody>
              {pays.map((p) => (
                <tr key={p.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-sm font-bold text-slate-200">{p.libelle}</td>
                  <td className="px-4 py-3 font-mono text-sm text-white">{money(p.montant)}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{p.mode}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{p.date}</td>
                  <td className="px-4 py-3">{p.statut === "paye" ? <Badge color="green">Payé</Badge> : p.statut === "partiel" ? <Badge color="gold">Partiel</Badge> : <Badge color="red">Impayé</Badge>}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => receipt(p)} className="rounded-lg border border-white/10 p-2 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300"><ReceiptText size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ---------- certificat ---------- */
export function MyCertificate() {
  const { db, user } = useStore();
  const student = db.students.find((s) => s.userId === user!.id)!;
  const cert = db.certificates.find((c) => c.studentId === student.id);

  if (!cert) {
    return (
      <div>
        <PageHead title="Mon certificat" />
        <Empty icon={<Award size={40} />} title="Certificat non disponible" sub="Votre certificat sera émis après le test final de fin de formation." />
      </div>
    );
  }

  const mods = db.modules.filter((m) => cert.modules.includes(m.id));
  const print = () => {
    printHTML(`Certificat ${cert.numero}`, `
      <div class="receipt" style="text-align:center">
        <p class="accent" style="letter-spacing:4px;font-size:12px">SENTINELLES NUMÉRIQUES</p>
        <p class="label">Centre de Formation en Génie Informatique & Génie Industriel</p>
        <div style="margin:24px 0"><h1 style="font-size:40px;letter-spacing:6px">CERTIFICAT</h1><p class="label">de formation professionnelle</p></div>
        <p class="label">Décerné à</p>
        <h2 style="font-size:28px;color:#FFB300;margin:8px 0">${student.prenom} ${student.nom}</h2>
        <p class="label">N° ${student.id} • ${formationLabel(cert.formation)}</p>
        <p style="margin:20px auto;max-width:520px">pour avoir suivi avec succès la formation de <b>${formationLabel(cert.formation)}</b> du ${cert.periode}.</p>
        <div class="row" style="max-width:420px;margin:0 auto"><span>Résultat</span><span class="green">${cert.resultat} — ${cert.note}/20</span></div>
        <div style="margin-top:32px;display:flex;justify-content:space-between;align-items:end">
          <div style="text-align:center"><p style="border-top:1px solid #00E5FF;padding-top:6px;font-size:11px">Coach Fredich FOUNDOU<br>Responsable du Centre</p></div>
          <div style="text-align:center"><p class="font-mono" style="font-size:12px">${cert.numero}</p><p class="label">Certificat vérifiable</p></div>
        </div>
      </div>`);
  };

  return (
    <div>
      <PageHead title="Mon certificat" subtitle="Certification des délibérés par ENIA 2.0"
        actions={<Btn onClick={print}><Printer size={16} /> Imprimer</Btn>} />
      <div id="print-area" className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-[#0A1224] to-[#120d1f] p-8 text-center">
        <div className="bg-grid-hex pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-400/10">
            <ShieldCheck size={22} className="text-cyan-300" />
          </div>
          <p className="font-display text-sm font-black tracking-[0.3em] text-cyan-300">SENTINELLES NUMÉRIQUES</p>
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Centre de Formation en Génie Informatique & Génie Industriel</p>
          <h2 className="font-display mt-6 text-4xl font-black tracking-[0.2em] text-white">CERTIFICAT</h2>
          <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-slate-400">de formation professionnelle</p>
          <p className="mt-6 text-[11px] uppercase tracking-[0.25em] text-slate-500">Décerné à</p>
          <p className="font-display mt-1 text-3xl font-black text-amber-300 drop-shadow-[0_0_16px_rgba(255,179,0,0.4)]">{student.prenom} {student.nom}</p>
          <p className="mt-1 font-mono text-xs text-cyan-300/70">N° {student.id} • {formationLabel(cert.formation)}</p>
          <p className="mx-auto mt-4 max-w-md text-sm text-slate-300">pour avoir suivi avec succès la formation de <b className="text-white">{formationLabel(cert.formation)}</b> du {cert.periode}.</p>
          <div className="mx-auto mt-4 flex max-w-md flex-wrap justify-center gap-1.5">
            {mods.map((m) => <span key={m.id} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-slate-300">{m.numero}. {m.titre}</span>)}
          </div>
          <div className="mx-auto mt-5 flex max-w-md items-center justify-between border-t border-amber-400/20 pt-4">
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Résultat</p>
              <p className="font-bold text-emerald-300">{cert.resultat} — {cert.note}/20</p>
            </div>
            <div className="rounded-lg bg-white p-1"><QRCodeSVG value={`${window.location.origin}/#/certificat/${encodeURIComponent(cert.numero)}`} size={64} /></div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">N° certificat</p>
              <p className="font-mono text-[11px] text-cyan-300">{cert.numero}</p>
            </div>
          </div>
          <p className="mt-5 text-[11px] text-slate-500">Signature : Coach Fredich FOUNDOU — Responsable du Centre</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- bourse ---------- */
const BOURSE_FLOW = [
  { k: "en_attente", l: "En attente", d: "Votre dossier est en cours d'examen." },
  { k: "test_programme", l: "Test programmé", d: "Le test final de fin de formation est planifié." },
  { k: "test_effectue", l: "Test effectué", d: "Votre test a été enregistré." },
  { k: "admis", l: "Admis", d: "Félicitations ! Vous êtes admissible à la bourse." },
  { k: "bourse_attribuee", l: "Bourse attribuée", d: "🎉 Bourse de 3 ans d'études 100% gratuite à ENIA 2.0 !" },
];

export function MyScholarship() {
  const { db, user } = useStore();
  const student = db.students.find((s) => s.userId === user!.id)!;
  const b = db.scholarships.find((x) => x.studentId === student.id);
  const cur = b?.statut ?? "en_attente";
  const idx = BOURSE_FLOW.findIndex((x) => x.k === cur);

  return (
    <div>
      <PageHead title="Ma bourse — MON AVENIR" subtitle="3 ans d'études 100% gratuites à ENIA 2.0" />
      <Card className="mb-6 flex items-center gap-4 border-amber-400/30 bg-gradient-to-r from-amber-400/10 via-transparent to-transparent p-5">
        <BadgeDollarSign size={30} className="shrink-0 text-amber-300" />
        <p className="text-sm text-slate-300">
          Les apprenants qui réussissent le <b className="text-white">test final</b> bénéficient d'une <b className="text-amber-300">bourse d'études de 3 ans à ENIA 2.0</b>, 100% gratuite.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-6">
          <h3 className="font-display mb-5 text-sm font-bold text-white">Parcours de votre dossier</h3>
          <div className="space-y-1">
            {BOURSE_FLOW.map((s, i) => {
              const done = i <= idx;
              const current = i === idx;
              return (
                <div key={s.k} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-black",
                      done ? "border-amber-400/60 bg-amber-400/15 text-amber-300" : "border-white/10 text-slate-600")}>
                      {done ? <CheckCircle2 size={15} /> : i + 1}
                    </div>
                    {i < BOURSE_FLOW.length - 1 && <div className={cn("h-6 w-0.5", done ? "bg-amber-400/40" : "bg-white/10")} />}
                  </div>
                  <div className={cn("mb-4 rounded-xl border p-3.5", current ? "border-amber-400/50 bg-amber-400/10" : "border-white/5 bg-white/[0.02]")}>
                    <p className={cn("text-sm font-bold", done ? "text-amber-300" : "text-slate-400")}>{s.l}</p>
                    <p className="text-xs text-slate-400">{s.d}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-6 text-center" glow="gold">
            <BadgeDollarSign size={36} className="mx-auto text-amber-300" />
            <p className="font-display mt-3 text-2xl font-black text-white">3 ANS D'ÉTUDES</p>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">100% gratuites à ENIA 2.0</p>
            <div className="mt-4">
              <Badge color={cur === "bourse_attribuee" ? "green" : cur === "admis" ? "gold" : "gray"} className="text-xs">
                Statut : {BOURSE_FLOW.find((x) => x.k === cur)?.l}
              </Badge>
            </div>
          </Card>
          <Card className="p-5">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">Vos coordonnées</h4>
            <div className="space-y-2 text-sm text-slate-300">
              <p className="flex items-center gap-2"><Mail size={14} className="text-cyan-300" /> {student.email || "—"}</p>
              <p className="flex items-center gap-2"><Phone size={14} className="text-emerald-300" /> {student.telephone}</p>
              <p className="flex items-center gap-2"><UserCircle2 size={14} className="text-blue-400" /> {student.id}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
