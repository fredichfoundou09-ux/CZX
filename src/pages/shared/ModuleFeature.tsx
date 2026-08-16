import { useState } from "react";
import {
  PlusCircle, Trash2, Save, Upload, ImageOff, BookOpen, Target, ListOrdered, Clock,
  GraduationCap, FileText, TestTube2, NotebookPen, Info, ChevronDown,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/utils/cn";
import { Btn, Field, Input, Textarea, Modal, readImage, uid, moduleIcon, formationLabel } from "@/lib/ui";
import { Module } from "@/lib/types";
import { supabaseConfigured } from "@/lib/supabase/client";
import { updateModuleDetails } from "@/lib/supabase/modules";
import { toast } from "sonner";

/* =========================================================
   ÉDITEUR COMPLET DE FICHE MODULE (Admin + Formateur autorisé)
   ========================================================= */
export function ModuleEditorModal({ mod, onClose }: { mod: Module; onClose: () => void }) {
  const { update, log } = useStore();
  const [form, setForm] = useState({
    description: mod.description ?? "",
    objectifs: (mod.objectifs ?? []).join("\n"),
    programme: mod.programme ?? "",
    chapitres: (mod.chapitres ?? []).map((c) => ({ ...c })),
    duree: mod.duree ?? "",
    image: mod.image ?? "",
    extra: mod.extra ?? "",
  });

  const save = async () => {
    const objectifs = form.objectifs.split("\n").map((s) => s.trim()).filter(Boolean);
    const chapitres = form.chapitres.filter((c) => c.titre.trim());
    try {
      if (supabaseConfigured) await updateModuleDetails(mod.id, { description: form.description, objectifs, programme: form.programme, chapitres, duree: form.duree, image: form.image, extra: form.extra });
    update((d) => ({
      ...d,
      modules: d.modules.map((m) =>
        m.id === mod.id
          ? {
              ...m,
              description: form.description,
              objectifs,
              programme: form.programme,
              chapitres,
              duree: form.duree,
              image: form.image,
              extra: form.extra,
            }
          : m
      ),
    }));
    log(`Fiche module mise à jour : ${mod.titre}`);
    toast.success("Fiche module enregistrée.");
    onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'enregistrer la fiche module.");
    }
  };

  const onImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setForm({ ...form, image: await readImage(f, 900) });
  };

  return (
    <Modal open onClose={onClose} title={<span className="flex items-center gap-2">{moduleIcon(mod.icon, "h-5 w-5")} Fiche — {mod.titre}</span>} wide>
      <div className="space-y-5">
        {/* image */}
        <div className="flex flex-wrap items-center gap-4">
          {form.image ? (
            <div className="relative">
              <img src={form.image} alt="module" className="h-24 w-40 rounded-xl border border-cyan-400/40 object-cover" />
              <button onClick={() => setForm({ ...form, image: "" })} className="absolute -bottom-2 -right-2 rounded-lg border border-white/10 bg-[#05070D] p-1.5 text-slate-400 hover:text-red-400"><ImageOff size={13} /></button>
            </div>
          ) : (
            <div className="flex h-24 w-40 items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-slate-600">{moduleIcon(mod.icon, "h-8 w-8")}</div>
          )}
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 px-3.5 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-400/10"><Upload size={14} /> {form.image ? "Remplacer l'image" : "Ajouter une image"}</span>
            <input type="file" accept="image/*" onChange={onImage} className="hidden" />
          </label>
        </div>

        <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Field label="Objectifs" hint="Un objectif par ligne"><Textarea value={form.objectifs} onChange={(e) => setForm({ ...form, objectifs: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Durée"><Input value={form.duree} onChange={(e) => setForm({ ...form, duree: e.target.value })} placeholder="ex: 3 semaines" /></Field>
          <Field label="Informations supplémentaires"><Input value={form.extra} onChange={(e) => setForm({ ...form, extra: e.target.value })} /></Field>
        </div>
        <Field label="Programme pédagogique"><Textarea className="min-h-[110px]" value={form.programme} onChange={(e) => setForm({ ...form, programme: e.target.value })} placeholder="Semaine 1 — ..." /></Field>

        {/* chapitres */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">Chapitres ({form.chapitres.length})</p>
            <Btn variant="outline" className="px-3 py-1.5 text-xs" onClick={() => setForm({ ...form, chapitres: [...form.chapitres, { id: uid("CH"), titre: "", description: "" }] })}>
              <PlusCircle size={13} /> Ajouter un chapitre
            </Btn>
          </div>
          <div className="space-y-2">
            {form.chapitres.map((c, i) => (
              <div key={c.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="flex items-start gap-2">
                  <span className="mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 font-mono text-[11px] font-bold text-cyan-300">{i + 1}</span>
                  <div className="flex-1 space-y-2">
                    <Input placeholder={`Chapitre ${i + 1} — Titre`} value={c.titre} onChange={(e) => setForm({ ...form, chapitres: form.chapitres.map((x) => (x.id === c.id ? { ...x, titre: e.target.value } : x)) })} />
                    <Input placeholder="Description du chapitre" value={c.description} onChange={(e) => setForm({ ...form, chapitres: form.chapitres.map((x) => (x.id === c.id ? { ...x, description: e.target.value } : x)) })} />
                  </div>
                  <button onClick={() => setForm({ ...form, chapitres: form.chapitres.filter((x) => x.id !== c.id) })} className="mt-2 rounded-lg border border-white/10 p-2 text-slate-400 hover:border-red-500/40 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {form.chapitres.length === 0 && <p className="rounded-xl border border-dashed border-white/10 py-5 text-center text-xs text-slate-600">Aucun chapitre — cliquez sur « Ajouter un chapitre ».</p>}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
          <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
          <Btn onClick={save}><Save size={15} /> Enregistrer la fiche</Btn>
        </div>
      </div>
    </Modal>
  );
}

/* =========================================================
   AFFICHAGE PUBLIC DE LA FICHE MODULE
   ========================================================= */
export function ModuleDetailModal({ mod, onClose }: { mod: Module; onClose: () => void }) {
  const { db } = useStore();
  const teachers = db.teachers.filter((t) => t.modules.includes(mod.id));
  const courses = db.courses.filter((c) => c.moduleId === mod.id);
  const tests = db.tests.filter((t) => t.moduleId === mod.id);
  const [openCh, setOpenCh] = useState<string | null>(mod.chapitres?.[0]?.id ?? null);
  const isInfo = mod.formation === "informatique";

  return (
    <Modal open onClose={onClose} title="" wide>
      {/* header */}
      <div className="relative -mx-6 -mt-6 mb-5 overflow-hidden">
        {mod.image ? (
          <>
            <img src={mod.image} alt="" className="h-44 w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#081021] via-[#081021]/60 to-transparent" />
          </>
        ) : (
          <div className={cn("h-32 w-full", isInfo ? "bg-gradient-to-r from-red-500/20 via-transparent to-transparent" : "bg-gradient-to-r from-cyan-400/20 via-transparent to-transparent")} />
        )}
        <div className="absolute bottom-0 left-0 right-0 flex items-end gap-3 p-6">
          <div className={cn("rounded-xl border p-3", isInfo ? "border-red-500/40 bg-red-500/10 text-red-400" : "border-cyan-400/40 bg-cyan-400/10 text-cyan-300")}>
            {moduleIcon(mod.icon, "h-7 w-7")}
          </div>
          <div>
            <p className={cn("font-mono text-[10px] font-bold tracking-[0.25em]", isInfo ? "text-red-400/80" : "text-cyan-400/80")}>MODULE {String(mod.numero).padStart(2, "0")} • {formationLabel(mod.formation)}</p>
            <h3 className="font-display text-xl font-black text-white">{mod.titre}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><Clock size={11} /> {mod.duree || "à définir"}</span>
              <span className="flex items-center gap-1"><BookOpen size={11} /> {mod.chapitres?.length ?? 0} chapitres</span>
              <span className="flex items-center gap-1"><TestTube2 size={11} /> {tests.length} test(s)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* description */}
        <section>
          <SecTitle icon={<BookOpen size={14} className="text-cyan-300" />} label="Description" />
          <p className="text-sm leading-relaxed text-slate-300">{mod.description || "Description à compléter par l'équipe pédagogique."}</p>
        </section>

        {/* objectifs */}
        <section>
          <SecTitle icon={<Target size={14} className="text-emerald-300" />} label="Objectifs" />
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {(mod.objectifs ?? []).map((o, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/5 px-3 py-2 text-xs text-slate-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" /> {o}
              </li>
            ))}
            {(mod.objectifs ?? []).length === 0 && <p className="text-xs text-slate-600">À définir.</p>}
          </ul>
        </section>

        {/* programme */}
        <section>
          <SecTitle icon={<ListOrdered size={14} className="text-blue-400" />} label="Programme" />
          <p className="whitespace-pre-wrap rounded-xl border border-white/5 bg-black/30 p-4 font-mono text-xs leading-relaxed text-slate-300">{mod.programme || "Programme à venir."}</p>
        </section>

        {/* chapitres */}
        <section>
          <SecTitle icon={<BookOpen size={14} className="text-red-400" />} label={`Chapitres (${mod.chapitres?.length ?? 0})`} />
          <div className="space-y-1.5">
            {(mod.chapitres ?? []).map((c, i) => (
              <div key={c.id} className="overflow-hidden rounded-xl border border-white/10">
                <button onClick={() => setOpenCh(openCh === c.id ? null : c.id)} className="flex w-full items-center gap-3 bg-white/[0.02] px-3.5 py-2.5 text-left hover:bg-white/[0.05]">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/15 font-mono text-[10px] font-bold text-slate-300">{i + 1}</span>
                  <span className="flex-1 truncate text-sm font-bold text-slate-200">{c.titre}</span>
                  <ChevronDown size={15} className={cn("text-slate-500 transition-transform", openCh === c.id && "rotate-180")} />
                </button>
                {openCh === c.id && <p className="border-t border-white/5 px-4 py-3 text-xs leading-relaxed text-slate-400">{c.description}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* formateurs */}
        <section>
          <SecTitle icon={<GraduationCap size={14} className="text-cyan-300" />} label="Formateur(s)" />
          <div className="flex flex-wrap gap-2">
            {teachers.length === 0 && <p className="text-xs text-slate-600">Affectation en cours.</p>}
            {teachers.map((t) => (
              <div key={t.id} className="flex items-center gap-2.5 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-3 py-2">
                {t.photo ? <img src={t.photo} alt="" className="h-8 w-8 rounded-lg object-cover" /> : <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-600/30"><GraduationCap size={15} className="text-cyan-300" /></div>}
                <div>
                  <p className="text-xs font-bold text-slate-200">{t.prenom} {t.nom}</p>
                  <p className="text-[10px] text-slate-500">{t.specialite}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* supports & évaluations */}
        <section>
          <SecTitle icon={<FileText size={14} className="text-amber-300" />} label="Supports & évaluations" />
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
              <FileText size={16} className="mx-auto text-cyan-300" />
              <p className="font-display mt-1 text-lg font-black text-white">{courses.filter((c) => c.type === "cours").length}</p>
              <p className="text-[9px] uppercase tracking-wider text-slate-500">Cours / supports</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
              <NotebookPen size={16} className="mx-auto text-amber-300" />
              <p className="font-display mt-1 text-lg font-black text-white">{courses.filter((c) => c.type === "devoir").length}</p>
              <p className="text-[9px] uppercase tracking-wider text-slate-500">Devoirs</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
              <TestTube2 size={16} className="mx-auto text-red-400" />
              <p className="font-display mt-1 text-lg font-black text-white">{tests.length}</p>
              <p className="text-[9px] uppercase tracking-wider text-slate-500">Tests</p>
            </div>
          </div>
        </section>

        {mod.extra && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/25 bg-amber-400/5 p-3.5 text-xs text-slate-300">
            <Info size={15} className="mt-0.5 shrink-0 text-amber-300" /> {mod.extra}
          </div>
        )}
      </div>
    </Modal>
  );
}

function SecTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{icon}{label}</p>;
}
