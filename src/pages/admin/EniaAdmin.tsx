import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Info, BadgeDollarSign, Wallet, FileCheck2, Sparkles, Image as ImageIcon, LinkIcon,
  Handshake, Save, PlusCircle, Trash2, Upload, ImageOff, Eye, AlertTriangle, ArrowUp, ArrowDown,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/utils/cn";
import { Btn, Card, Field, Input, Textarea, PageHead, Modal, readImage, uid, moveItem } from "@/lib/ui";
import { EniaFeeRow, EniaPieceGroup, EniaAvantage, EniaHighlight, Partner } from "@/lib/types";
import afficheDefaut from "@/assets/enia-affiche.jpg";
import { supabaseConfigured } from "@/lib/supabase/client";
import { saveEniaContent } from "@/lib/supabase/enia";
import { toast } from "sonner";

const TABS = [
  { k: "general", l: "Informations générales", icon: <Info size={15} /> },
  { k: "bourse", l: "Bourse", icon: <BadgeDollarSign size={15} /> },
  { k: "frais", l: "Frais scolaires", icon: <Wallet size={15} /> },
  { k: "pieces", l: "Pièces à fournir", icon: <FileCheck2 size={15} /> },
  { k: "avantages", l: "Avantages", icon: <Sparkles size={15} /> },
  { k: "affiche", l: "Affiche", icon: <ImageIcon size={15} /> },
  { k: "lien", l: "Lien ENIA 2.0", icon: <LinkIcon size={15} /> },
  { k: "partenaires", l: "Partenaires", icon: <Handshake size={15} /> },
];

export function EniaAdmin() {
  const { db, update, log } = useStore();
  const src = db.settings.enia;
  const [tab, setTab] = useState("general");
  const [saved, setSaved] = useState(false);
  const [confirmDel, setConfirmDel] = useState<{ kind: string; id: string; label: string } | null>(null);

  const [e, setE] = useState(() => JSON.parse(JSON.stringify(src)) as typeof src);
  const [partenaires, setPartenaires] = useState<Partner[]>(
    db.settings.partenaires.map((p, i) => ({ ...p, ordre: p.ordre ?? i }))
  );

  const persist = async () => {
    const cleanEnia = { ...e, frais: e.frais.filter((f) => f.label.trim()), highlights: e.highlights.filter((h) => h.texte.trim()), pieces: e.pieces.filter((p) => p.titre.trim()), bourse: { ...e.bourse, avantages: e.bourse.avantages.filter((a) => a.texte.trim()) } };
    const cleanPartners = partenaires.filter((p) => p.nom.trim()).map((p, i) => ({ ...p, ordre: p.ordre ?? i }));
    try {
      if (supabaseConfigured) await saveEniaContent(cleanEnia, cleanPartners);
      update((d) => ({ ...d, settings: { ...d.settings, enia: cleanEnia, partenaires: cleanPartners } }));
      log("Module ENIA 2.0 mis à jour");
      setSaved(true);
      toast.success("Module ENIA 2.0 enregistré.");
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'enregistrer ENIA 2.0.");
    }
  };

  const doDelete = () => {
    if (!confirmDel) return;
    const { kind, id } = confirmDel;
    if (kind === "frais") setE({ ...e, frais: e.frais.filter((x) => x.id !== id) });
    if (kind === "piece") setE({ ...e, pieces: e.pieces.filter((x) => x.id !== id) });
    if (kind === "avantage") setE({ ...e, bourse: { ...e.bourse, avantages: e.bourse.avantages.filter((x) => x.id !== id) } });
    if (kind === "highlight") setE({ ...e, highlights: e.highlights.filter((x) => x.id !== id) });
    if (kind === "partenaire") setPartenaires(partenaires.filter((x) => x.id !== id));
    if (kind === "affiche") setE({ ...e, affiche: "" });
    setConfirmDel(null);
  };

  return (
    <div>
      <PageHead
        title="Administration — ENIA 2.0"
        subtitle="Toutes les informations du module sont modifiables ici, sans toucher au code"
        actions={
          <>
            <Link to="/app/enia"><Btn variant="outline"><Eye size={15} /> Voir le module</Btn></Link>
            <Btn onClick={persist} variant={saved ? "green" : "primary"}><Save size={15} /> {saved ? "Enregistré ✓" : "Enregistrer"}</Btn>
          </>
        }
      />

      {/* visibilité */}
      <Card className="mb-5 flex flex-wrap items-center justify-between gap-3 p-5" glow={e.enabled ? "green" : "gold"}>
        <div>
          <p className="text-sm font-bold text-white">Visibilité du module</p>
          <p className="text-[11px] text-slate-500">Lorsqu'il est désactivé, seuls les administrateurs peuvent consulter ENIA 2.0.</p>
        </div>
        <button onClick={() => setE({ ...e, enabled: !e.enabled })}
          className={cn("relative h-7 w-14 rounded-full transition-all", e.enabled ? "bg-emerald-500/70" : "bg-white/10")}>
          <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white transition-all", e.enabled ? "left-8" : "left-1")} />
        </button>
      </Card>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={cn("flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all",
              tab === t.k ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-300 shadow-[0_0_20px_-8px_rgba(0,229,255,0.6)]" : "border-white/10 text-slate-400 hover:bg-white/5")}>
            {t.icon} {t.l}
          </button>
        ))}
      </div>

      {/* ============ GÉNÉRAL ============ */}
      {tab === "general" && (
        <Card className="max-w-3xl p-6">
          <h3 className="font-display mb-4 text-sm font-bold text-white">Identité & présentation</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom du module"><Input value={e.nom} onChange={(ev) => setE({ ...e, nom: ev.target.value })} /></Field>
            <Field label="Sous-titre"><Input value={e.sousTitre} onChange={(ev) => setE({ ...e, sousTitre: ev.target.value })} /></Field>
          </div>
          <div className="mt-4 space-y-4">
            <Field label="Accroche (carte de présentation)"><Textarea value={e.accroche} onChange={(ev) => setE({ ...e, accroche: ev.target.value })} /></Field>
            <Field label="Titre de la section présentation"><Input value={e.presentationTitre} onChange={(ev) => setE({ ...e, presentationTitre: ev.target.value })} /></Field>
            <Field label="Texte de présentation"><Textarea className="min-h-[110px]" value={e.presentation} onChange={(ev) => setE({ ...e, presentation: ev.target.value })} /></Field>
          </div>
        </Card>
      )}

      {/* ============ BOURSE ============ */}
      {tab === "bourse" && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-display mb-4 text-sm font-bold text-amber-300">Section Bourse</h3>
            <div className="space-y-4">
              <Field label="Titre"><Input value={e.bourse.titre} onChange={(ev) => setE({ ...e, bourse: { ...e.bourse, titre: ev.target.value } })} /></Field>
              <Field label="Introduction"><Textarea value={e.bourse.intro} onChange={(ev) => setE({ ...e, bourse: { ...e.bourse, intro: ev.target.value } })} /></Field>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-white">Avantages annoncés ({e.bourse.avantages.length})</h3>
              <Btn variant="outline" className="px-3 py-1.5 text-xs"
                onClick={() => setE({ ...e, bourse: { ...e.bourse, avantages: [...e.bourse.avantages, { id: uid("EA"), texte: "" }] } })}>
                <PlusCircle size={13} /> Ajouter
              </Btn>
            </div>
            <div className="space-y-2">
              {e.bourse.avantages.map((a: EniaAvantage, i: number) => (
                <div key={a.id} className="flex gap-2">
                  <Input value={a.texte} placeholder="Avantage" onChange={(ev) => setE({ ...e, bourse: { ...e.bourse, avantages: e.bourse.avantages.map((x: EniaAvantage) => (x.id === a.id ? { ...x, texte: ev.target.value } : x)) } })} />
                  <button disabled={i === 0} onClick={() => setE({ ...e, bourse: { ...e.bourse, avantages: moveItem(e.bourse.avantages, i, i - 1) } })}
                    className="rounded-lg border border-white/10 px-2 text-slate-300 hover:text-cyan-300 disabled:opacity-30"><ArrowUp size={14} /></button>
                  <button disabled={i === e.bourse.avantages.length - 1} onClick={() => setE({ ...e, bourse: { ...e.bourse, avantages: moveItem(e.bourse.avantages, i, i + 1) } })}
                    className="rounded-lg border border-white/10 px-2 text-slate-300 hover:text-cyan-300 disabled:opacity-30"><ArrowDown size={14} /></button>
                  <Btn variant="ghost" onClick={() => setConfirmDel({ kind: "avantage", id: a.id, label: a.texte || "cet avantage" })}><Trash2 size={14} /></Btn>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-display mb-4 text-sm font-bold text-cyan-300">Section « Concrètement »</h3>
            <div className="space-y-4">
              <Field label="Titre"><Input value={e.bourse.concretementTitre} onChange={(ev) => setE({ ...e, bourse: { ...e.bourse, concretementTitre: ev.target.value } })} /></Field>
              <Field label="Texte"><Textarea value={e.bourse.concretement} onChange={(ev) => setE({ ...e, bourse: { ...e.bourse, concretement: ev.target.value } })} /></Field>
            </div>
          </Card>
        </div>
      )}

      {/* ============ FRAIS ============ */}
      {tab === "frais" && (
        <Card className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Field label="Titre de la section"><Input className="w-64" value={e.fraisTitre} onChange={(ev) => setE({ ...e, fraisTitre: ev.target.value })} /></Field>
            <Btn variant="outline" onClick={() => setE({ ...e, frais: [...e.frais, { id: uid("EF"), label: "", valeur: "" }] })}>
              <PlusCircle size={14} /> Ajouter une ligne
            </Btn>
          </div>
          <div className="space-y-2">
            {e.frais.map((f: EniaFeeRow, i: number) => (
              <div key={f.id} className="grid gap-2 sm:grid-cols-[1.2fr_1fr_auto_auto_auto]">
                <Input placeholder="Élément (ex: Inscription annuelle)" value={f.label}
                  onChange={(ev) => setE({ ...e, frais: e.frais.map((x: EniaFeeRow) => (x.id === f.id ? { ...x, label: ev.target.value } : x)) })} />
                <Input placeholder="Information (ex: 119 000 FCFA)" value={f.valeur}
                  onChange={(ev) => setE({ ...e, frais: e.frais.map((x: EniaFeeRow) => (x.id === f.id ? { ...x, valeur: ev.target.value } : x)) })} />
                <button disabled={i === 0} onClick={() => setE({ ...e, frais: moveItem(e.frais, i, i - 1) })}
                  className="rounded-lg border border-white/10 px-2 text-slate-300 hover:text-cyan-300 disabled:opacity-30"><ArrowUp size={14} /></button>
                <button disabled={i === e.frais.length - 1} onClick={() => setE({ ...e, frais: moveItem(e.frais, i, i + 1) })}
                  className="rounded-lg border border-white/10 px-2 text-slate-300 hover:text-cyan-300 disabled:opacity-30"><ArrowDown size={14} /></button>
                <Btn variant="ghost" onClick={() => setConfirmDel({ kind: "frais", id: f.id, label: f.label || "cette ligne" })}><Trash2 size={14} /></Btn>
              </div>
            ))}
            {e.frais.length === 0 && <p className="rounded-xl border border-dashed border-white/10 py-6 text-center text-xs text-slate-600">Aucune ligne de frais.</p>}
          </div>
        </Card>
      )}

      {/* ============ PIÈCES ============ */}
      {tab === "pieces" && (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Titre de la section"><Input value={e.piecesTitre} onChange={(ev) => setE({ ...e, piecesTitre: ev.target.value })} /></Field>
              <Field label="Mention importante"><Input value={e.piecesNote} onChange={(ev) => setE({ ...e, piecesNote: ev.target.value })} /></Field>
            </div>
          </Card>

          {e.pieces.map((g: EniaPieceGroup) => (
            <Card key={g.id} className="p-5">
              <div className="mb-3 flex items-start gap-2">
                <Input className="flex-1" placeholder="Titre du groupe (ex: Niveau L1 — Avec Bac)" value={g.titre}
                  onChange={(ev) => setE({ ...e, pieces: e.pieces.map((x: EniaPieceGroup) => (x.id === g.id ? { ...x, titre: ev.target.value } : x)) })} />
                <Btn variant="ghost" onClick={() => setConfirmDel({ kind: "piece", id: g.id, label: g.titre || "ce groupe" })}><Trash2 size={14} /></Btn>
              </div>
              <Field label="Documents (un par ligne)">
                <Textarea value={g.items.join("\n")}
                  onChange={(ev) => setE({ ...e, pieces: e.pieces.map((x: EniaPieceGroup) => (x.id === g.id ? { ...x, items: ev.target.value.split("\n") } : x)) })} />
              </Field>
              <div className="mt-3">
                <Field label="Frais de dépôt (optionnel)">
                  <Input placeholder="ex: Frais de dépôt de dossier : 10 000 FCFA" value={g.frais ?? ""}
                    onChange={(ev) => setE({ ...e, pieces: e.pieces.map((x: EniaPieceGroup) => (x.id === g.id ? { ...x, frais: ev.target.value } : x)) })} />
                </Field>
              </div>
            </Card>
          ))}

          <Btn variant="outline" onClick={() => setE({ ...e, pieces: [...e.pieces, { id: uid("EP"), titre: "", items: [], frais: "" }] })}>
            <PlusCircle size={14} /> Ajouter un groupe de pièces
          </Btn>
        </div>
      )}

      {/* ============ AVANTAGES / HIGHLIGHTS ============ */}
      {tab === "avantages" && (
        <Card className="max-w-2xl p-6">
          <Field label="Titre du bloc"><Input value={e.highlightTitre} onChange={(ev) => setE({ ...e, highlightTitre: ev.target.value })} /></Field>
          <div className="mb-3 mt-5 flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-white">Points clés ({e.highlights.length})</h3>
            <Btn variant="outline" className="px-3 py-1.5 text-xs"
              onClick={() => setE({ ...e, highlights: [...e.highlights, { id: uid("EH"), numero: String(e.highlights.length + 1), texte: "" }] })}>
              <PlusCircle size={13} /> Ajouter
            </Btn>
          </div>
          <div className="space-y-2">
            {e.highlights.map((h: EniaHighlight) => (
              <div key={h.id} className="grid gap-2 sm:grid-cols-[70px_1fr_auto]">
                <Input placeholder="N°" value={h.numero}
                  onChange={(ev) => setE({ ...e, highlights: e.highlights.map((x: EniaHighlight) => (x.id === h.id ? { ...x, numero: ev.target.value } : x)) })} />
                <Input placeholder="Texte du point clé" value={h.texte}
                  onChange={(ev) => setE({ ...e, highlights: e.highlights.map((x: EniaHighlight) => (x.id === h.id ? { ...x, texte: ev.target.value } : x)) })} />
                <Btn variant="ghost" onClick={() => setConfirmDel({ kind: "highlight", id: h.id, label: h.texte || "ce point" })}><Trash2 size={14} /></Btn>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ============ AFFICHE ============ */}
      {tab === "affiche" && (
        <Card className="max-w-2xl p-6">
          <h3 className="font-display mb-4 text-sm font-bold text-white">Affiche officielle ENIA 2.0</h3>
          <div className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
            <img src={e.affiche || afficheDefaut} alt="Affiche" className="max-h-96 w-full object-contain" />
          </div>
          <p className="mb-3 text-[11px] text-slate-500">
            {e.affiche ? "Affiche personnalisée chargée." : "Affiche par défaut affichée. Chargez une image pour la remplacer."}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 px-4 py-2.5 text-sm font-bold text-cyan-300 hover:bg-cyan-400/10">
                <Upload size={15} /> {e.affiche ? "Remplacer l'affiche" : "Charger une nouvelle affiche"}
              </span>
              <input type="file" accept="image/*" className="hidden"
                onChange={async (ev) => { const f = ev.target.files?.[0]; if (f) setE({ ...e, affiche: await readImage(f, 1400) }); }} />
            </label>
            {e.affiche && (
              <Btn variant="ghost" onClick={() => setConfirmDel({ kind: "affiche", id: "affiche", label: "l'affiche actuelle" })}>
                <ImageOff size={15} /> Supprimer l'affiche
              </Btn>
            )}
          </div>
          <div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div>
              <p className="text-sm font-bold text-slate-200">Autoriser le téléchargement</p>
              <p className="text-[11px] text-slate-500">Les formateurs et apprenants pourront télécharger l'affiche.</p>
            </div>
            <button onClick={() => setE({ ...e, afficheTelechargeable: !e.afficheTelechargeable })}
              className={cn("relative h-7 w-14 rounded-full transition-all", e.afficheTelechargeable ? "bg-emerald-500/70" : "bg-white/10")}>
              <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white transition-all", e.afficheTelechargeable ? "left-8" : "left-1")} />
            </button>
          </div>
        </Card>
      )}

      {/* ============ LIEN ============ */}
      {tab === "lien" && (
        <Card className="max-w-2xl p-6">
          <h3 className="font-display mb-4 text-sm font-bold text-white">Lien officiel ENIA 2.0</h3>
          <div className="space-y-4">
            <Field label="Nom du site"><Input value={e.lien.nom} onChange={(ev) => setE({ ...e, lien: { ...e.lien, nom: ev.target.value } })} /></Field>
            <Field label="URL" hint="Adresse complète, ex : https://enia.cg">
              <Input value={e.lien.url} placeholder="https://..." onChange={(ev) => setE({ ...e, lien: { ...e.lien, url: ev.target.value } })} />
            </Field>
            <Field label="Description"><Input value={e.lien.description} onChange={(ev) => setE({ ...e, lien: { ...e.lien, description: ev.target.value } })} /></Field>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div>
                <p className="text-sm font-bold text-slate-200">Statut du lien</p>
                <p className="text-[11px] text-slate-500">Le bouton « Visiter ENIA 2.0 » n'apparaît que si le lien est actif.</p>
              </div>
              <button onClick={() => setE({ ...e, lien: { ...e.lien, actif: !e.lien.actif } })}
                className={cn("relative h-7 w-14 rounded-full transition-all", e.lien.actif ? "bg-emerald-500/70" : "bg-white/10")}>
                <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white transition-all", e.lien.actif ? "left-8" : "left-1")} />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* ============ PARTENAIRES ============ */}
      {tab === "partenaires" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-400">Logo, description, site, contact, statut et ordre d'affichage. La suppression est protégée par confirmation.</p>
            <Btn variant="outline" onClick={() => setPartenaires([...partenaires, { id: uid("PTR"), nom: "", description: "", logo: "", site: "", actif: true, telephone: "", email: "", ordre: partenaires.length }])}>
              <PlusCircle size={14} /> Ajouter un partenaire
            </Btn>
          </div>
          {partenaires.map((p, i) => (
            <Card key={p.id} className={cn("p-4", !p.actif && "opacity-70")}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="relative shrink-0">
                  {p.logo ? (
                    <img src={p.logo} alt="" className="h-16 w-16 rounded-xl border border-cyan-400/30 object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-white/15 text-slate-600"><Handshake size={22} /></div>
                  )}
                  <label className="absolute -bottom-2 -right-2 cursor-pointer rounded-lg border border-cyan-400/40 bg-[#05070D] p-1.5 text-cyan-300 hover:bg-cyan-400/10" title="Logo">
                    <Upload size={12} />
                    <input type="file" accept="image/*" className="hidden"
                      onChange={async (ev) => { const f = ev.target.files?.[0]; if (f) { const img = await readImage(f, 300); setPartenaires((prev) => prev.map((x) => (x.id === p.id ? { ...x, logo: img } : x))); } }} />
                  </label>
                </div>
                <div className="min-w-60 flex-1 space-y-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input placeholder="Nom du partenaire" value={p.nom} onChange={(ev) => setPartenaires(partenaires.map((x) => (x.id === p.id ? { ...x, nom: ev.target.value } : x)))} />
                    <Input placeholder="Site web / lien" value={p.site} onChange={(ev) => setPartenaires(partenaires.map((x) => (x.id === p.id ? { ...x, site: ev.target.value } : x)))} />
                  </div>
                  <Input placeholder="Description" value={p.description} onChange={(ev) => setPartenaires(partenaires.map((x) => (x.id === p.id ? { ...x, description: ev.target.value } : x)))} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input placeholder="Téléphone" value={p.telephone ?? ""} onChange={(ev) => setPartenaires(partenaires.map((x) => (x.id === p.id ? { ...x, telephone: ev.target.value } : x)))} />
                    <Input placeholder="Email" value={p.email ?? ""} onChange={(ev) => setPartenaires(partenaires.map((x) => (x.id === p.id ? { ...x, email: ev.target.value } : x)))} />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <button onClick={() => setPartenaires(partenaires.map((x) => (x.id === p.id ? { ...x, actif: !x.actif } : x)))}
                    className={cn("relative h-6 w-12 rounded-full transition-all", p.actif ? "bg-emerald-500/70" : "bg-white/10")}>
                    <span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition-all", p.actif ? "left-7" : "left-1")} />
                  </button>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">{p.actif ? "Visible" : "Masqué"}</span>
                  <div className="flex gap-1.5">
                    <button disabled={i === 0} onClick={() => setPartenaires(moveItem(partenaires, i, i - 1).map((x, j) => ({ ...x, ordre: j })))}
                      className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:text-cyan-300 disabled:opacity-30"><ArrowUp size={13} /></button>
                    <button disabled={i === partenaires.length - 1} onClick={() => setPartenaires(moveItem(partenaires, i, i + 1).map((x, j) => ({ ...x, ordre: j })))}
                      className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:text-cyan-300 disabled:opacity-30"><ArrowDown size={13} /></button>
                    {p.logo && <button onClick={() => setPartenaires(partenaires.map((x) => (x.id === p.id ? { ...x, logo: "" } : x)))} className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-amber-300"><ImageOff size={13} /></button>}
                    <button onClick={() => setConfirmDel({ kind: "partenaire", id: p.id, label: p.nom || "ce partenaire" })}
                      className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:border-red-500/40 hover:text-red-400"><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {partenaires.length === 0 && <p className="rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-slate-600">Aucun partenaire.</p>}
        </div>
      )}

      {/* confirmation suppression */}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Confirmer la suppression">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10">
            <AlertTriangle size={26} className="text-red-400" />
          </div>
          <p className="text-sm text-slate-300">
            Supprimer <b className="text-white">{confirmDel?.label}</b> ?<br />
            <span className="text-xs text-slate-500">La suppression sera appliquée après enregistrement.</span>
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Btn variant="ghost" onClick={() => setConfirmDel(null)}>Annuler</Btn>
            <Btn variant="red" onClick={doDelete}><Trash2 size={15} /> Supprimer</Btn>
          </div>
        </div>
      </Modal>

      {/* barre d'enregistrement */}
      <div className="no-print sticky bottom-4 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-400/30 bg-[#081021]/95 px-5 py-3.5 shadow-[0_0_30px_-10px_rgba(0,229,255,0.6)] backdrop-blur">
        <p className="text-sm text-slate-400">💡 Les modifications s'appliquent aux trois espaces après enregistrement.</p>
        <div className="flex gap-2">
          <Link to="/app/enia"><Btn variant="ghost"><Eye size={14} /> Aperçu</Btn></Link>
          <Btn onClick={persist} variant={saved ? "green" : "primary"}><Save size={15} /> {saved ? "Enregistré ✓" : "Enregistrer les modifications"}</Btn>
        </div>
      </div>
    </div>
  );
}
