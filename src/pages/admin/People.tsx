import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Users, Search, PlusCircle, Eye, Pencil, UserCircle2, Phone, Mail, MapPin, CalendarDays,
  GraduationCap, ShieldCheck, Trash2, CheckCircle2, XCircle, KeyRound, Wallet,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/utils/cn";
import { toast } from "sonner";
import {
  Btn, Badge, Card, Empty, Field, Input, Modal, PageHead, Select, Textarea, uid, today,
  formationLabel, money, moduleIcon, readImage, totalDue,
} from "@/lib/ui";
import { Student, Formation, User, DB } from "@/lib/types";
import type { AppRole, PartnerScope } from "@/types/rbac";
import { supabaseConfigured } from "@/lib/supabase/client";
import { createManagedUser, deleteManagedUser, resetManagedPassword, setAccountActive } from "@/lib/supabase/users";
import { createPartnerOrganization, listPartnerOrganizations, setOrganizationFormations, type PartnerOrganizationRow } from "@/lib/supabase/partners";

/* ---------- helpers ---------- */
function slugify(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

export function genPassword() {
  // Mot de passe fort généré automatiquement (16+ caractères)
  const upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*-_=+?";
  const pool = [upper, lower, digits, special];
  const randomIndex = (max: number) => {
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    return value[0] % max;
  };
  const pick = (s: string) => s[randomIndex(s.length)];
  let pwd = pool.map(pick).join("");
  while (pwd.length < 16) pwd += pick(upper + lower + digits + special);
  const chars = pwd.split("");
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export function makeAccount(db: DB, student: Student, role: "student" | "teacher" = "student", customPassword?: string): { users: User[]; student: Student; password: string } {
  const base = `${student.prenom}.${student.nom}`.toLowerCase();
  let username = slugify(base);
  let i = 1;
  const taken = new Set(db.users.map((u: User) => u.username));
  while (taken.has(username)) username = `${slugify(base)}${i++}`;
  const userId = `u-${username}`;
  const raw = customPassword ?? genPassword();
  const user: User = {
    id: userId, username, password: "", role,
    name: `${student.prenom} ${student.nom}`, email: student.email, phone: student.telephone,
    linkedId: student.id, createdAt: today(), actif: true,
  };
  return { users: [...db.users, user], student: { ...student, userId }, password: raw };
}

/* ================= STUDENTS ================= */
const emptyStudent = (): Omit<Student, "id"> => ({
  nom: "", prenom: "", dateNaissance: "", sexe: "M", telephone: "", whatsapp: "", email: "",
  adresse: "", niveau: "", formation: "informatique", modules: [], dateInscription: today(),
  statutPaiement: "impaye", statut: "actif",
});

export function StudentsPage() {
  const { db, update, nextStudentId, notify, log } = useStore();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"tous" | Formation>("tous");
  const [editing, setEditing] = useState<Student | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<Student | null>(null);
  const [form, setForm] = useState<any>(emptyStudent());
  const [creds, setCreds] = useState<{ nom: string; username: string; password: string; id: string } | null>(null);

  const filtered = db.students.filter((s) => {
    const matchQ = `${s.nom} ${s.prenom} ${s.id}`.toLowerCase().includes(q.toLowerCase());
    const matchT = tab === "tous" || s.formation === tab;
    return matchQ && matchT;
  });

  const save = async () => {
    if (!form.nom || !form.prenom) return;
    if (editing) {
      update((d) => ({ ...d, students: d.students.map((s) => (s.id === editing.id ? { ...s, ...form } : s)) }));
      log(`Apprenant modifié : ${form.nom} ${form.prenom}`);
    } else {
      if (!supabaseConfigured) { toast.error("Supabase doit être configuré pour créer un compte apprenant sécurisé."); return; }
      const id = nextStudentId();
      const local = makeAccount(db, { ...form, id } as Student);
      let users = local.users;
      let student = local.student;
      if (supabaseConfigured) {
        try {
          const remote = await createManagedUser({
            role: "student",
            name: `${form.prenom} ${form.nom}`.trim(),
            username: users[users.length - 1].username,
            email: form.email,
            password: local.password,
            phone: form.telephone,
            nom: form.nom,
            prenom: form.prenom,
            whatsapp: form.whatsapp,
            adresse: form.adresse,
            niveau: form.niveau,
            formationCode: form.formation,
            moduleIds: form.modules,
          });
          student = { ...student, id: remote.entityId ?? id, userId: remote.userId };
          users = users.map((item) => item.username === users[users.length - 1].username ? { ...item, id: remote.userId, linkedId: student.id, password: "" } : item);
          if (remote.warnings?.length) toast.warning(remote.warnings.join("\n"));
          toast.success("Apprenant créé avec succès.");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "La création Supabase a échoué.");
          return;
        }
      }
      update((d) => ({
        ...d, users,
        students: [student, ...d.students],
        notifications: [{ id: uid("NTF"), toId: student.userId!, title: "Bienvenue !", body: `Votre compte a été créé. Identifiant : ${student.id}`, date: today(), lu: false, type: "inscription" }, ...d.notifications],
      }));
      notify("all", "Nouvel apprenant inscrit", `${form.nom} ${form.prenom} — ${formationLabel(form.formation)}`, "inscription");
      log(`Apprenant inscrit : ${form.nom} ${form.prenom} (${id})`);
    }
    setCreating(false); setEditing(null);
  };

  const confirmRegistration = async (regId: string) => {
    if (!supabaseConfigured) { toast.error("Supabase doit être configuré pour confirmer une inscription et créer le compte."); return; }
    const reg = db.registrations.find((r) => r.id === regId);
    if (!reg) return;
    const id = nextStudentId();
    const student: Student = { ...emptyStudent(), id, nom: reg.nom, prenom: reg.prenom, telephone: reg.telephone, whatsapp: reg.whatsapp, email: reg.email, niveau: reg.niveau, formation: reg.formation, modules: reg.modules, dateInscription: today() };
    const res = makeAccount(db, student);
    if (supabaseConfigured) {
      try {
        const username = res.users[res.users.length - 1].username;
        const remote = await createManagedUser({ role: "student", name: `${student.prenom} ${student.nom}`.trim(), username, email: student.email, password: res.password, phone: student.telephone, nom: student.nom, prenom: student.prenom, whatsapp: student.whatsapp, adresse: student.adresse, niveau: student.niveau, formationCode: student.formation, moduleIds: student.modules });
        res.student = { ...res.student, id: remote.entityId ?? id, userId: remote.userId };
        res.users = res.users.map((item) => item.username === username ? { ...item, id: remote.userId, linkedId: res.student.id, password: "" } : item);
        if (remote.warnings?.length) toast.warning(remote.warnings.join("\n"));
        toast.success(`Pré-inscription confirmée pour ${student.prenom} ${student.nom}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "La création Supabase a échoué.");
        return;
      }
    }
    update((d) => ({
      ...d, users: res.users,
      students: [res.student, ...d.students],
      registrations: d.registrations.map((r) => (r.id === regId ? { ...r, statut: "confirmee" as const } : r)),
      notifications: [{ id: uid("NTF"), toId: res.student.userId!, title: "Inscription confirmée", body: `Bienvenue ${res.student.prenom} ! Numéro d'apprenant : ${id}. Connectez-vous à votre espace avec vos identifiants.`, date: today(), lu: false, type: "inscription" }, ...d.notifications],
    }));
    const newUser = res.users[res.users.length - 1];
    setCreds({ nom: `${res.student.prenom} ${res.student.nom}`, username: newUser.username, password: res.password, id: res.student.id });
    log(`Pré-inscription confirmée : ${reg.nom} ${reg.prenom} (${res.student.id}) — compte créé`);
  };

  const removeStudent = (id: string) => {
    toast.custom((t) => (
      <div className="flex flex-col gap-3 rounded-2xl border border-red-500/30 bg-[#07152B] p-4 text-sm text-slate-200">
        <div className="flex items-center gap-2 font-bold text-white">Supprimer l'apprenant ?</div>
        <p>Cette action supprimera l'apprenant de la liste locale. Si le compte est sur Supabase, la suppression doit être faite depuis Supabase Auth.</p>
        <div className="mt-2 flex justify-end gap-2">
          <Btn variant="ghost" onClick={() => toast.dismiss(t)}>Annuler</Btn>
          <Btn variant="red" onClick={() => { update((d) => ({ ...d, students: d.students.filter((s) => s.id !== id) })); log(`Apprenant supprimé : ${id}`); toast.dismiss(t); toast.success("Apprenant supprimé."); }}>Supprimer</Btn>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const statusBadge = (s: Student) =>
    s.statutPaiement === "paye" ? <Badge color="green">Payé</Badge>
    : s.statutPaiement === "partiel" ? <Badge color="gold">Partiel</Badge>
    : <Badge color="red">Impayé</Badge>;

  return (
    <div>
      <PageHead
        title="Gestion des apprenants"
        subtitle={`${db.students.length} apprenants • ${db.registrations.length} pré-inscription(s) en attente`}
        actions={<Btn onClick={() => { setForm(emptyStudent()); setEditing(null); setCreating(true); }}><PlusCircle size={16} /> Ajouter un apprenant</Btn>}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input placeholder="Rechercher par nom, prénom ou n° d'apprenant..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          {([["tous", "Tous"], ["informatique", "Génie Info"], ["industriel", "Génie Ind."]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={cn(
              "rounded-xl border px-4 py-2.5 text-sm font-bold transition-all",
              tab === k ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300" : "border-white/10 text-slate-400 hover:bg-white/5"
            )}>{l}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty icon={<Users size={40} />} title="Aucun apprenant trouvé" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                <th className="px-4 py-3">N° Apprenant</th>
                <th className="px-4 py-3">Apprenant</th>
                <th className="px-4 py-3">Formation</th>
                <th className="px-4 py-3">Modules</th>
                <th className="px-4 py-3">Paiement</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-cyan-300">{s.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {s.photo ? <img src={s.photo} alt="" className="h-9 w-9 rounded-lg object-cover" /> : <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-600/30"><UserCircle2 size={20} className="text-cyan-300" /></div>}
                      <div>
                        <p className="text-sm font-bold text-white">{s.prenom} {s.nom}</p>
                        <p className="text-[11px] text-slate-500">{s.niveau}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-300">{formationLabel(s.formation)}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{s.modules.length} module(s)</td>
                  <td className="px-4 py-3">{statusBadge(s)}</td>
                  <td className="px-4 py-3"><Badge color={s.statut === "actif" ? "cyan" : "gray"}>{s.statut}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => setViewing(s)} className="rounded-lg border border-white/10 p-2 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300" title="Voir"><Eye size={15} /></button>
                      <button onClick={() => { setForm(s); setEditing(s); setCreating(true); }} className="rounded-lg border border-white/10 p-2 text-slate-300 hover:border-amber-400/40 hover:text-amber-300" title="Modifier"><Pencil size={15} /></button>
                      <button onClick={() => removeStudent(s.id)} className="rounded-lg border border-white/10 p-2 text-slate-300 hover:border-red-500/40 hover:text-red-400" title="Supprimer"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* pré-inscriptions */}
      <h3 className="font-display mt-8 mb-3 text-lg font-bold text-white">Pré-inscriptions en ligne</h3>
      {db.registrations.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune pré-inscription en attente.</p>
      ) : (
        <div className="space-y-3">
          {db.registrations.map((r) => (
            <Card key={r.id} className="p-4" glow={r.statut === "en_attente" ? "gold" : "none"}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-white">{r.nom} {r.prenom}</p>
                  <p className="text-xs text-slate-400">{formationLabel(r.formation)} • {r.modules.length} module(s) • {r.niveau}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><Phone size={11} /> {r.telephone}</span>
                    <span className="flex items-center gap-1"><Mail size={11} /> {r.email}</span>
                    <span className="flex items-center gap-1"><CalendarDays size={11} /> {r.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={r.statut === "en_attente" ? "gold" : r.statut === "confirmee" ? "green" : "red"}>{r.statut.replace("_", " ")}</Badge>
                  {r.statut === "en_attente" && (
                    <>
                      <Btn variant="green" onClick={() => confirmRegistration(r.id)}><CheckCircle2 size={15} /> Confirmer</Btn>
                      <Btn variant="ghost" onClick={() => update((d) => ({ ...d, registrations: d.registrations.map((x) => x.id === r.id ? { ...x, statut: "refusee" as const } : x) }))}><XCircle size={15} /></Btn>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* add/edit modal */}
      <Modal open={creating} onClose={() => setCreating(false)} title={editing ? `Modifier ${editing.id}` : "Nouvel apprenant"} wide>
        <StudentForm form={form} setForm={setForm} />
        <div className="mt-5 flex justify-end gap-2">
          <Btn variant="ghost" onClick={() => setCreating(false)}>Annuler</Btn>
          <Btn onClick={save}>{editing ? "Enregistrer" : "Créer l'apprenant"}</Btn>
        </div>
      </Modal>

      {/* view modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing ? `${viewing.prenom} ${viewing.nom}` : ""} wide>
        {viewing && <StudentView s={viewing} />}
      </Modal>

      {/* modal identifiants du compte créé */}
      <Modal open={!!creds} onClose={() => setCreds(null)} title="Compte apprenant créé">
        {creds && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10">
              <CheckCircle2 size={30} className="text-emerald-300" />
            </div>
            <p className="text-sm text-slate-300">Le compte de <b className="text-white">{creds.nom}</b> a été créé avec succès.</p>
            <p className="font-mono text-xs text-slate-500">{creds.id}</p>
            <div className="mx-auto mt-5 max-w-sm rounded-2xl border border-cyan-400/30 bg-[#07152B] p-4 text-left">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Identifiants de connexion</p>
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2.5">
                <span className="text-xs text-slate-400">Nom d'utilisateur</span>
                <span className="font-mono text-sm font-bold text-white">{creds.username}</span>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2.5">
                <span className="text-xs text-slate-400">Mot de passe</span>
                <span className="font-mono text-sm font-bold text-amber-300">{creds.password}</span>
              </div>
              <p className="mt-2.5 text-[10px] text-slate-500">📌 Transmettez ces identifiants à l'apprenant (WhatsApp : il pourra se connecter via l'onglet « Apprenant »).</p>
            </div>
            <div className="mt-5 flex justify-center gap-2">
              <Btn variant="ghost" onClick={() => navigator.clipboard?.writeText(`Identifiant: ${creds.username} | Mot de passe: ${creds.password} | Site: SENTINELLES NUMÉRIQUES`)}>
                📋 Copier
              </Btn>
              <Btn onClick={() => setCreds(null)}>Terminé</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function StudentForm({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const { db } = useStore();
  const avail = db.modules.filter((m) => m.formation === form.formation);
  const toggle = (id: string) =>
    setForm({ ...form, modules: form.modules.includes(id) ? form.modules.filter((x: string) => x !== id) : [...form.modules, id] });

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setForm({ ...form, photo: await readImage(f, 300) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {form.photo ? (
          <img src={form.photo} alt="photo" className="h-20 w-20 rounded-2xl border border-cyan-400/40 object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]"><UserCircle2 size={36} className="text-slate-500" /></div>
        )}
        <label className="cursor-pointer">
          <span className="rounded-xl border border-cyan-400/40 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-400/10">📷 Photo de profil</span>
          <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom"><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></Field>
        <Field label="Prénom"><Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} /></Field>
        <Field label="Date de naissance"><Input type="date" value={form.dateNaissance} onChange={(e) => setForm({ ...form, dateNaissance: e.target.value })} /></Field>
        <Field label="Sexe">
          <Select value={form.sexe} onChange={(e) => setForm({ ...form, sexe: e.target.value })}>
            <option value="M">Masculin</option><option value="F">Féminin</option>
          </Select>
        </Field>
        <Field label="Téléphone"><Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></Field>
        <Field label="WhatsApp"><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Field>
        <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Adresse"><Input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} /></Field>
        <Field label="Niveau d'étude"><Input value={form.niveau} onChange={(e) => setForm({ ...form, niveau: e.target.value })} /></Field>
        <Field label="Statut paiement">
          <Select value={form.statutPaiement} onChange={(e) => setForm({ ...form, statutPaiement: e.target.value })}>
            <option value="paye">Payé</option><option value="partiel">Partiel</option><option value="impaye">Impayé</option>
          </Select>
        </Field>
      </div>
      <Field label="Formation">
        <div className="grid grid-cols-2 gap-3">
          {(["informatique", "industriel"] as Formation[]).map((f) => (
            <button type="button" key={f} onClick={() => setForm({ ...form, formation: f, modules: [] })}
              className={cn("rounded-xl border p-3 text-sm font-bold transition-all",
                form.formation === f ? (f === "informatique" ? "border-red-500/60 bg-red-500/10 text-red-400" : "border-cyan-400/60 bg-cyan-400/10 text-cyan-300") : "border-white/10 text-slate-400")}>
              {formationLabel(f)}
            </button>
          ))}
        </div>
      </Field>
      <Field label={`Modules (${form.modules.length})`}>
        <div className="grid max-h-52 gap-1.5 overflow-y-auto sm:grid-cols-2">
          {avail.map((m) => (
            <button type="button" key={m.id} onClick={() => toggle(m.id)}
              className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-all",
                form.modules.includes(m.id) ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200" : "border-white/10 text-slate-400 hover:bg-white/5")}>
              {moduleIcon(m.icon, "h-3.5 w-3.5")} {m.numero}. {m.titre}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function StudentView({ s }: { s: Student }) {
  const { db } = useStore();
  const mods = db.modules.filter((m) => s.modules.includes(m.id));
  const pays = db.payments.filter((p) => p.studentId === s.id);
  const total = pays.reduce((a, p) => a + p.montant, 0);
  const due = totalDue(db.settings.frais, s.formation, s.modules.length);
  const solde = Math.max(0, due - total);
  const att = db.attendance.filter((a) => a.studentId === s.id);
  const grades = db.grades.filter((g) => g.studentId === s.id);
  const cert = db.certificates.find((c) => c.studentId === s.id);
  const bourse = db.scholarships.find((b) => b.studentId === s.id);
  const userAccount = db.users.find((u) => u.id === s.userId);

  return (
    <div className="grid gap-5 md:grid-cols-[1fr_1.4fr]">
      {/* carte numérique */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-[#0A1224] to-[#07152B] p-5">
        <div className="bg-grid-hex pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-cyan-300" />
              <span className="font-display text-xs font-black tracking-wider text-white">SENTINELLES<br />NUMÉRIQUES</span>
            </div>
            <Badge color={s.statut === "actif" ? "green" : "gray"}>{s.statut}</Badge>
          </div>
          <div className="flex items-center gap-3">
            {s.photo ? <img src={s.photo} alt="" className="h-16 w-16 rounded-xl border border-cyan-400/40 object-cover" />
              : <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30"><UserCircle2 size={32} className="text-cyan-300" /></div>}
        <div>
          <p className="font-display text-base font-black text-white">{s.prenom} {s.nom}</p>
              <p className="text-[11px] text-slate-400">{formationLabel(s.formation)}</p>
              <p className="font-mono text-[11px] font-bold text-cyan-300">{s.id}</p>
              {userAccount && <p className="font-mono text-[10px] text-slate-500">@{userAccount.username}</p>}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="rounded-lg bg-white p-1.5">
              <QRCodeSVG value={`SN|${s.id}|${s.nom}|${s.prenom}|${s.formation}`} size={84} />
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <p className="flex items-center gap-1.5"><Phone size={11} className="text-emerald-300" /> {s.telephone}</p>
              <p className="flex items-center gap-1.5"><Mail size={11} className="text-cyan-300" /> {s.email}</p>
              <p className="flex items-center gap-1.5"><MapPin size={11} className="text-blue-400" /> {s.adresse || "—"}</p>
            </div>
          </div>
          <p className="mt-3 text-center text-[9px] uppercase tracking-[0.3em] text-slate-500">Carte numérique d'apprenant</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
            <p className="font-display text-lg font-black text-white">{mods.length}</p>
            <p className="text-[9px] uppercase tracking-wider text-slate-500">Modules</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
            <p className="font-display text-lg font-black text-emerald-300">{att.filter((a) => a.statut === "present").length}</p>
            <p className="text-[9px] uppercase tracking-wider text-slate-500">Présences</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
            <p className="font-display text-lg font-black text-amber-300">{grades.length ? (grades.reduce((a, g) => a + g.note, 0) / grades.length).toFixed(1) : "—"}</p>
            <p className="text-[9px] uppercase tracking-wider text-slate-500">Moyenne /20</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/5 p-3">
            <p className="text-[10px] uppercase text-slate-500">Total payé</p>
            <p className="font-display text-sm font-black text-emerald-300">{money(total)}</p>
          </div>
          <div className={cn("rounded-xl border p-3", solde > 0 ? "border-red-500/25 bg-red-500/5" : "border-emerald-400/25 bg-emerald-400/5")}>
            <p className="text-[10px] uppercase text-slate-500">Solde restant</p>
            <p className={cn("font-display text-sm font-black", solde > 0 ? "text-red-400" : "text-emerald-300")}>{money(solde)}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">Modules inscrits</p>
          <div className="flex flex-wrap gap-1.5">
            {mods.map((m) => (
              <span key={m.id} className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-slate-300">{m.numero}. {m.titre}</span>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-300">Paiements ({money(total)})</p>
          {pays.length === 0 ? <p className="text-xs text-slate-500">Aucun paiement.</p> : (
            <div className="space-y-1.5">
              {pays.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs">
                  <span className="flex items-center gap-2"><Wallet size={12} className="text-slate-400" /> {p.libelle} <span className="text-slate-600">• {p.date}</span></span>
                  <span className="font-bold text-slate-200">{money(p.montant)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {cert && <Badge color="gold">Certificat : {cert.numero}</Badge>}
          {bourse && <Badge color="green">Bourse : {bourse.statut.replace("_", " ")}</Badge>}
        </div>
      </div>
    </div>
  );
}

/* ================= TEACHERS ================= */
export function TeachersPage() {
  const { db, update, log } = useStore();
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<any>({ nom: "", prenom: "", specialite: "", email: "", phone: "", modules: [], photo: "", infos: "" });

  const onTeacherPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const img = await readImage(f, 300);
      setForm((prev: any) => ({ ...prev, photo: img }));
    }
  };

  const save = async () => {
    if (!form.nom) return;
    if (editing) {
      update((d) => ({ ...d, teachers: d.teachers.map((t) => (t.id === editing.id ? { ...t, ...form } : t)) }));
    } else {
      if (!supabaseConfigured) { toast.error("Supabase doit être configuré pour créer un compte formateur sécurisé."); return; }
      const id = `ENS-${String(db.teachers.length + 1).padStart(3, "0")}`;
      const teacher = { ...form, id };
      const local = makeAccount(db, { ...emptyStudent(), id, nom: form.nom, prenom: form.prenom, email: form.email, telephone: form.phone, modules: form.modules } as Student, "teacher");
      let users = local.users;
      let student = local.student;
      let remoteTeacherId = id;
      if (supabaseConfigured) {
        try {
          const username = users[users.length - 1].username;
          const remote = await createManagedUser({ role: "teacher", name: `${form.prenom} ${form.nom}`.trim(), username, email: form.email, password: local.password, phone: form.phone, nom: form.nom, prenom: form.prenom, specialite: form.specialite, infos: form.infos, typeContrat: form.typeContrat, tarifHoraire: form.tarifHoraire, moduleIds: form.modules });
          remoteTeacherId = remote.entityId ?? id;
          student = { ...student, userId: remote.userId };
          users = users.map((item) => item.username === username ? { ...item, id: remote.userId, linkedId: remoteTeacherId, password: "" } : item);
          if (remote.warnings?.length) toast.warning(remote.warnings.join("\n"));
          toast.success("Enseignant créé avec succès.");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "La création Supabase a échoué.");
          return;
        }
      }
      update((d) => ({
        ...d, users,
        teachers: [...d.teachers, { ...teacher, id: remoteTeacherId, userId: student.userId }],
      }));
    }
    log(`Enseignant ${editing ? "modifié" : "ajouté"} : ${form.nom} ${form.prenom}`);
    setCreating(false); setEditing(null);
  };

  return (
    <div>
      <PageHead title="Enseignants" subtitle={`${db.teachers.length} formateurs`}
        actions={<Btn onClick={() => { setForm({ nom: "", prenom: "", specialite: "", email: "", phone: "", modules: [] }); setEditing(null); setCreating(true); }}><PlusCircle size={16} /> Ajouter</Btn>} />
      {db.teachers.length === 0 ? (
        <Empty icon={<GraduationCap size={40} />} title="Aucun enseignant" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {db.teachers.map((t) => {
            const mods = db.modules.filter((m) => t.modules.includes(m.id));
            return (
              <Card key={t.id} className="p-5" glow="cyan">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {t.photo ? (
                      <img src={t.photo} alt="" className="h-12 w-12 rounded-xl border border-cyan-400/40 object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30">
                        <GraduationCap size={22} className="text-cyan-300" />
                      </div>
                    )}
                    <div>
                      <p className="font-display text-sm font-bold text-white">{t.prenom} {t.nom}</p>
                      <p className="text-[11px] text-slate-400">{t.specialite}</p>
                      <p className="font-mono text-[10px] text-cyan-400/70">{t.id}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => { setForm(t); setEditing(t); setCreating(true); }} className="rounded-lg border border-white/10 p-2 text-slate-300 hover:border-amber-400/40 hover:text-amber-300"><Pencil size={14} /></button>
                    <button onClick={() => {
                      toast.custom((tid) => (
                        <div className="flex flex-col gap-3 rounded-2xl border border-red-500/30 bg-[#07152B] p-4 text-sm text-slate-200">
                          <div className="flex items-center gap-2 font-bold text-white">Supprimer ce formateur ?</div>
                          <div className="mt-2 flex justify-end gap-2">
                            <Btn variant="ghost" onClick={() => toast.dismiss(tid)}>Annuler</Btn>
                            <Btn variant="red" onClick={() => { update((d) => ({ ...d, teachers: d.teachers.filter((x) => x.id !== t.id) })); toast.dismiss(tid); toast.success("Formateur supprimé."); }}>Supprimer</Btn>
                          </div>
                        </div>
                      ), { duration: Infinity });
                    }} className="rounded-lg border border-white/10 p-2 text-slate-300 hover:border-red-500/40 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {mods.map((m) => <span key={m.id} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-slate-400">{m.numero}. {m.titre}</span>)}
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500"><Phone size={11} className="text-emerald-300" /> {t.phone}</p>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title={editing ? `Modifier ${editing.id}` : "Nouvel enseignant"} wide>
        <div className="space-y-4">
          {/* photo */}
          <div className="flex items-center gap-4">
            {form.photo ? (
              <img src={form.photo} alt="" className="h-20 w-20 rounded-2xl border-2 border-cyan-400/50 object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/20 to-blue-600/20"><GraduationCap size={32} className="text-cyan-300" /></div>
            )}
            <div>
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 px-3.5 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-400/10">📷 {form.photo ? "Remplacer la photo" : "Ajouter une photo"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={onTeacherPhoto} />
              </label>
              {form.photo && <button onClick={() => setForm({ ...form, photo: "" })} className="ml-2 text-xs text-slate-400 hover:text-red-400">Retirer</button>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom"><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></Field>
            <Field label="Prénom"><Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} /></Field>
            <Field label="Spécialité"><Input value={form.specialite} onChange={(e) => setForm({ ...form, specialite: e.target.value })} placeholder="ex: Réseaux & Cybersécurité" /></Field>
            <Field label="Téléphone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          </div>
          <Field label="Informations professionnelles / biographie">
            <Textarea className="min-h-[70px]" value={form.infos ?? ""} onChange={(e) => setForm({ ...form, infos: e.target.value })} placeholder="Expérience, diplômes, domaines d'expertise..." />
          </Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Modules enseignés">
            <div className="grid max-h-48 gap-1.5 overflow-y-auto sm:grid-cols-2">
              {db.modules.map((m) => (
                <button type="button" key={m.id} onClick={() => setForm({ ...form, modules: form.modules.includes(m.id) ? form.modules.filter((x: string) => x !== m.id) : [...form.modules, m.id] })}
                  className={cn("rounded-lg border px-3 py-2 text-left text-xs transition-all",
                    form.modules.includes(m.id) ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200" : "border-white/10 text-slate-400 hover:bg-white/5")}>
                  {formationLabel(m.formation)} — {m.numero}. {m.titre}
                </button>
              ))}
            </div>
          </Field>
          <div className="flex justify-end gap-2">
            <Btn variant="ghost" onClick={() => setCreating(false)}>Annuler</Btn>
            <Btn onClick={save}>Enregistrer</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ================= USERS ================= */
export function UsersPage() {
  const { db, formationsMap, update, log } = useStore();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", role: "admin", name: "", email: "", organizationId: "", poste: "", contact: "", partnerScope: "viewer", startDate: today(), endDate: "", organizationFormationIds: [] as string[] });
  const [createdCreds, setCreatedCreds] = useState<{ username: string; password: string; name: string } | null>(null);
  const [organizations, setOrganizations] = useState<PartnerOrganizationRow[]>([]);
  const [organizationModal, setOrganizationModal] = useState(false);
  const [organizationName, setOrganizationName] = useState("");

  useEffect(() => {
    if (!supabaseConfigured) return;
    listPartnerOrganizations().then(setOrganizations).catch(() => setOrganizations([]));
  }, []);

  const roleColor = (r: string): "cyan" | "red" | "green" | "gold" | "gray" | "blue" => r === "superadmin" ? "red" : r === "admin" ? "gold" : r === "teacher" ? "cyan" : r === "partner" ? "blue" : r === "partner_admin" ? "gold" : "green";
  const roleLabel = (r: string) => r === "superadmin" ? "Super Admin" : r === "admin" ? "Administration" : r === "teacher" ? "Enseignant" : r === "partner" ? "Partenaire" : r === "partner_admin" ? "Admin Partenaire" : "Apprenant";

  return (
    <div>
      <PageHead title="Gestion des utilisateurs" subtitle="Comptes, rôles et permissions"
        actions={<Btn onClick={() => setAdding(true)}><PlusCircle size={16} /> Nouvel utilisateur</Btn>} />
      <div className="mb-4 flex flex-wrap gap-2">
        {["superadmin", "admin", "teacher", "student", "partner", "partner_admin"].map((r) => (
          <Badge key={r} color={roleColor(r)}>{roleLabel(r)}</Badge>
        ))}
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left">
          <thead>
            <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <th className="px-4 py-3">Utilisateur</th><th className="px-4 py-3">Identifiant</th><th className="px-4 py-3">Rôle</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {db.users.map((u) => (
              <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <p className="text-sm font-bold text-white">{u.name}</p>
                  <p className="text-[11px] text-slate-500">{u.linkedId ? `Lié à ${u.linkedId}` : "—"}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-cyan-300">{u.username}</td>
                <td className="px-4 py-3">
                  <Badge color={roleColor(u.role)}>{roleLabel(u.role)}</Badge>
                  {u.actif === false && <Badge color="red" className="ml-1.5">Désactivé</Badge>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{u.email || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button title="Réinitialiser le mot de passe (un nouveau mot fort est généré)"
                      onClick={async () => {
                        const np = genPassword();
                        toast.custom((tid) => (
                          <div className="flex flex-col gap-3 rounded-2xl border border-cyan-400/30 bg-[#07152B] p-4 text-sm text-slate-200">
                            <div className="flex items-center gap-2 font-bold text-white"><KeyRound size={18} className="text-cyan-400" /> Nouveau mot de passe pour {u.username}</div>
                            <div className="select-all rounded border border-white/10 bg-black/30 p-2 text-center font-mono text-cyan-300">{np}</div>
                            <p className="text-xs text-slate-400">Copiez ce mot de passe. Il devra être changé à la prochaine connexion.</p>
                            <div className="mt-2 flex justify-end gap-2">
                              <Btn variant="ghost" onClick={() => toast.dismiss(tid)}>Annuler</Btn>
                              <Btn variant="primary" onClick={async () => {
                                toast.dismiss(tid);
                                if (!supabaseConfigured) { toast.error("Supabase doit être configuré."); return; }
                                try {
                                  await resetManagedPassword(u.id, np);
                                  log(`Mot de passe réinitialisé pour ${u.username}`);
                                  toast.success("Mot de passe réinitialisé avec succès.");
                                } catch (err) {
                                  toast.error(err instanceof Error ? err.message : "Réinitialisation impossible.");
                                }
                              }}>Valider la réinitialisation</Btn>
                            </div>
                          </div>
                        ), { duration: Infinity });
                      }}
                      className="rounded-lg border border-white/10 p-2 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300"><KeyRound size={14} /></button>
                    {u.role !== "superadmin" && (
                      <button title={u.actif === false ? "Activer le compte" : "Désactiver le compte"}
                        onClick={async () => {
                          const next = !(u.actif !== false);
                          if (!supabaseConfigured) { toast.error("Supabase doit être configuré pour modifier un compte."); return; }
                          try {
                            await setAccountActive(u.id, next);
                            update((d) => ({ ...d, users: d.users.map((x) => x.id === u.id ? { ...x, actif: next } : x) }));
                            log(`Compte ${u.actif === false ? "activé" : "désactivé"} : ${u.username}`);
                            toast.success(`Compte ${next ? "activé" : "désactivé"} avec succès.`);
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Action impossible.");
                          }
                        }}
                        className={cn("rounded-lg border p-2", u.actif === false ? "border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10" : "border-white/10 text-slate-300 hover:border-amber-400/40 hover:text-amber-300")}>
                        {u.actif === false ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      </button>
                    )}
                    {u.role !== "superadmin" && (
                      <button onClick={() => {
                        toast.custom((tid) => {
                          const [confirmWord, setConfirmWord] = useState("");
                          return (
                            <div className="flex flex-col gap-3 rounded-2xl border border-red-500/30 bg-[#07152B] p-4 text-sm text-slate-200">
                              <div className="flex items-center gap-2 font-bold text-white">Suppression définitive</div>
                              <p>Pour confirmer la suppression du compte de <b>{u.username}</b>, tapez <b>SUPPRIMER</b> :</p>
                              <Input value={confirmWord} onChange={(e) => setConfirmWord(e.target.value)} placeholder="SUPPRIMER" />
                              <div className="mt-2 flex justify-end gap-2">
                                <Btn variant="ghost" onClick={() => toast.dismiss(tid)}>Annuler</Btn>
                                <Btn variant="red" disabled={confirmWord !== "SUPPRIMER"} onClick={async () => {
                                  toast.dismiss(tid);
                                  if (!supabaseConfigured) { toast.error("Supabase doit être configuré pour supprimer un compte."); return; }
                                  try {
                                    await deleteManagedUser(u.id, "SUPPRIMER");
                                    update((d) => ({ ...d, users: d.users.filter((x) => x.id !== u.id) }));
                                    toast.success("Compte supprimé définitivement.");
                                  } catch (err) {
                                    toast.error(err instanceof Error ? err.message : "Suppression impossible.");
                                  }
                                }}>Supprimer</Btn>
                              </div>
                            </div>
                          );
                        }, { duration: Infinity });
                      }}
                        className="rounded-lg border border-white/10 p-2 text-slate-300 hover:border-red-500/40 hover:text-red-400"><Trash2 size={14} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={adding} onClose={() => setAdding(false)} title="Nouvel utilisateur">
        <div className="space-y-4">
          <Field label="Nom complet"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Identifiant"><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
            <Field label="Mot de passe"><Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          </div>
          <Field label="Rôle">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="admin">Administration</option>
              <option value="partner">Partenaire externe</option>
              <option value="partner_admin">Administration partenaire</option>
            </Select>
          </Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          {(form.role === "partner" || form.role === "partner_admin") && (
            <div className="space-y-4 rounded-xl border border-blue-400/20 bg-blue-400/5 p-4">
              <Field label="Organisation partenaire">
                <div className="flex gap-2">
                  <Select value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })}>
                    <option value="">— Sélectionner —</option>
                    {organizations.map((org) => <option key={org.id} value={org.id}>{org.nom}</option>)}
                  </Select>
                  <Btn variant="outline" onClick={() => { setOrganizationName(""); setOrganizationModal(true); }}><PlusCircle size={14} /></Btn>
                </div>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Poste"><Input value={form.poste} onChange={(e) => setForm({ ...form, poste: e.target.value })} /></Field>
                <Field label="Contact"><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></Field>
                <Field label="Périmètre">
                  <Select value={form.partnerScope} onChange={(e) => setForm({ ...form, partnerScope: e.target.value })}>
                    <option value="viewer">Viewer — formations/modules</option>
                    <option value="academic">Academic — pédagogie/résultats</option>
                    <option value="finance">Finance — finances/rapports</option>
                    <option value="institutional">Institutional — périmètre étendu</option>
                  </Select>
                </Field>
                <Field label="Début"><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
                <Field label="Fin éventuelle"><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
              </div>
              <Field label="Formations accessibles">
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["informatique", "industriel"] as const).map((code) => {
                    const id = formationsMap[code];
                    const active = !!id && form.organizationFormationIds.includes(id);
                    return (
                      <button key={code} type="button" disabled={!id} onClick={() => setForm((prev) => ({ ...prev, organizationFormationIds: active ? prev.organizationFormationIds.filter((x) => x !== id) : [...prev.organizationFormationIds, id] }))}
                        className={cn("rounded-xl border px-3 py-2 text-left text-xs font-bold", active ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300" : "border-white/10 text-slate-400", !id && "opacity-40")}>
                        {formationLabel(code)}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Btn variant="ghost" onClick={() => setAdding(false)}>Annuler</Btn>
            <Btn onClick={async () => {
              if (!form.username || !form.password || !form.name) return;
              if (supabaseConfigured) {
                try {
                  const targetRole = form.role as Exclude<AppRole, "superadmin" | "teacher" | "student">;
                  if ((targetRole === "partner" || targetRole === "partner_admin") && !form.organizationId) throw new Error("Sélectionnez une organisation partenaire.");
                  if ((targetRole === "partner" || targetRole === "partner_admin") && form.organizationFormationIds.length === 0) throw new Error("Sélectionnez au moins une formation accessible à cette organisation.");
                  if (targetRole === "partner" || targetRole === "partner_admin") await setOrganizationFormations(form.organizationId, form.organizationFormationIds);
                  const remote = await createManagedUser({ role: targetRole, name: form.name, username: form.username, email: form.email, password: form.password, organizationId: form.organizationId || undefined, poste: form.poste || undefined, contact: form.contact || undefined, partnerScope: form.partnerScope as PartnerScope, startDate: form.startDate, endDate: form.endDate || undefined });
                  const nu: User = { id: remote.userId, username: form.username.trim().toLowerCase(), password: "", role: targetRole, name: form.name, email: form.email, createdAt: today(), actif: true };
                  update((d) => ({ ...d, users: [nu, ...d.users] }));
                  setCreatedCreds({ username: nu.username, password: form.password, name: form.name });
                  log(`Utilisateur créé via Supabase : ${form.username} (${targetRole})`);
                  setAdding(false); setForm({ username: "", password: "", role: "admin", name: "", email: "", organizationId: "", poste: "", contact: "", partnerScope: "viewer", startDate: today(), endDate: "", organizationFormationIds: [] });
                  return;
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Création impossible.");
                  return;
                }
              }
              toast.error("Supabase doit être configuré pour créer un compte sécurisé.");
            }}>Créer</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={organizationModal} onClose={() => setOrganizationModal(false)} title="Nouvelle organisation partenaire">
        <div className="space-y-4">
          <Field label="Nom de l'organisation"><Input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} autoFocus /></Field>
          <div className="flex justify-end gap-2">
            <Btn variant="ghost" onClick={() => setOrganizationModal(false)}>Annuler</Btn>
            <Btn onClick={async () => {
              if (!organizationName.trim()) { toast.error("Le nom de l'organisation est obligatoire."); return; }
              try {
                const org = await createPartnerOrganization(organizationName);
                setOrganizations((rows) => [...rows, org].sort((a, b) => a.nom.localeCompare(b.nom)));
                setForm((prev) => ({ ...prev, organizationId: org.id }));
                setOrganizationModal(false);
                toast.success("Organisation créée avec succès.");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Organisation impossible à créer.");
              }
            }}>Créer</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={!!createdCreds} onClose={() => setCreatedCreds(null)} title="Identifiants temporaires">
        {createdCreds && (
          <div className="text-center">
            <p className="text-sm text-slate-300">Compte administratif créé pour <b className="text-white">{createdCreds.name}</b>.</p>
            <div className="mt-4 rounded-2xl border border-cyan-400/30 bg-[#07152B] p-4 text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">À transmettre manuellement</p>
              <p className="mt-2 font-mono text-sm text-white">Identifiant : {createdCreds.username}</p>
              <p className="font-mono text-sm text-amber-300">Mot de passe : {createdCreds.password}</p>
              <p className="mt-2 text-[11px] text-slate-500">L'utilisateur devra changer ce mot de passe à la première connexion.</p>
            </div>
            <Btn className="mt-4" onClick={() => setCreatedCreds(null)}>Terminé</Btn>
          </div>
        )}
      </Modal>
    </div>
  );
}
