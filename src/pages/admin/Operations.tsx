import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  PlusCircle, Trash2, Pencil, CalendarDays, Clock, MapPin, ClipboardCheck, FileText, TestTube2,
  PenLine, Wallet, Award, BadgeDollarSign, Printer, CheckCircle2, XCircle, Timer, BookOpen,
  GraduationCap, Eye, Save, ShieldCheck, ReceiptText,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/utils/cn";
import {
  Btn, Badge, Card, Empty, Field, Input, Modal, PageHead, Select, Textarea, uid, today,
  money, formationLabel, moduleIcon, printHTML, safeExternalUrl,
} from "@/lib/ui";
import { Formation, AttendanceStatus, Module } from "@/lib/types";
import { ModuleEditorModal, ModuleDetailModal } from "@/pages/shared/ModuleFeature";
import { supabaseConfigured } from "@/lib/supabase/client";
import { generateCertificatePdf } from "@/lib/supabase/certificates";
import { toast } from "sonner";
import { deleteModule, saveModule } from "@/lib/supabase/modules";
import { createSchedule, deleteSchedule } from "@/lib/supabase/schedules";
import { recordAttendance } from "@/lib/supabase/attendanceActions";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

/* ================= MODULES ================= */
export function ModulesPage() {
  const { db, getFormationId, update, log } = useStore();
  const [tab, setTab] = useState<Formation>("informatique");
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<any>({ titre: "", icon: "code", notions: "" });
  const [ficheMod, setFicheMod] = useState<Module | null>(null);
  const [previewMod, setPreviewMod] = useState<Module | null>(null);

  const list = db.modules.filter((m) => m.formation === tab).sort((a, b) => a.numero - b.numero);

  const save = async () => {
    if (!form.titre) return;
    const notions = form.notions.split("\n").map((s: string) => s.trim()).filter(Boolean);
    let persistedId = editing?.id as string | undefined;
    if (supabaseConfigured) {
      const formationId = getFormationId(tab);
      if (!formationId) { toast.error("Formation Supabase introuvable."); return; }
      try {
        const persisted = await saveModule({
          ...(editing ? { id: editing.id } : {}),
          formation_id: formationId,
          numero: editing?.numero ?? db.modules.filter((m) => m.formation === tab).length + 1,
          titre: form.titre.trim(),
          icon: form.icon,
          description: editing?.description ?? "",
          objectifs: editing?.objectifs ?? [],
          programme: editing?.programme ?? "",
          duree: editing?.duree ?? "",
          extra: editing?.extra ?? "",
          active: true,
        }, [], notions);
        persistedId = persisted.id;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Impossible d'enregistrer le module.");
        return;
      }
    }
    if (editing) {
      update((d) => ({ ...d, modules: d.modules.map((m) => (m.id === editing.id ? { ...m, titre: form.titre, icon: form.icon, notions } : m)) }));
      log(`Module modifié : ${form.titre}`);
    } else {
      const numero = db.modules.filter((m) => m.formation === tab).length + 1;
      const id = persistedId || `mod-${tab === "informatique" ? "inf" : "ind"}-${Date.now().toString(36)}`;
      update((d) => ({
        ...d,
        modules: [
          ...d.modules,
          {
            id, formation: tab, numero, titre: form.titre, icon: form.icon, notions,
            description: "", objectifs: [], programme: "", chapitres: [], duree: "", image: "", extra: "",
          },
        ],
      }));
      log(`Module ajouté : ${form.titre}`);
    }
    setCreating(false); setEditing(null);
  };

  const icons = ["code", "network", "server", "terminal", "shield", "sigma", "lock", "cog", "zap", "cpu", "plug", "factory", "waves", "git", "ruler", "binary", "audio", "calc", "wrench"];

  return (
    <div>
      <PageHead title="Formations & Modules" subtitle="Le catalogue est directement affiché sur le site public"
        actions={<Btn onClick={() => { setForm({ titre: "", icon: "code", notions: "" }); setEditing(null); setCreating(true); }}><PlusCircle size={16} /> Ajouter un module</Btn>} />
      <div className="mb-5 flex gap-2">
        {(["informatique", "industriel"] as Formation[]).map((f) => (
          <button key={f} onClick={() => setTab(f)}
            className={cn("rounded-xl border px-5 py-2.5 text-sm font-bold transition-all",
              tab === f ? (f === "informatique" ? "border-red-500/60 bg-red-500/10 text-red-400" : "border-cyan-400/60 bg-cyan-400/10 text-cyan-300") : "border-white/10 text-slate-400 hover:bg-white/5")}>
            {formationLabel(f)} ({db.modules.filter((m) => m.formation === f).length})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Empty
          icon={<BookOpen size={40} />}
          title="Aucun module enregistré."
          sub="Commencez par créer le premier module de cette formation, avec son programme et ses chapitres."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((m) => (
          <Card key={m.id} className="p-5" glow={tab === "informatique" ? "red" : "cyan"}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("rounded-xl border p-2.5", tab === "informatique" ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300")}>
                  {moduleIcon(m.icon, "h-5 w-5")}
                </div>
                <div>
                  <p className="font-mono text-[10px] font-bold tracking-[0.25em] text-slate-500">MODULE {String(m.numero).padStart(2, "0")}</p>
                  <h4 className="font-display text-sm font-bold text-white">{m.titre}</h4>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setPreviewMod(m)} title="Prévisualiser la fiche publique"
                  className="rounded-lg border border-white/10 p-2 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300"><Eye size={14} /></button>
                <button onClick={() => setFicheMod(m)} title="Éditer la fiche détaillée (programme, chapitres, image)"
                  className="rounded-lg border border-white/10 p-2 text-slate-300 hover:border-emerald-400/40 hover:text-emerald-300"><FileText size={14} /></button>
                <button onClick={() => { setForm({ titre: m.titre, icon: m.icon, notions: m.notions.join("\n") }); setEditing(m); setCreating(true); }}
                  className="rounded-lg border border-white/10 p-2 text-slate-300 hover:border-amber-400/40 hover:text-amber-300" title="Modifier titre / icône / notions"><Pencil size={14} /></button>
                <button onClick={() => toast.warning(`Supprimer le module « ${m.titre} » ?`, {
                  duration: 10000,
                  action: { label: "Supprimer", onClick: async () => { try { if (supabaseConfigured) await deleteModule(m.id); update((d) => ({ ...d, modules: d.modules.filter((x) => x.id !== m.id) })); toast.success("Module supprimé."); } catch (err) { toast.error(err instanceof Error ? err.message : "Suppression impossible."); } } },
                  cancel: { label: "Annuler", onClick: () => undefined },
                })}
                  className="rounded-lg border border-white/10 p-2 text-slate-300 hover:border-red-500/40 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
            <ul className="mt-3 space-y-1">
              {m.notions.map((n, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-400"><span className={cn("mt-1 h-1 w-1 shrink-0 rounded-full", tab === "informatique" ? "bg-red-400" : "bg-cyan-400")} />{n}</li>
              ))}
            </ul>
          </Card>
        ))}
        </div>
      )}

      {list.length === 0 && (
        <div className="mt-4 flex justify-center">
          <Btn onClick={() => { setForm({ titre: "", icon: "code", notions: "" }); setEditing(null); setCreating(true); }}>
            <PlusCircle size={16} /> + Créer un module
          </Btn>
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title={editing ? "Modifier le module" : "Nouveau module"}>
        <div className="space-y-4">
          <Field label="Titre du module"><Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} /></Field>
          <Field label="Icône">
            <div className="grid grid-cols-6 gap-1.5">
              {icons.map((ic) => (
                <button key={ic} type="button" onClick={() => setForm({ ...form, icon: ic })}
                  className={cn("flex items-center justify-center rounded-lg border p-2", form.icon === ic ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-300" : "border-white/10 text-slate-400 hover:bg-white/5")}>
                  {moduleIcon(ic, "h-4 w-4")}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Notions" hint="Une notion par ligne">
            <Textarea value={form.notions} onChange={(e) => setForm({ ...form, notions: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <Btn variant="ghost" onClick={() => setCreating(false)}>Annuler</Btn>
            <Btn onClick={save}>{editing ? "Enregistrer" : "Ajouter"}</Btn>
          </div>
        </div>
      </Modal>

      {ficheMod && <ModuleEditorModal mod={ficheMod} onClose={() => setFicheMod(null)} />}
      {previewMod && <ModuleDetailModal mod={previewMod} onClose={() => setPreviewMod(null)} />}
    </div>
  );
}

/* ================= EMPLOI DU TEMPS ================= */
export function SchedulePage() {
  const { db, user, getFormationId, update, log } = useStore();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<any>({ jour: "Lundi", heureDebut: "08:00", heureFin: "10:00", moduleId: "", teacherId: "", salle: "Salle 01", formation: "informatique" });

  const teacher = user?.role === "teacher" ? db.teachers.find((t) => t.userId === user.id) : null;
  const items = db.schedule.filter((s) => (teacher ? teacher!.modules.includes(s.moduleId) : true));

  const save = async () => {
    if (!form.moduleId || !form.teacherId) { toast.error("Sélectionnez un module et un enseignant."); return; }
    let id = uid("SCH");
    if (supabaseConfigured) {
      const formationId = getFormationId(form.formation);
      if (!formationId) { toast.error("Formation Supabase introuvable."); return; }
      try {
        const row = await createSchedule({ jour: form.jour, heure_debut: form.heureDebut, heure_fin: form.heureFin, module_id: form.moduleId, teacher_id: form.teacherId, salle: form.salle, formation_id: formationId });
        id = row.id;
      } catch (err) { toast.error(err instanceof Error ? err.message : "Impossible de créer le créneau."); return; }
    }
    update((d) => ({ ...d, schedule: [...d.schedule, { id, ...form }] }));
    log(`Créneau ajouté : ${form.jour} ${form.heureDebut}-${form.heureFin}`);
    toast.success("Créneau ajouté.");
    setCreating(false);
  };

  const modName = (id: string) => db.modules.find((m) => m.id === id)?.titre ?? "—";
  const tName = (id: string) => db.teachers.find((t) => t.id === id)?.prenom ?? "—";

  return (
    <div>
      <PageHead title="Emploi du temps" subtitle="Planning hebdomadaire des sessions"
        actions={user?.role !== "teacher" ? <Btn onClick={() => setCreating(true)}><PlusCircle size={16} /> Nouveau créneau</Btn> : undefined} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {DAYS.map((day) => {
          const dayItems = items.filter((i) => i.jour === day).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
          return (
            <Card key={day} className="p-4">
              <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
                <CalendarDays size={16} className="text-cyan-300" />
                <h4 className="font-display text-sm font-bold text-white">{day}</h4>
                <Badge color="gray">{dayItems.length} session(s)</Badge>
              </div>
              {dayItems.length === 0 ? (
                <p className="py-3 text-center text-xs text-slate-600">Aucune session</p>
              ) : (
                <div className="space-y-2">
                  {dayItems.map((i) => {
                    const isInfo = i.formation === "informatique";
                    return (
                      <div key={i.id} className={cn("rounded-xl border p-3", isInfo ? "border-red-500/20 bg-red-500/5" : "border-cyan-400/20 bg-cyan-400/5")}>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-white">{i.heureDebut} — {i.heureFin}</span>
                          {user?.role !== "teacher" && (
                            <button onClick={() => toast.warning("Supprimer ce créneau ?", { action: { label: "Supprimer", onClick: async () => { try { if (supabaseConfigured) await deleteSchedule(i.id); update((d) => ({ ...d, schedule: d.schedule.filter((x) => x.id !== i.id) })); toast.success("Créneau supprimé."); } catch (err) { toast.error(err instanceof Error ? err.message : "Suppression impossible."); } } }, cancel: { label: "Annuler", onClick: () => undefined } })} className="text-slate-500 hover:text-red-400"><Trash2 size={13} /></button>
                          )}
                        </div>
                        <p className="mt-1 text-sm font-bold text-slate-200">{modName(i.moduleId)}</p>
                        <p className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1"><GraduationCap size={11} /> {tName(i.teacherId)}</span>
                          <span className="flex items-center gap-1"><MapPin size={11} /> {i.salle}</span>
                          <span className={isInfo ? "text-red-400" : "text-cyan-300"}>{formationLabel(i.formation)}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {user?.role !== "teacher" && (
        <Modal open={creating} onClose={() => setCreating(false)} title="Nouveau créneau">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Jour">
                <Select value={form.jour} onChange={(e) => setForm({ ...form, jour: e.target.value })}>{DAYS.map((d) => <option key={d}>{d}</option>)}</Select>
              </Field>
              <Field label="Formation">
                <Select value={form.formation} onChange={(e) => setForm({ ...form, formation: e.target.value, moduleId: "" })}>
                  <option value="informatique">Génie Informatique</option><option value="industriel">Génie Industriel</option>
                </Select>
              </Field>
              <Field label="Heure début"><Input type="time" value={form.heureDebut} onChange={(e) => setForm({ ...form, heureDebut: e.target.value })} /></Field>
              <Field label="Heure fin"><Input type="time" value={form.heureFin} onChange={(e) => setForm({ ...form, heureFin: e.target.value })} /></Field>
            </div>
            <Field label="Module">
              <Select value={form.moduleId} onChange={(e) => setForm({ ...form, moduleId: e.target.value })}>
                <option value="">— Choisir —</option>
                {db.modules.filter((m) => m.formation === form.formation).map((m) => <option key={m.id} value={m.id}>{m.numero}. {m.titre}</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Enseignant">
                <Select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
                  <option value="">— Choisir —</option>
                  {db.teachers.map((t) => <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>)}
                </Select>
              </Field>
              <Field label="Salle"><Input value={form.salle} onChange={(e) => setForm({ ...form, salle: e.target.value })} /></Field>
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setCreating(false)}>Annuler</Btn>
              <Btn onClick={save}>Ajouter</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ================= PRÉSENCES ================= */
export function AttendancePage() {
  const { db, user, update, log } = useStore();
  const [date, setDate] = useState(today());
  const [moduleId, setModuleId] = useState("");
  const [scheduleId, setScheduleId] = useState("");
  const [salle, setSalle] = useState("Salle 01");
  const [status, setStatus] = useState<Record<string, AttendanceStatus>>({});

  const teacher = user?.role === "teacher" ? db.teachers.find((t) => t.userId === user.id) : null;
  const allowedModules = db.modules.filter((m) => (teacher ? teacher.modules.includes(m.id) : true));
  const mod = db.modules.find((m) => m.id === moduleId);
  const sessions = db.schedule.filter((item) => item.moduleId === moduleId);
  const students = db.students.filter((s) => (mod ? s.modules.includes(mod.id) : true) && s.statut === "actif");

  const existing = db.attendance.filter((a) => a.date === date && a.moduleId === moduleId);

  const saveAll = async () => {
    if (!moduleId) { toast.error("Sélectionnez un module."); return; }
    if (supabaseConfigured && !scheduleId) { toast.error("Sélectionnez une séance du planning."); return; }
    const recs = students.map((s) => ({
      id: uid("ATT"), studentId: s.id, date, moduleId, statut: status[s.id] ?? "present",
      heure: new Date().toTimeString().slice(0, 5), salle, teacherId: teacher?.id ?? user!.id,
    }));
    if (supabaseConfigured) {
      try {
        const persisted = await recordAttendance({ scheduleId, date, salle, records: recs.map((r) => ({ studentId: r.studentId, statut: r.statut, heure: r.heure })) });
        persisted.forEach((row: any, index: number) => { if (recs[index]) recs[index].id = row.id; });
      } catch (err) { toast.error(err instanceof Error ? err.message : "Enregistrement impossible."); return; }
    }
    update((d) => ({
      ...d,
      attendance: [...d.attendance.filter((a) => !(a.date === date && a.moduleId === moduleId)), ...recs],
    }));
    log(`Présences enregistrées : ${recs.filter((r) => r.statut === "present").length} présents sur ${recs.length}`);
    toast.success("Présences enregistrées.");
  };

  return (
    <div>
      <PageHead title="Gestion des présences" subtitle="QR Code ou validation manuelle par l'enseignant" />
      <Card className="mb-5 p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Module">
            <Select value={moduleId} onChange={(e) => { setModuleId(e.target.value); setScheduleId(""); }}>
              <option value="">Tous les modules</option>
              {allowedModules.map((m) => <option key={m.id} value={m.id}>{formationLabel(m.formation)} — {m.numero}. {m.titre}</option>)}
            </Select>
          </Field>
          <Field label="Séance">
            <Select value={scheduleId} onChange={(e) => setScheduleId(e.target.value)} disabled={!moduleId}>
              <option value="">— Choisir une séance —</option>
              {sessions.map((item) => <option key={item.id} value={item.id}>{item.jour} {item.heureDebut}-{item.heureFin} • {item.salle}</option>)}
            </Select>
          </Field>
          <Field label="Salle"><Input value={salle} onChange={(e) => setSalle(e.target.value)} /></Field>
          <div className="flex items-end"><Btn onClick={saveAll} className="w-full"><Save size={16} /> Enregistrer {existing.length ? `(${existing.length} déjà)` : ""}</Btn></div>
        </div>
      </Card>

      {students.length === 0 ? (
        <Empty icon={<ClipboardCheck size={40} />} title="Aucun apprenant pour cette sélection" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                <th className="px-4 py-3">Apprenant</th>
                <th className="px-4 py-3">Formation</th>
                <th className="px-4 py-3">Statut enregistré</th>
                <th className="px-4 py-3 text-right">Définir le statut</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const rec = existing.find((a) => a.studentId === s.id);
                const cur = status[s.id] ?? rec?.statut ?? "present";
                return (
                  <tr key={s.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-white">{s.prenom} {s.nom}</p>
                      <p className="font-mono text-[10px] text-slate-500">{s.id}</p>
                    </td>
                    <td className="px-4 py-3"><Badge color={s.formation === "informatique" ? "red" : "cyan"}>{formationLabel(s.formation)}</Badge></td>
                    <td className="px-4 py-3">
                      {rec ? (
                        <Badge color={rec.statut === "present" ? "green" : rec.statut === "retard" ? "gold" : "red"}>{rec.statut}</Badge>
                      ) : <span className="text-xs text-slate-600">Non enregistré</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {(["present", "retard", "absent"] as AttendanceStatus[]).map((st) => (
                          <button key={st} onClick={() => setStatus({ ...status, [s.id]: st })}
                            className={cn("rounded-lg border px-3 py-1.5 text-[11px] font-bold uppercase transition-all",
                              cur === st
                                ? st === "present" ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300"
                                : st === "retard" ? "border-amber-400/60 bg-amber-400/10 text-amber-300"
                                : "border-red-500/60 bg-red-500/10 text-red-400"
                                : "border-white/10 text-slate-500 hover:bg-white/5")}>
                            {st === "present" ? <CheckCircle2 size={13} className="inline" /> : st === "retard" ? <Timer size={13} className="inline" /> : <XCircle size={13} className="inline" />} {st}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ================= COURS ================= */
export function CoursesPage() {
  const { db, user, update, log } = useStore();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<any>({ titre: "", description: "", moduleId: "", type: "cours", content: "" });
  const [filter, setFilter] = useState("");

  const teacher = user?.role === "teacher" ? db.teachers.find((t) => t.userId === user.id) : null;
  const allowedModules = db.modules.filter((m) => (teacher ? teacher.modules.includes(m.id) : true));
  const courses = db.courses.filter((c) => (teacher ? allowedModules.some((m) => m.id === c.moduleId) : true)).filter((c) => !filter || c.moduleId === filter);

  const save = () => {
    if (!form.titre || !form.moduleId) return;
    const t = teacher ?? db.teachers[0];
    update((d) => ({ ...d, courses: [{ id: uid("CRS"), ...form, teacherId: t?.id ?? "", date: today() }, ...d.courses] }));
    notifyStudents(`Nouveau cours publié : ${form.titre}`);
    log(`Cours publié : ${form.titre}`);
    setCreating(false); setForm({ titre: "", description: "", moduleId: "", type: "cours", content: "" });
  };

  const notifyStudents = (title: string) => {
    update((d) => ({ ...d, notifications: [{ id: uid("NTF"), toId: "all", title, body: "Consultez l'espace Cours.", date: today(), lu: false, type: "info" }, ...d.notifications] }));
  };

  return (
    <div>
      <PageHead title="Cours & Supports" subtitle="Bibliothèque pédagogique du centre"
        actions={<Btn onClick={() => setCreating(true)}><PlusCircle size={16} /> Publier un cours</Btn>} />
      <div className="mb-5 flex flex-wrap gap-2">
        <button onClick={() => setFilter("")} className={cn("rounded-xl border px-4 py-2 text-xs font-bold", !filter ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300" : "border-white/10 text-slate-400")}>Tous</button>
        {allowedModules.map((m) => (
          <button key={m.id} onClick={() => setFilter(m.id)} className={cn("rounded-xl border px-4 py-2 text-xs font-bold", filter === m.id ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300" : "border-white/10 text-slate-400")}>
            {m.numero}. {m.titre}
          </button>
        ))}
      </div>

      {courses.length === 0 ? (
        <Empty icon={<FileText size={40} />} title="Aucun cours publié" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => {
            const mod = db.modules.find((m) => m.id === c.moduleId);
            return (
              <Card key={c.id} className="p-5" glow="cyan">
                <div className="mb-2 flex items-center justify-between">
                  <Badge color={c.type === "cours" ? "cyan" : c.type === "devoir" ? "gold" : "green"}>{c.type}</Badge>
                  <span className="text-[10px] text-slate-500">{c.date}</span>
                </div>
                <h4 className="font-display text-base font-bold text-white">{c.titre}</h4>
                <p className="mt-1 text-sm text-slate-400">{c.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <BookOpen size={13} className="text-cyan-300" />
                  <span className="text-xs font-semibold text-slate-300">{mod ? `${mod.numero}. ${mod.titre}` : "—"}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap rounded-lg border border-white/5 bg-black/30 p-3 font-mono text-[11px] text-slate-400">{c.content}</p>
                <div className="mt-3 flex justify-between">
                  <span className="text-[11px] text-slate-500">{db.teachers.find((t) => t.id === c.teacherId)?.prenom} {db.teachers.find((t) => t.id === c.teacherId)?.nom}</span>
                  <button onClick={() => update((d) => ({ ...d, courses: d.courses.filter((x) => x.id !== c.id) }))} className="text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Publier un cours / document" wide>
        <div className="space-y-4">
          <Field label="Titre"><Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Module">
              <Select value={form.moduleId} onChange={(e) => setForm({ ...form, moduleId: e.target.value })}>
                <option value="">— Choisir —</option>
                {allowedModules.map((m) => <option key={m.id} value={m.id}>{formationLabel(m.formation)} — {m.numero}. {m.titre}</option>)}
              </Select>
            </Field>
            <Field label="Type">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="cours">Cours</option><option value="document">Document</option><option value="devoir">Devoir</option>
              </Select>
            </Field>
          </div>
          <Field label="Description"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Contenu / Consignes"><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></Field>
          <div className="flex justify-end gap-2">
            <Btn variant="ghost" onClick={() => setCreating(false)}>Annuler</Btn>
            <Btn onClick={save}>Publier</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ================= TESTS ================= */
export function TestsPage() {
  const { db, user, update, log, notify } = useStore();
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const [resultsFor, setResultsFor] = useState<any>(null);
  const [form, setForm] = useState<any>({ titre: "", moduleId: "", chapitre: "", duree: 45, dateDebut: today(), dateFin: "", niveau: "moyen", tentativesMax: 1, corrections: "immediat", questions: [] });
  const [q, setQ] = useState<any>({ question: "", type: "qcm", options: ["", ""], bonneReponse: "", points: 4, explication: "" });

  const teacher = user?.role === "teacher" ? db.teachers.find((t) => t.userId === user.id) : null;
  const allowedModules = db.modules.filter((m) => (teacher ? teacher.modules.includes(m.id) : true));
  const tests = db.tests.filter((t) => (teacher ? allowedModules.some((m) => m.id === t.moduleId) : true));

  const modName = (id: string) => db.modules.find((m) => m.id === id)?.titre ?? "—";

  const addQuestion = () => {
    if (!q.question) return;
    setForm({ ...form, questions: [...form.questions, { id: uid("Q"), ...q, options: q.type === "qcm" ? q.options.filter(Boolean) : q.type === "vf" ? ["Vrai", "Faux"] : [] }] });
    setQ({ question: "", type: "qcm", options: ["", ""], bonneReponse: "", points: 4, explication: "" });
  };

  const saveTest = () => {
    if (!form.titre || !form.moduleId || form.questions.length === 0) return;
    const t = teacher ?? db.teachers[0];
    update((d) => ({ ...d, tests: [{ id: uid("TST"), ...form, tentativesMax: +form.tentativesMax || 1, teacherId: t?.id ?? "", date: today() }, ...d.tests] }));
    update((d) => ({ ...d, notifications: [{ id: uid("NTF"), toId: "all", title: `Test disponible : ${form.titre}`, body: "Un nouveau test d'évaluation est en ligne.", date: today(), lu: false, type: "test" }, ...d.notifications] }));
    log(`Test créé : ${form.titre} (${form.questions.length} questions)`);
    setCreating(false); setForm({ titre: "", moduleId: "", chapitre: "", duree: 45, dateDebut: today(), dateFin: "", niveau: "moyen", tentativesMax: 1, corrections: "immediat", questions: [] });
  };

  const totalPoints = (test: any) => test.questions.reduce((a: number, x: any) => a + (x.points || 0), 0);

  return (
    <div>
      <PageHead title="Tests & Évaluations" subtitle="QCM, vrai/faux et questions courtes"
        actions={<Btn onClick={() => setCreating(true)}><PlusCircle size={16} /> Créer un test</Btn>} />
      {tests.length === 0 ? (
        <Empty icon={<TestTube2 size={40} />} title="Aucun test créé" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tests.map((t) => (
            <Card key={t.id} className="p-5" glow="red">
              <div className="flex items-center justify-between">
                <Badge color="red">Test</Badge>
                <span className="text-[10px] text-slate-500">{t.date}</span>
              </div>
              <h4 className="font-display mt-2 text-base font-bold text-white">{t.titre}</h4>
              <p className="mt-1 text-xs text-slate-400">{modName(t.moduleId)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                <span className="flex items-center gap-1"><FileText size={12} /> {t.questions.length} questions</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {t.duree} min</span>
                <span className="flex items-center gap-1"><PenLine size={12} /> /{totalPoints(t)} pts</span>
                <Badge color="gray">{t.niveau ?? "moyen"}</Badge>
                <Badge color={t.corrections === "immediat" ? "cyan" : "gold"}>{t.corrections === "immediat" ? "Correction immédiate" : "Après validation"}</Badge>
              </div>
              <div className="mt-4 flex gap-2">
                <Btn variant="outline" className="flex-1" onClick={() => setViewing(t)}><Eye size={14} /> Voir</Btn>
                <Btn variant="green" className="flex-1" onClick={() => setResultsFor(t)}><ClipboardCheck size={14} /> Résultats</Btn>
                <Btn variant="ghost" onClick={() => update((d) => ({ ...d, tests: d.tests.filter((x) => x.id !== t.id) }))}><Trash2 size={14} /></Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Créer une évaluation" wide>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Nom du test" ><Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} /></Field>
            <Field label="Module">
              <Select value={form.moduleId} onChange={(e) => setForm({ ...form, moduleId: e.target.value, chapitre: "" })}>
                <option value="">— Choisir —</option>
                {allowedModules.map((m) => <option key={m.id} value={m.id}>{m.numero}. {m.titre}</option>)}
              </Select>
            </Field>
            <Field label="Chapitre concerné">
              <Select value={form.chapitre} onChange={(e) => setForm({ ...form, chapitre: e.target.value })}>
                <option value="">Tout le module</option>
                {(db.modules.find((m) => m.id === form.moduleId)?.chapitres ?? []).map((c) => <option key={c.id} value={c.titre}>{c.titre}</option>)}
              </Select>
            </Field>
            <Field label="Durée (minutes)"><Input type="number" value={form.duree} onChange={(e) => setForm({ ...form, duree: +e.target.value })} /></Field>
            <Field label="Date de début"><Input type="date" value={form.dateDebut} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} /></Field>
            <Field label="Date de fin"><Input type="date" value={form.dateFin} onChange={(e) => setForm({ ...form, dateFin: e.target.value })} /></Field>
            <Field label="Niveau de difficulté">
              <Select value={form.niveau} onChange={(e) => setForm({ ...form, niveau: e.target.value })}>
                <option value="facile">Facile</option><option value="moyen">Moyen</option><option value="difficile">Difficile</option>
              </Select>
            </Field>
            <Field label="Tentatives autorisées"><Input type="number" min={1} max={5} value={form.tentativesMax} onChange={(e) => setForm({ ...form, tentativesMax: +e.target.value })} /></Field>
            <Field label="Correction des copies">
              <Select value={form.corrections} onChange={(e) => setForm({ ...form, corrections: e.target.value })}>
                <option value="immediat">Immédiate (l'apprenant voit la correction)</option>
                <option value="apres_validation">Après validation du formateur</option>
              </Select>
            </Field>
          </div>
          <p className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-slate-500">
            Barème : la note finale est ramenée sur 20 à partir du total des points des questions. {form.questions.length > 0 && <b className="text-cyan-300"> Actuellement {form.questions.reduce((a: number, x: any) => a + (+x.points || 0), 0)} points — {form.questions.length} question(s).</b>}
          </p>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-cyan-300">Ajouter une question</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Question"><Input value={q.question} onChange={(e) => setQ({ ...q, question: e.target.value })} /></Field>
              <Field label="Type">
                <Select value={q.type} onChange={(e) => setQ({ ...q, type: e.target.value, options: e.target.value === "qcm" ? ["", ""] : e.target.value === "vf" ? ["Vrai", "Faux"] : [] })}>
                  <option value="qcm">QCM</option><option value="vf">Vrai / Faux</option><option value="courte">Réponse courte</option>
                </Select>
              </Field>
              {q.type === "qcm" && (
                <div className="sm:col-span-2 grid gap-2 sm:grid-cols-2">
                  {[0, 1, 2, 3].map((i) => (
                    <Input key={i} placeholder={`Option ${i + 1}`} value={q.options[i] ?? ""}
                      onChange={(e) => setQ({ ...q, options: q.options.map((o: string, j: number) => (j === i ? e.target.value : o)) })} />
                  ))}
                </div>
              )}
              <Field label="Bonne réponse">
                {q.type === "qcm" || q.type === "vf" ? (
                  <Select value={q.bonneReponse} onChange={(e) => setQ({ ...q, bonneReponse: e.target.value })}>
                    <option value="">— Choisir —</option>
                    {(q.type === "vf" ? ["Vrai", "Faux"] : q.options.filter(Boolean)).map((o: string) => <option key={o}>{o}</option>)}
                  </Select>
                ) : (
                  <Input value={q.bonneReponse} onChange={(e) => setQ({ ...q, bonneReponse: e.target.value })} placeholder="Réponse attendue" />
                )}
              </Field>
              <Field label="Points (barème)"><Input type="number" value={q.points} onChange={(e) => setQ({ ...q, points: +e.target.value })} /></Field>
              <div className="sm:col-span-2">
                <Field label="Explication de la correction (affichée à l'apprenant)">
                  <Input value={q.explication} onChange={(e) => setQ({ ...q, explication: e.target.value })} placeholder="Expliquez pourquoi c'est la bonne réponse..." />
                </Field>
              </div>
            </div>
            <Btn variant="outline" className="mt-3" onClick={addQuestion}><PlusCircle size={14} /> Ajouter la question</Btn>
          </div>

          {form.questions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-300">{form.questions.length} question(s) ajoutée(s)</p>
              <div className="space-y-1.5">
                {form.questions.map((x: any, i: number) => (
                  <div key={x.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm">
                    <span className="text-slate-300">{i + 1}. {x.question}</span>
                    <div className="flex items-center gap-2">
                      <Badge color="gray">{x.type}</Badge>
                      <span className="text-xs text-slate-500">{x.points} pts</span>
                      <button onClick={() => setForm({ ...form, questions: form.questions.filter((y: any) => y.id !== x.id) })} className="text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Btn variant="ghost" onClick={() => setCreating(false)}>Annuler</Btn>
            <Btn onClick={saveTest} disabled={form.questions.length === 0}><Save size={15} /> Enregistrer le test</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.titre} wide>
        {viewing && (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">{modName(viewing.moduleId)} • {viewing.questions.length} questions • {viewing.duree} min</p>
            {viewing.questions.map((x: any, i: number) => (
              <div key={x.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-sm font-bold text-white">{i + 1}. {x.question} <span className="ml-1 text-xs font-normal text-slate-500">({x.points} pts)</span></p>
                {x.options && x.options.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {x.options.map((o: string) => (
                      <span key={o} className={cn("rounded-lg border px-2.5 py-1 text-xs", o === x.bonneReponse ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300" : "border-white/10 text-slate-400")}>{o}</span>
                    ))}
                  </div>
                )}
                {x.type === "courte" && <p className="mt-2 text-xs text-slate-500">Réponse attendue : <span className="font-mono text-emerald-300">{x.bonneReponse}</span></p>}
                {x.explication && <p className="mt-2 text-[11px] italic text-slate-500">💡 {x.explication}</p>}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ============ RÉSULTATS + VALIDATION FORMATEUR ============ */}
      <Modal open={!!resultsFor} onClose={() => setResultsFor(null)} title={`Résultats — ${resultsFor?.titre}`} wide>
        {resultsFor && (
          <div>
            {(() => {
              const subs = db.results.filter((r) => r.testId === resultsFor.id).sort((a, b) => b.date.localeCompare(a.date));
              if (subs.length === 0)
                return <p className="py-8 text-center text-sm text-slate-500">Aucune copie soumise pour le moment.</p>;
              const sName = (id: string) => {
                const s = db.students.find((x) => x.id === id);
                return s ? `${s.prenom} ${s.nom}` : id;
              };
              return (
                <div className="space-y-2.5">
                  {subs.map((r) => (
                    <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div>
                        <p className="text-sm font-bold text-white">{sName(r.studentId)}</p>
                        <p className="font-mono text-[10px] text-slate-500">{r.studentId} • {r.date}</p>
                        <div className="mt-1.5 flex gap-2">
                          <Badge color={r.note >= 10 ? "green" : "red"}>Score : {r.note}/20</Badge>
                          <Badge color="blue">{r.pourcentage}%</Badge>
                          <Badge color={r.reussi ? "green" : "red"}>{r.reussi ? "Réussi" : "Échoué"}</Badge>
                          {r.valide ? <Badge color="gold">Validé</Badge> : <Badge color="gray">En attente de validation</Badge>}
                        </div>
                      </div>
                      {!r.valide ? (
                        <Btn variant="green" onClick={() => {
                          update((d) => ({ ...d, results: d.results.map((x) => (x.id === r.id ? { ...x, valide: true } : x)) }));
                          const s = db.students.find((x) => x.id === r.studentId);
                          if (s?.userId) notify(s.userId, "Résultat validé", `Ton résultat au test "${resultsFor.titre}" a été validé par le formateur : ${r.note}/20 (${r.pourcentage}%).`, "test");
                          log(`Résultat validé : ${sName(r.studentId)} — ${r.note}/20`);
                        }}>
                          <CheckCircle2 size={15} /> Valider le résultat
                        </Btn>
                      ) : (
                        <Btn variant="ghost" onClick={() => update((d) => ({ ...d, results: d.results.map((x) => (x.id === r.id ? { ...x, valide: false } : x)) }))}>
                          Annuler la validation
                        </Btn>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ================= NOTES ================= */
export function GradesPage() {
  const { db, user, update, log } = useStore();
  const [moduleId, setModuleId] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [appr, setAppr] = useState<Record<string, string>>({});

  const teacher = user?.role === "teacher" ? db.teachers.find((t) => t.userId === user.id) : null;
  const allowedModules = db.modules.filter((m) => (teacher ? teacher.modules.includes(m.id) : true));
  const mod = db.modules.find((m) => m.id === moduleId);
  const students = db.students.filter((s) => (mod ? s.modules.includes(mod.id) : true));
  const existing = db.grades.filter((g) => g.moduleId === moduleId);

  const save = () => {
    const recs = students
      .filter((s) => notes[s.id] !== undefined && notes[s.id] !== "")
      .map((s) => ({ id: uid("GRD"), studentId: s.id, moduleId, note: Math.min(20, Math.max(0, +notes[s.id])), appreciation: appr[s.id] || "—", date: today() }));
    update((d) => ({ ...d, grades: [...d.grades.filter((g) => !(g.moduleId === moduleId && recs.some((r) => r.studentId === g.studentId))), ...recs] }));
    log(`Notes enregistrées pour ${recs.length} apprenant(s)`);
  };

  return (
    <div>
      <PageHead title="Saisie des notes" subtitle="Notation sur 20 par module"
        actions={<Btn onClick={save}><Save size={16} /> Enregistrer les notes</Btn>} />
      <div className="mb-5 max-w-md">
        <Field label="Module">
          <Select value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
            <option value="">— Choisir un module —</option>
            {allowedModules.map((m) => <option key={m.id} value={m.id}>{formationLabel(m.formation)} — {m.numero}. {m.titre}</option>)}
          </Select>
        </Field>
      </div>

      {!moduleId ? (
        <Empty icon={<PenLine size={40} />} title="Sélectionnez un module" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                <th className="px-4 py-3">Apprenant</th><th className="px-4 py-3">Note actuelle</th><th className="px-4 py-3">Note /20</th><th className="px-4 py-3">Appréciation</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const g = existing.find((x) => x.studentId === s.id);
                return (
                  <tr key={s.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-white">{s.prenom} {s.nom}</p>
                      <p className="font-mono text-[10px] text-slate-500">{s.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      {g ? <Badge color={g.note >= 10 ? "green" : "red"}>{g.note}/20</Badge> : <span className="text-xs text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Input type="number" min={0} max={20} step={0.5} className="w-24" placeholder={g ? String(g.note) : "—"}
                        value={notes[s.id] ?? ""} onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })} />
                    </td>
                    <td className="px-4 py-3">
                      <Input className="w-40" placeholder={g?.appreciation || "Appréciation"} value={appr[s.id] ?? ""} onChange={(e) => setAppr({ ...appr, [s.id]: e.target.value })} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ================= PAIEMENTS ================= */
export function PaymentsPage() {
  const { db, update, log } = useStore();
  const [studentId, setStudentId] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<any>({ type: "formation", libelle: "", montant: 0, mode: "Espèces", statut: "paye", reste: 0 });

  const student = db.students.find((s) => s.id === studentId);
  const pays = db.payments.filter((p) => p.studentId === studentId);

  const save = () => {
    if (!studentId || !form.montant) return;
    const reste = Math.max(0, form.reste || 0);
    update((d) => ({ ...d, payments: [{ id: uid("PAY"), studentId, ...form, date: today() }, ...d.payments] }));
    update((d) => ({
      ...d,
      students: d.students.map((s) => (s.id === studentId ? { ...s, statutPaiement: reste === 0 && form.statut === "paye" ? "paye" : form.statut === "partiel" ? "partiel" : s.statutPaiement } : s)),
    }));
    log(`Paiement enregistré : ${student?.prenom} ${student?.nom} — ${money(form.montant)}`);
    setCreating(false);
  };

  const receipt = (p: any) => {
    printHTML(`Reçu ${p.id}`, `
      <div class="receipt">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><h1 class="accent">SENTINELLES NUMÉRIQUES</h1><p>Centre de Formation — Génie Info & Industriel</p></div>
          <div style="text-align:right"><p class="label">Reçu N°</p><p class="font-mono">${p.id}</p></div>
        </div>
        <hr style="border-color:#1d2b45;margin:16px 0">
        <div class="grid">
          <div><p class="label">Apprenant</p><p style="font-weight:700">${student?.prenom} ${student?.nom} (${studentId})</p></div>
          <div><p class="label">Date</p><p>${p.date}</p></div>
          <div><p class="label">Libellé</p><p>${p.libelle}</p></div>
          <div><p class="label">Mode de paiement</p><p>${p.mode}</p></div>
        </div>
        <div class="row" style="margin-top:16px"><span>Montant</span><span class="gold" style="font-size:20px;font-weight:800">${money(p.montant)}</span></div>
        <div class="row"><span>Statut</span><span class="green" style="font-weight:700">${p.statut.toUpperCase()}</span></div>
        <p style="margin-top:24px;text-align:center" class="label">Merci de votre confiance — SENTINELLES NUMÉRIQUES • ENIA 2.0</p>
      </div>`);
  };

  return (
    <div>
      <PageHead title="Gestion des paiements" subtitle="Inscription, formation, reçus et suivi financier"
        actions={<Btn onClick={() => setCreating(true)} disabled={!studentId}><PlusCircle size={16} /> Enregistrer un paiement</Btn>} />
      <Card className="mb-5 p-5">
        <Field label="Apprenant">
          <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">— Sélectionner un apprenant —</option>
            {db.students.map((s) => <option key={s.id} value={s.id}>{s.id} — {s.prenom} {s.nom}</option>)}
          </Select>
        </Field>
      </Card>

      {student && (
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Total payé</p>
            <p className="font-display text-xl font-black text-emerald-300">{money(pays.reduce((a, p) => a + p.montant, 0))}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Statut</p>
            <p className="mt-1">
              {student.statutPaiement === "paye" ? <Badge color="green">Payé</Badge> : student.statutPaiement === "partiel" ? <Badge color="gold">Partiel</Badge> : <Badge color="red">Impayé</Badge>}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Dernier paiement</p>
            <p className="text-sm font-bold text-slate-200">{pays[0] ? `${pays[0].libelle} — ${money(pays[0].montant)}` : "—"}</p>
          </div>
        </div>
      )}

      {pays.length === 0 ? (
        <Empty icon={<Wallet size={40} />} title="Aucun paiement pour cet apprenant" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                <th className="px-4 py-3">Libellé</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Montant</th><th className="px-4 py-3">Reste</th><th className="px-4 py-3">Mode</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3 text-right">Reçu</th>
              </tr>
            </thead>
            <tbody>
              {pays.map((p) => (
                <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-sm font-bold text-slate-200">{p.libelle}</td>
                  <td className="px-4 py-3"><Badge color={p.type === "inscription" ? "cyan" : "blue"}>{p.type}</Badge></td>
                  <td className="px-4 py-3 font-mono text-sm text-white">{money(p.montant)}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{p.reste ? money(p.reste) : "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{p.mode}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{p.date}</td>
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

      <Modal open={creating} onClose={() => setCreating(false)} title={`Paiement — ${student?.prenom} ${student?.nom}`}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, libelle: e.target.value === "inscription" ? "Frais d'inscription" : form.libelle })}>
                <option value="inscription">Inscription</option><option value="formation">Formation</option>
              </Select>
            </Field>
            <Field label="Mode">
              <Select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                <option>Espèces</option><option>Mobile Money</option><option>Virement</option><option>Autre</option>
              </Select>
            </Field>
          </div>
          <Field label="Libellé"><Input value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Montant (FCFA)"><Input type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: +e.target.value })} /></Field>
            <Field label="Reste à payer"><Input type="number" value={form.reste} onChange={(e) => setForm({ ...form, reste: +e.target.value })} /></Field>
          </div>
          <Field label="Statut">
            <Select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
              <option value="paye">Payé</option><option value="partiel">Partiel</option><option value="impaye">Impayé</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Btn variant="ghost" onClick={() => setCreating(false)}>Annuler</Btn>
            <Btn onClick={save}><Wallet size={15} /> Enregistrer</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ================= CERTIFICATS ================= */
export function CertificatesPage() {
  const { db, update, log, nextCertNumber } = useStore();
  const [studentId, setStudentId] = useState("");
  const [period, setPeriod] = useState("Août — Octobre 2026");
  const [resultat, setResultat] = useState("Admis");
  const [note, setNote] = useState(14);
  const [viewing, setViewing] = useState<any>(null);

  const sName = (id: string) => {
    const s = db.students.find((x) => x.id === id);
    return s ? `${s.prenom} ${s.nom}` : "—";
  };

  const generate = () => {
    if (!studentId) return;
    const s = db.students.find((x) => x.id === studentId)!;
    const numero = nextCertNumber();
    const cert = { id: uid("CERT"), studentId, numero, formation: s.formation, modules: s.modules, periode: period, resultat, note, date: today() };
    update((d) => ({ ...d, certificates: [cert, ...d.certificates] }));
    if (s.userId) update((d) => ({ ...d, notifications: [{ id: uid("NTF"), toId: s.userId!, title: "Certificat disponible", body: `Votre certificat ${numero} a été émis.`, date: today(), lu: false, type: "certif" }, ...d.notifications] }));
    log(`Certificat généré : ${numero} pour ${sName(studentId)}`);
    setViewing(cert);
  };

  const printCert = async (c: any) => {
    const uuid = typeof c.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(c.id);
    if (supabaseConfigured && uuid) {
      try {
        const generated = await generateCertificatePdf(c.id);
        const signedUrl = safeExternalUrl(generated.signedUrl);
        if (signedUrl) window.open(signedUrl, "_blank", "noopener,noreferrer");
        return;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "La génération officielle a échoué.");
        return;
      }
    }
    const s = db.students.find((x) => x.id === c.studentId)!;
    const mods = db.modules.filter((m) => c.modules.includes(m.id)).map((m) => m.titre).join(" • ");
    printHTML(`Certificat ${c.numero}`, `
      <div class="receipt" style="text-align:center">
        <p class="accent" style="letter-spacing:4px;font-size:12px">SENTINELLES NUMÉRIQUES</p>
        <p class="label">Centre de Formation en Génie Informatique & Génie Industriel</p>
        <div style="margin:24px 0"><h1 style="font-size:40px;letter-spacing:6px">CERTIFICAT</h1><p class="label">de formation professionnelle</p></div>
        <p class="label">Décerné à</p>
        <h2 style="font-size:28px;color:#FFB300;margin:8px 0">${s.prenom} ${s.nom}</h2>
        <p class="label">N° ${s.id} • ${formationLabel(c.formation)}</p>
        <p style="margin:20px auto;max-width:520px">pour avoir suivi avec succès la formation de <b>${formationLabel(c.formation)}</b> du ${c.periode}.</p>
        <div class="row" style="max-width:420px;margin:0 auto"><span>Modules couverts</span><span style="text-align:right;max-width:220px">${mods}</span></div>
        <div class="row" style="max-width:420px;margin:0 auto"><span>Résultat</span><span class="green">${c.resultat} — ${c.note}/20</span></div>
        <div style="margin-top:32px;display:flex;justify-content:space-between;align-items:end">
          <div style="text-align:center"><p style="border-top:1px solid #00E5FF;padding-top:6px;font-size:11px">Coach Fredich FOUNDOU<br>Responsable du Centre</p></div>
          <div style="text-align:center"><p class="font-mono" style="font-size:12px">${c.numero}</p><p class="label">Certificat vérifiable</p></div>
        </div>
      </div>`);
  };

  return (
    <div>
      <PageHead title="Certificats" subtitle="Certification des délibérés par ENIA 2.0" />
      <Card className="mb-6 p-5">
        <div className="grid gap-4 md:grid-cols-5">
          <Field label="Apprenant">
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">— Choisir —</option>
              {db.students.map((s) => <option key={s.id} value={s.id}>{s.id} — {s.prenom} {s.nom}</option>)}
            </Select>
          </Field>
          <Field label="Période"><Input value={period} onChange={(e) => setPeriod(e.target.value)} /></Field>
          <Field label="Résultat">
            <Select value={resultat} onChange={(e) => setResultat(e.target.value)}>
              <option>Admis</option><option>Admis avec mention</option><option>Non admis</option>
            </Select>
          </Field>
          <Field label="Note /20"><Input type="number" value={note} onChange={(e) => setNote(+e.target.value)} /></Field>
          <div className="flex items-end"><Btn onClick={generate} className="w-full"><Award size={16} /> Générer</Btn></div>
        </div>
      </Card>

      {db.certificates.length === 0 ? (
        <Empty icon={<Award size={40} />} title="Aucun certificat émis" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {db.certificates.map((c) => (
            <Card key={c.id} className="p-5" glow="gold">
              <div className="flex items-center justify-between">
                <Award size={22} className="text-amber-300" />
                <Badge color="gold">{c.resultat}</Badge>
              </div>
              <h4 className="font-display mt-2 text-lg font-black text-white">{sName(c.studentId)}</h4>
              <p className="font-mono text-[11px] text-amber-300/80">{c.numero}</p>
              <p className="mt-1 text-xs text-slate-400">{formationLabel(c.formation)} • {c.periode}</p>
              <div className="mt-4 flex gap-2">
                <Btn variant="outline" className="flex-1" onClick={() => setViewing(c)}><Eye size={14} /> Aperçu</Btn>
                <Btn variant="ghost" onClick={() => printCert(c)}><Printer size={14} /></Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Aperçu du certificat" wide>
        {viewing && <CertificatePreview cert={viewing} onPrint={() => printCert(viewing)} />}
      </Modal>
    </div>
  );
}

function CertificatePreview({ cert, onPrint }: { cert: any; onPrint: () => void }) {
  const { db } = useStore();
  const s = db.students.find((x) => x.id === cert.studentId)!;
  const mods = db.modules.filter((m) => cert.modules.includes(m.id));
  return (
    <div>
      <div id="print-area" className="relative overflow-hidden rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-[#0A1224] to-[#120d1f] p-8 text-center">
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
          <p className="font-display mt-1 text-3xl font-black text-amber-300 drop-shadow-[0_0_16px_rgba(255,179,0,0.4)]">{s.prenom} {s.nom}</p>
          <p className="mt-1 font-mono text-xs text-cyan-300/70">N° {s.id} • {formationLabel(cert.formation)}</p>
          <p className="mx-auto mt-4 max-w-md text-sm text-slate-300">
            pour avoir suivi avec succès la formation de <b className="text-white">{formationLabel(cert.formation)}</b> du {cert.periode}.
          </p>
          <div className="mx-auto mt-4 flex max-w-md flex-wrap justify-center gap-1.5">
            {mods.map((m) => <span key={m.id} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-slate-300">{m.numero}. {m.titre}</span>)}
          </div>
          <div className="mx-auto mt-5 flex max-w-md items-center justify-between border-t border-amber-400/20 pt-4">
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Résultat</p>
              <p className="font-bold text-emerald-300">{cert.resultat} — {cert.note}/20</p>
            </div>
            <div className="rounded-lg bg-white p-1">
              <QRCodeSVG value={`${window.location.origin}/#/certificat/${encodeURIComponent(cert.numero)}`} size={64} />
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">N° certificat</p>
              <p className="font-mono text-[11px] text-cyan-300">{cert.numero}</p>
            </div>
          </div>
          <p className="mt-5 text-[11px] text-slate-500">Signature : Coach Fredich FOUNDOU — Responsable du Centre</p>
        </div>
      </div>
      <div className="no-print mt-4 flex justify-end gap-2">
        <Btn onClick={onPrint}><Printer size={15} /> Imprimer</Btn>
      </div>
    </div>
  );
}

/* ================= BOURSES ================= */
const BOURSE_STATUS: { k: any; l: string; c: "gray" | "gold" | "cyan" | "green" | "red" }[] = [
  { k: "en_attente", l: "En attente", c: "gray" },
  { k: "test_programme", l: "Test programmé", c: "gold" },
  { k: "test_effectue", l: "Test effectué", c: "cyan" },
  { k: "admis", l: "Admis", c: "green" },
  { k: "non_admis", l: "Non admis", c: "red" },
  { k: "bourse_attribuee", l: "Bourse attribuée", c: "green" },
];

export function ScholarshipsPage() {
  const { db, update, log } = useStore();
  const eligible = db.students.filter((s) => s.statut === "actif");
  const get = (id: string) => db.scholarships.find((x) => x.studentId === id);

  const setStatus = (id: string, statut: any) => {
    const existing = get(id);
    update((d) => ({
      ...d,
      scholarships: existing
        ? d.scholarships.map((x) => (x.studentId === id ? { ...x, statut } : x))
        : [...d.scholarships, { id: uid("SCHL"), studentId: id, statut, date: today() }],
    }));
    const s = db.students.find((x) => x.id === id);
    if (s?.userId) update((d) => ({ ...d, notifications: [{ id: uid("NTF"), toId: s.userId!, title: "Mise à jour bourse", body: `Votre statut bourse est désormais : ${statut.replace("_", " ")}`, date: today(), lu: false, type: "bourse" }, ...d.notifications] }));
    log(`Bourse mise à jour : ${s?.prenom} ${s?.nom} → ${statut}`);
  };

  return (
    <div>
      <PageHead title="BOURSE MON AVENIR" subtitle="3 ans d'études 100% gratuites à ENIA 2.0 pour les lauréats du test final" />
      <Card className="mb-6 flex items-center gap-4 border-amber-400/30 bg-gradient-to-r from-amber-400/10 via-transparent to-transparent p-5">
        <BadgeDollarSign size={28} className="shrink-0 text-amber-300" />
        <p className="text-sm text-slate-300">
          Les apprenants qui réussissent le test final de fin de formation bénéficient d'une <b className="text-amber-300">bourse d'études de 3 ans à ENIA 2.0</b>.
        </p>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left">
          <thead>
            <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <th className="px-4 py-3">Apprenant</th><th className="px-4 py-3">Formation</th><th className="px-4 py-3">Moyenne</th><th className="px-4 py-3">Statut actuel</th><th className="px-4 py-3 text-right">Mettre à jour</th>
            </tr>
          </thead>
          <tbody>
            {eligible.map((s) => {
              const grades = db.grades.filter((g) => g.studentId === s.id);
              const avg = grades.length ? (grades.reduce((a, g) => a + g.note, 0) / grades.length).toFixed(1) : "—";
              const b = get(s.id);
              return (
                <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-white">{s.prenom} {s.nom}</p>
                    <p className="font-mono text-[10px] text-slate-500">{s.id}</p>
                  </td>
                  <td className="px-4 py-3"><Badge color={s.formation === "informatique" ? "red" : "cyan"}>{formationLabel(s.formation)}</Badge></td>
                  <td className="px-4 py-3 font-display text-sm font-bold text-white">{avg}</td>
                  <td className="px-4 py-3">
                    {b ? <Badge color={BOURSE_STATUS.find((x) => x.k === b.statut)?.c ?? "gray"}>{BOURSE_STATUS.find((x) => x.k === b.statut)?.l}</Badge> : <Badge color="gray">Non suivi</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <Select value={b?.statut ?? "en_attente"} onChange={(e) => setStatus(s.id, e.target.value)} className="w-44 text-xs">
                      {BOURSE_STATUS.map((x) => <option key={x.k} value={x.k}>{x.l}</option>)}
                    </Select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
