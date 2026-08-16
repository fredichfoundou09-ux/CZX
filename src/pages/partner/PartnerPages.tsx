import { useEffect, useState } from "react";
import {
  BookOpen, CalendarDays, ClipboardCheck, FileText, TestTube2, PenLine, Award,
  BadgeDollarSign, GraduationCap, ShieldCheck, Search, Sparkles, Users,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/utils/cn";
import { Card, Badge, PageHead, Empty, formationLabel, moduleIcon } from "@/lib/ui";
import { supabaseConfigured } from "@/lib/supabase/client";
import { partnerService } from "@/lib/supabase/partner";

/* -------- Lecteur commun aux pages partenaires -------- */
function PartnerFilter({ q, setQ, placeholder }: { q: string; setQ: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative mb-4">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
      <input className="w-full rounded-xl border border-white/10 bg-[#05070D]/80 pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-400/60"
        placeholder={placeholder ?? "Rechercher..."} value={q} onChange={(e) => setQ(e.target.value)} />
    </div>
  );
}

function NoData({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <Empty icon={icon} title={title} />;
}

/* -------- Formations -------- */
export function PartnerFormations() {
  const { db } = useStore();
  const [modules, setModules] = useState<any[]>([]);
  useEffect(() => {
    if (supabaseConfigured) partnerService.getModules().then(setModules).catch(() => setModules([]));
    else setModules(db.modules);
  }, [db]);
  return (
    <div className="space-y-5">
      <PageHead title="Formations" subtitle={`${modules.length} module(s) en catalogue`} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((m) => (
          <Card key={m.id} className="p-5" glow={(m.formation_code || m.formation) === "informatique" ? "red" : "cyan"}>
            <div className="mb-3 flex items-center gap-3">
              <div className={cn("rounded-xl border p-2.5", (m.formation_code || m.formation) === "informatique" ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300")}>
                {moduleIcon(m.icon, "h-5 w-5")}
              </div>
              <div>
                <p className="font-mono text-[10px] font-bold tracking-[0.25em] text-slate-500">MODULE {String(m.numero).padStart(2, "0")}</p>
                <h4 className="font-display text-sm font-bold text-white">{m.titre}</h4>
              </div>
            </div>
            <p className="text-xs text-slate-400">{m.description || "Description non disponible."}</p>
            {m.formation_name && <p className="mt-2 text-[11px] text-cyan-300">{m.formation_name}</p>}
            {Array.isArray(m.notions) && <div className="mt-3 flex flex-wrap gap-1.5">{m.notions.map((n: string, i: number) => <span key={i} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-slate-400">{n.split(" • ")[0]}</span>)}</div>}
          </Card>
        ))}
        {modules.length === 0 && <NoData icon={<BookOpen size={36} />} title="Aucun module" />}
      </div>
    </div>
  );
}

/* -------- Emploi du temps -------- */
export function PartnerSchedule() {
  const { db } = useStore();
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    if (supabaseConfigured) partnerService.getSchedule().then((rows) => setItems(rows.map((x) => ({ ...x, heureDebut: x.heure_debut, heureFin: x.heure_fin, moduleTitle: x.module_name })))).catch(() => setItems([]));
    else setItems(db.schedule);
  }, [db]);
  return (
    <div className="space-y-5">
      <PageHead title="Emploi du temps" subtitle={`${items.length} créneau(x)`} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"].map((day) => {
          const dayItems = items.filter((i) => i.jour === day).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
          return (
            <Card key={day} className="p-4">
              <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-2"><CalendarDays size={15} className="text-cyan-300" /><h4 className="font-display text-sm font-bold text-white">{day}</h4></div>
              {dayItems.length === 0 ? <p className="py-3 text-center text-xs text-slate-600">Libre</p> : dayItems.map((i) => (
                <div key={i.id} className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 mb-2">
                  <p className="font-mono text-xs font-bold text-white">{i.heureDebut} — {i.heureFin}</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-200">{i.moduleTitle || db.modules.find((m) => m.id === i.moduleId)?.titre}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">Salle {i.salle}</p>
                </div>
              ))}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* -------- Présences -------- */
export function PartnerAttendance() {
  const { db } = useStore();
  const [q, setQ] = useState("");
  const [allRecords, setAllRecords] = useState<any[]>([]);
  useEffect(() => {
    if (supabaseConfigured) partnerService.getAttendance().then((rows) => setAllRecords(rows.map((x) => ({ ...x, id: `${x.student_id}-${x.date}-${x.module_name}`, studentId: x.student_id, studentName: `${x.prenom} ${x.nom}`, moduleTitle: x.module_name })))).catch(() => setAllRecords([]));
    else setAllRecords(db.attendance);
  }, [db]);
  const records = allRecords.filter((a) => { const s = db.students.find((x) => x.id === a.studentId); return (a.studentName || (s ? `${s.prenom} ${s.nom}` : "")).toLowerCase().includes(q.toLowerCase()); });
  return (
    <div className="space-y-5">
      <PageHead title="Présences" subtitle={`${records.length} enregistrement(s)`} />
      <PartnerFilter q={q} setQ={setQ} placeholder="Filtrer par apprenant..." />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left">
          <thead><tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500"><th className="px-4 py-3">Apprenant</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Module</th><th className="px-4 py-3">Statut</th></tr></thead>
          <tbody>{records.slice(0, 50).map((a) => {
            const s = db.students.find((x) => x.id === a.studentId);
            return (<tr key={a.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
              <td className="px-4 py-3 text-sm font-bold text-white">{a.studentName || (s ? `${s.prenom} ${s.nom}` : "—")}</td>
              <td className="px-4 py-3 text-sm text-slate-400">{a.date}</td>
              <td className="px-4 py-3 text-sm text-slate-400">{a.moduleTitle || db.modules.find((m) => m.id === a.moduleId)?.titre || "—"}</td>
              <td className="px-4 py-3"><Badge color={a.statut === "present" ? "green" : a.statut === "retard" ? "gold" : "red"}>{a.statut}</Badge></td>
            </tr>);})}</tbody>
        </table>
        {records.length === 0 && <NoData icon={<ClipboardCheck size={36} />} title="Aucune présence enregistrée" />}
      </Card>
    </div>
  );
}

/* -------- Cours -------- */
export function PartnerCourses() {
  const { db } = useStore();
  const [courses, setCourses] = useState<any[]>([]);
  useEffect(() => {
    if (supabaseConfigured) partnerService.getCourses().then(setCourses).catch(() => setCourses([]));
    else setCourses(db.courses);
  }, [db]);
  return (
    <div className="space-y-5">
      <PageHead title="Cours publiés" subtitle={`${courses.length} cours accessible(s)`} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((c) => (
          <Card key={c.id} className="p-5" glow="cyan">
            <Badge color={c.type === "cours" ? "cyan" : c.type === "devoir" ? "gold" : "green"}>{c.type}</Badge>
            <h4 className="font-display mt-2 text-base font-bold text-white">{c.titre}</h4>
            <p className="mt-1 text-sm text-slate-400">{c.description}</p>
            <p className="mt-2 text-xs text-slate-500">{c.formation_name || db.modules.find((m) => m.id === c.moduleId)?.titre}</p>
          </Card>
        ))}
        {courses.length === 0 && <NoData icon={<FileText size={36} />} title="Aucun cours publié" />}
      </div>
    </div>
  );
}

/* -------- Tests -------- */
export function PartnerTests() {
  const { db } = useStore();
  const [tests, setTests] = useState<any[]>([]);
  useEffect(() => {
    if (supabaseConfigured) partnerService.getTests().then(setTests).catch(() => setTests([]));
    else setTests(db.tests);
  }, [db]);
  return (
    <div className="space-y-5">
      <PageHead title="Tests" subtitle={`${tests.length} évaluation(s)`} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tests.map((t) => (
          <Card key={t.id} className="p-5" glow="red">
            <div className="flex items-center justify-between"><Badge color="red">Test</Badge><span className="text-[10px] text-slate-500">{t.date_debut || t.date}</span></div>
            <h4 className="font-display mt-2 text-base font-bold text-white">{t.titre}</h4>
            <p className="mt-1 text-xs text-slate-400">{t.module_name || db.modules.find((m) => m.id === t.moduleId)?.titre}</p>
            <p className="mt-2 text-xs text-slate-500">Durée : {t.duree} min • Niveau : {t.niveau || "—"}</p>
          </Card>
        ))}
        {tests.length === 0 && <NoData icon={<TestTube2 size={36} />} title="Aucun test" />}
      </div>
    </div>
  );
}

/* -------- Notes -------- */
export function PartnerGrades() {
  const { db } = useStore();
  const [q, setQ] = useState("");
  const [grades, setGrades] = useState<any[]>([]);
  useEffect(() => {
    if (supabaseConfigured) partnerService.getGrades().then(setGrades).catch(() => setGrades([]));
    else setGrades(db.grades);
  }, [db]);
  const filtered = grades.filter((g) => { const s = db.students.find((x) => x.id === g.studentId); return (g.nom ? `${g.nom} ${g.prenom}` : s ? `${s.nom} ${s.prenom}` : "").toLowerCase().includes(q.toLowerCase()); });
  return (
    <div className="space-y-5">
      <PageHead title="Notes" subtitle={`${filtered.length} note(s)`} />
      <PartnerFilter q={q} setQ={setQ} placeholder="Filtrer par apprenant..." />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left">
          <thead><tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500"><th className="px-4 py-3">Apprenant</th><th className="px-4 py-3">Module</th><th className="px-4 py-3">Note</th><th className="px-4 py-3">Appréciation</th></tr></thead>
          <tbody>{filtered.map((g) => (<tr key={g.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
            <td className="px-4 py-3 text-sm font-bold text-white">{g.prenom || db.students.find((x) => x.id === g.studentId)?.prenom} {g.nom || db.students.find((x) => x.id === g.studentId)?.nom}</td>
            <td className="px-4 py-3 text-sm text-slate-400">{g.module_name || db.modules.find((m) => m.id === g.moduleId)?.titre || "—"}</td>
            <td className="px-4 py-3"><Badge color={g.note >= 10 ? "green" : "red"}>{g.note}/20</Badge></td>
            <td className="px-4 py-3 text-xs text-slate-400">{g.appreciation}</td>
          </tr>))}</tbody>
        </table>
        {filtered.length === 0 && <NoData icon={<PenLine size={36} />} title="Aucune note" />}
      </Card>
    </div>
  );
}

/* -------- Certificats -------- */
export function PartnerCertificates() {
  const { db } = useStore();
  const [certificates, setCertificates] = useState<any[]>([]);
  useEffect(() => {
    if (supabaseConfigured) partnerService.getCertificates().then(setCertificates).catch(() => setCertificates([]));
    else setCertificates(db.certificates);
  }, [db]);
  return (
    <div className="space-y-5">
      <PageHead title="Certificats" subtitle={`${certificates.length} certificat(s) émis`} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {certificates.map((c) => (
          <Card key={c.id} className="p-5" glow="gold">
            <div className="flex items-center justify-between"><Award size={20} className="text-amber-300" /><Badge color="gold">{c.resultat}</Badge></div>
            <h4 className="font-display mt-2 text-lg font-black text-white">{c.formation_name || "Certificat institutionnel"}</h4>
            <p className="font-mono text-[11px] text-amber-300/80">{c.numero}</p>
            <p className="mt-1 text-xs text-slate-400">{c.formation_name || formationLabel(c.formation)} • {c.periode}</p>
            <p className="mt-1 text-xs text-slate-500">Note : {c.note}/20</p>
          </Card>
        ))}
        {certificates.length === 0 && <NoData icon={<Award size={36} />} title="Aucun certificat émis" />}
      </div>
    </div>
  );
}

/* -------- Bourses -------- */
export function PartnerScholarships() {
  const { db } = useStore();
  const [scholarships, setScholarships] = useState<any[]>([]);
  useEffect(() => {
    if (supabaseConfigured) partnerService.getScholarships().then(setScholarships).catch(() => setScholarships([]));
    else setScholarships(db.scholarships);
  }, [db]);
  return (
    <div className="space-y-5">
      <PageHead title="Bourses" subtitle="Bourses MON AVENIR" />
      <Card className="flex items-center gap-4 border-amber-400/30 bg-gradient-to-r from-amber-400/10 via-transparent to-transparent p-5">
        <BadgeDollarSign size={28} className="shrink-0 text-amber-300" />
        <p className="text-sm text-slate-300">Les apprenants qui réussissent le test final bénéficient d'une <b className="text-amber-300">bourse d'études de 3 ans à ENIA 2.0</b>.</p>
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left">
          <thead><tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500"><th className="px-4 py-3">Apprenant</th><th className="px-4 py-3">Formation</th><th className="px-4 py-3">Statut</th></tr></thead>
          <tbody>{scholarships.map((s) => (<tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
            <td className="px-4 py-3 text-sm font-bold text-white">{s.prenom || db.students.find((x) => x.id === s.studentId)?.prenom} {s.nom || db.students.find((x) => x.id === s.studentId)?.nom}</td>
            <td className="px-4 py-3">{s.formation_name || formationLabel(db.students.find((x) => x.id === s.studentId)?.formation ?? "informatique")}</td>
            <td className="px-4 py-3"><Badge color={s.statut === "bourse_attribuee" ? "green" : s.statut === "admis" ? "gold" : "gray"}>{s.statut.replace("_", " ")}</Badge></td>
          </tr>))}</tbody>
        </table>
        {scholarships.length === 0 && <NoData icon={<BadgeDollarSign size={36} />} title="Aucune bourse" />}
      </Card>
    </div>
  );
}

/* -------- Rapports -------- */
export function PartnerReports() {
  const { db } = useStore();
  const [remote, setRemote] = useState<any>(null);
  useEffect(() => { if (supabaseConfigured) partnerService.getDashboard().then(setRemote).catch(() => setRemote(null)); }, []);
  const totalStudents = remote?.total_students ?? db.students.length;
  const totalTeachers = remote?.total_teachers ?? db.teachers.length;
  const totalPresence = remote?.total_attendance ?? db.attendance.length;
  const totalPresent = remote?.total_present ?? db.attendance.filter((a) => a.statut === "present").length;
  const tauxPresence = totalPresence > 0 ? Math.round((totalPresent / totalPresence) * 100) : 0;
  const totalGrades = db.grades.length;
  const avgNote = totalGrades > 0 ? (db.grades.reduce((a, g) => a + g.note, 0) / totalGrades).toFixed(1) : "—";
  const totalCerts = remote?.total_certificates ?? db.certificates.length;

  return (
    <div className="space-y-5">
      <PageHead title="Rapports institutionnels" subtitle="Indicateurs généraux pour le partenaire" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Effectifs" value={totalStudents} icon={<Users size={18} />} color="cyan" />
        <StatCard label="Enseignants" value={totalTeachers} icon={<GraduationCap size={18} />} color="blue" />
        <StatCard label="Taux de présence" value={`${tauxPresence}%`} icon={<ClipboardCheck size={18} />} color="green" />
        <StatCard label="Moyenne générale" value={avgNote} icon={<PenLine size={18} />} color="gold" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Certificats émis" value={totalCerts} icon={<Award size={18} />} color="gold" />
        <StatCard label="Modules" value={db.modules.length} icon={<BookOpen size={18} />} color="cyan" />
        <StatCard label="Présences totales" value={totalPresence} icon={<ClipboardCheck size={18} />} color="blue" />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color: _color }: { label: string; value: string | number; icon: React.ReactNode; color?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="font-display mt-1.5 text-2xl font-bold text-white">{value}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.05] p-2.5 text-slate-300">{icon}</div>
      </div>
    </Card>
  );
}

/* -------- Enya -------- */
export function PartnerEnya() {
  return (
    <div className="space-y-5">
      <PageHead title="ENIA 2.0" subtitle="École du Numérique et de l'Intelligence Artificielle" />
      <Card className="border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-transparent to-transparent p-6" glow="cyan">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300"><Sparkles size={24} /></div>
          <div>
            <h3 className="font-display text-sm font-black text-white">ENIA 2.0</h3>
            <p className="mt-1 text-sm text-slate-300">Module de consultation partenaire pour ENIA 2.0 — informations institutionnelles, formations et partenariats.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* -------- Profil -------- */
export function PartnerProfile() {
  const { user, db } = useStore();
  const profile = db.users.find((u) => u.id === user?.id);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  useEffect(() => {
    if (supabaseConfigured) partnerService.getProfile().then(setPartnerProfile).catch(() => setPartnerProfile(null));
  }, []);
  return (
    <div className="space-y-5">
      <PageHead title="Mon profil" subtitle="Informations de votre compte partenaire" />
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/30 to-cyan-600/30 border border-blue-400/30"><ShieldCheck size={28} className="text-blue-300" /></div>
          <div>
            <p className="font-display text-lg font-black text-white">{profile?.name}</p>
            <p className="font-mono text-sm text-cyan-300">{profile?.username}</p>
            <Badge color="blue">Partenaire</Badge>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <InfoCard label="Email" value={profile?.email || "—"} />
          <InfoCard label="Téléphone" value={profile?.phone || "—"} />
          <InfoLabel label="Organisation" value={partnerProfile?.partners_organizations?.nom || "—"} />
          <InfoLabel label="Périmètre" value={partnerProfile?.scope || "Lecture seule"} />
          <InfoLabel label="Poste" value={partnerProfile?.poste || "—"} />
          <InfoLabel label="Validité" value={partnerProfile ? `${partnerProfile.date_debut}${partnerProfile.date_fin ? ` → ${partnerProfile.date_fin}` : ""}` : profile?.createdAt || "—"} />
        </div>
        <div className="mt-4 rounded-xl border border-blue-400/20 bg-blue-400/5 p-3 text-xs text-blue-200">
          Votre accès est strictement en lecture seule. Aucune modification n'est possible depuis cet espace.
        </div>
      </Card>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-sm font-bold text-slate-200">{value}</p></div>;
}
function InfoLabel({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-300">{value}</p></div>;
}
