import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Info, UserCircle2, BookOpen, Wallet, Medal, FileText, PlusCircle, Trash2, Save, ExternalLink,
  Upload, ImageOff, Megaphone, Handshake, ArrowUp, ArrowDown, AlertTriangle, Eye,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/utils/cn";
import { Btn, Card, Field, Input, Textarea, PageHead, Modal, readImage, uid, moveItem } from "@/lib/ui";
import { Avantage, Partner, Announcement } from "@/lib/types";
import responsableImg from "@/assets/responsable.jpg";
import { supabaseConfigured } from "@/lib/supabase/client";
import { savePublicContent } from "@/lib/supabase/content";
import { toast } from "sonner";

const TABS = [
  { k: "infos", l: "Informations", icon: <Info size={15} /> },
  { k: "responsable", l: "Responsable", icon: <UserCircle2 size={15} /> },
  { k: "formations", l: "Nos formations", icon: <BookOpen size={15} /> },
  { k: "frais", l: "Frais de formation", icon: <Wallet size={15} /> },
  { k: "avantages", l: "Avantages", icon: <Medal size={15} /> },
  { k: "partenaires", l: "Partenaires", icon: <Handshake size={15} /> },
  { k: "annonces", l: "Annonces", icon: <Megaphone size={15} /> },
  { k: "preinscription", l: "Pré-inscription", icon: <FileText size={15} /> },
];

export function ContentEditor() {
  const { db, update, log } = useStore();
  const s = db.settings;
  const [tab, setTab] = useState("infos");

  const [branding, setBranding] = useState({ ...s.branding });
  const [infos, setInfos] = useState({ ...s.infos, whatsapp: [...s.infos.whatsapp] });
  const [apropos, setApropos] = useState({ ...s.apropos });
  const [hero, setHero] = useState({ ...s.hero });
  const [formations, setFormations] = useState({ ...s.formations });
  const [frais, setFrais] = useState({
    inscription: s.frais.inscription,
    informatique: s.frais.informatique.map((f) => ({ ...f })),
    industriel: s.frais.industriel.map((f) => ({ ...f })),
  });
  const [avantages, setAvantages] = useState<Avantage[]>(s.avantages.map((a) => ({ ...a })));
  const [partenaires, setPartenaires] = useState<Partner[]>(s.partenaires.map((p) => ({ ...p })));
  const [annonces, setAnnonces] = useState<Announcement[]>(s.annonces.map((a) => ({ ...a })));
  const [pre, setPre] = useState({ ...s.preInscription });
  const [saved, setSaved] = useState(false);
  const [confirmDel, setConfirmDel] = useState<{ kind: "avantage" | "partenaire" | "annonce"; id: string; label: string } | null>(null);

  const persist = async () => {
    const nextSettings = {
      ...s,
      branding, infos, apropos, hero, formations,
      frais: {
        inscription: +frais.inscription || 0,
        informatique: frais.informatique.map((f) => ({ ...f, id: f.id || uid("FR"), modules: +f.modules || 0, montant: +f.montant || 0 })),
        industriel: frais.industriel.map((f) => ({ ...f, id: f.id || uid("FR"), modules: +f.modules || 0, montant: +f.montant || 0 })),
      },
      avantages: avantages.filter((a) => a.titre.trim()),
      partenaires: partenaires.filter((p) => p.nom.trim()),
      annonces: annonces.filter((a) => a.titre.trim()),
      preInscription: pre,
    };
    try {
      const persisted = supabaseConfigured ? await savePublicContent(nextSettings) : nextSettings;
      update((d) => ({ ...d, settings: persisted }));
      log("Contenu du site public mis à jour");
      setSaved(true);
      toast.success("Contenu public enregistré.");
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'enregistrer le contenu public.");
    }
  };

  /* ---------- images ---------- */
  const imgFor = async (file: File, maxW = 720) => readImage(file, maxW);

  /* ---------- avantages ---------- */
  const elAvantage = (a: Avantage, i: number) => (
    <div key={a.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="relative shrink-0">
          {a.image ? (
            <img src={a.image} alt="" className="h-20 w-28 rounded-xl border border-cyan-400/30 object-cover" />
          ) : (
            <div className="flex h-20 w-28 items-center justify-center rounded-xl border border-dashed border-white/15 text-slate-600"><Medal size={24} /></div>
          )}
          <label className="absolute -bottom-2 -right-2 cursor-pointer rounded-lg border border-cyan-400/40 bg-[#05070D] p-1.5 text-cyan-300 hover:bg-cyan-400/10" title="Remplacer l'image">
            <Upload size={12} />
            <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setAvantages(avantages.map((x) => (x.id === a.id ? { ...x, image: "" } : x))); if (f) { const img = await imgFor(f); setAvantages((prev) => prev.map((x) => (x.id === a.id ? { ...x, image: img } : x))); } }} />
          </label>
        </div>
        <div className="flex-1 space-y-2 min-w-60">
          <Input placeholder="Titre de l'avantage" value={a.titre} onChange={(e) => setAvantages(avantages.map((x) => (x.id === a.id ? { ...x, titre: e.target.value } : x)))} />
          <Input placeholder="Description courte (affichée sur le site)" value={a.description} onChange={(e) => setAvantages(avantages.map((x) => (x.id === a.id ? { ...x, description: e.target.value } : x)))} />
          <Textarea className="min-h-[60px]" placeholder="Explication détaillée" value={a.explication} onChange={(e) => setAvantages(avantages.map((x) => (x.id === a.id ? { ...x, explication: e.target.value } : x)))} />
          <Input placeholder="Informations supplémentaires (badge)" value={a.extra} onChange={(e) => setAvantages(avantages.map((x) => (x.id === a.id ? { ...x, extra: e.target.value } : x)))} />
        </div>
        <div className="flex flex-col gap-1.5">
          <button disabled={i === 0} onClick={() => setAvantages(moveItem(avantages, i, i - 1))} className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:text-cyan-300 disabled:opacity-30"><ArrowUp size={14} /></button>
          <button disabled={i === avantages.length - 1} onClick={() => setAvantages(moveItem(avantages, i, i + 1))} className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:text-cyan-300 disabled:opacity-30"><ArrowDown size={14} /></button>
          {a.image && <button onClick={() => setAvantages(avantages.map((x) => (x.id === a.id ? { ...x, image: "" } : x)))} className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-amber-300" title="Retirer l'image"><ImageOff size={14} /></button>}
          <button onClick={() => setConfirmDel({ kind: "avantage", id: a.id, label: a.titre || "cet avantage" })} className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:border-red-500/40 hover:text-red-400"><Trash2 size={14} /></button>
        </div>
      </div>
    </div>
  );

  /* ---------- partenaires ---------- */
  const elPartner = (p: Partner) => (
    <div key={p.id} className={cn("rounded-2xl border p-4", p.actif ? "border-white/10 bg-white/[0.02]" : "border-dashed border-amber-400/30 bg-white/[0.01] opacity-70")}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="relative shrink-0">
          {p.logo ? (
            <img src={p.logo} alt="" className="h-16 w-16 rounded-xl border border-cyan-400/30 object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-white/15 text-slate-600"><Handshake size={22} /></div>
          )}
          <label className="absolute -bottom-2 -right-2 cursor-pointer rounded-lg border border-cyan-400/40 bg-[#05070D] p-1.5 text-cyan-300 hover:bg-cyan-400/10" title="Ajouter / remplacer le logo">
            <Upload size={12} />
            <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const img = await imgFor(f, 300); setPartenaires((prev) => prev.map((x) => (x.id === p.id ? { ...x, logo: img } : x))); } }} />
          </label>
        </div>
        <div className="flex-1 space-y-2 min-w-60">
          <Input placeholder="Nom du partenaire" value={p.nom} onChange={(e) => setPartenaires(partenaires.map((x) => (x.id === p.id ? { ...x, nom: e.target.value } : x)))} />
          <Input placeholder="Description / rôle" value={p.description} onChange={(e) => setPartenaires(partenaires.map((x) => (x.id === p.id ? { ...x, description: e.target.value } : x)))} />
          <Input placeholder="Site web (optionnel)" value={p.site} onChange={(e) => setPartenaires(partenaires.map((x) => (x.id === p.id ? { ...x, site: e.target.value } : x)))} />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <button onClick={() => setPartenaires(partenaires.map((x) => (x.id === p.id ? { ...x, actif: !x.actif } : x)))}
            className={cn("relative h-6 w-12 rounded-full transition-all", p.actif ? "bg-emerald-500/70" : "bg-white/10")}>
            <span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition-all", p.actif ? "left-7" : "left-1")} />
          </button>
          <span className="text-[10px] uppercase tracking-wider text-slate-500">{p.actif ? "Visible" : "Masqué"}</span>
          <div className="flex gap-1.5">
            {p.logo && <button onClick={() => setPartenaires(partenaires.map((x) => (x.id === p.id ? { ...x, logo: "" } : x)))} className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-amber-300"><ImageOff size={13} /></button>}
            <button onClick={() => setConfirmDel({ kind: "partenaire", id: p.id, label: p.nom || "ce partenaire" })} className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:border-red-500/40 hover:text-red-400"><Trash2 size={13} /></button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ---------- annonces ---------- */
  const elAnnonce = (a: Announcement) => (
    <div key={a.id} className={cn("rounded-2xl border p-4", a.actif ? "border-cyan-400/25 bg-cyan-400/5" : "border-white/10 bg-white/[0.02] opacity-70")}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1 space-y-2 min-w-60">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="Titre de l'annonce" value={a.titre} onChange={(e) => setAnnonces(annonces.map((x) => (x.id === a.id ? { ...x, titre: e.target.value } : x)))} />
            <select value={a.type} onChange={(e) => setAnnonces(annonces.map((x) => (x.id === a.id ? { ...x, type: e.target.value as Announcement["type"] } : x)))}
              className="rounded-xl border border-white/10 bg-[#05070D]/80 px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400/60">
              <option value="info">Info</option><option value="important">Important</option><option value="offre">Offre</option>
            </select>
          </div>
          <Textarea className="min-h-[60px]" placeholder="Texte de l'annonce (défilera sur la page d'accueil)" value={a.body} onChange={(e) => setAnnonces(annonces.map((x) => (x.id === a.id ? { ...x, body: e.target.value } : x)))} />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <button onClick={() => setAnnonces(annonces.map((x) => (x.id === a.id ? { ...x, actif: !x.actif } : x)))}
            className={cn("relative h-6 w-12 rounded-full transition-all", a.actif ? "bg-emerald-500/70" : "bg-white/10")}>
            <span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition-all", a.actif ? "left-7" : "left-1")} />
          </button>
          <span className="text-[10px] uppercase tracking-wider text-slate-500">{a.actif ? "Active" : "Inactive"}</span>
          <button onClick={() => setConfirmDel({ kind: "annonce", id: a.id, label: a.titre || "cette annonce" })} className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:border-red-500/40 hover:text-red-400"><Trash2 size={13} /></button>
        </div>
      </div>
    </div>
  );

  const doDelete = () => {
    if (!confirmDel) return;
    if (confirmDel.kind === "avantage") setAvantages(avantages.filter((x) => x.id !== confirmDel.id));
    if (confirmDel.kind === "partenaire") setPartenaires(partenaires.filter((x) => x.id !== confirmDel.id));
    if (confirmDel.kind === "annonce") setAnnonces(annonces.filter((x) => x.id !== confirmDel.id));
    setConfirmDel(null);
  };

  return (
    <div>
      <PageHead
        title="Éditeur du site public"
        subtitle="Tout le contenu affiché sur le site est modifiable ici — sans toucher au code"
        actions={
          <>
            <Link to="/" target="_blank"><Btn variant="outline"><Eye size={15} /> Voir le site</Btn></Link>
            <Btn onClick={persist} variant={saved ? "green" : "primary"}><Save size={15} /> {saved ? "Enregistré ✓" : "Enregistrer"}</Btn>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={cn("flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all",
              tab === t.k ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-300 shadow-[0_0_20px_-8px_rgba(0,229,255,0.6)]" : "border-white/10 text-slate-400 hover:bg-white/5")}>
            {t.icon} {t.l}
          </button>
        ))}
      </div>

      {/* ============ INFORMATIONS ============ */}
      {tab === "infos" && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-display mb-4 text-sm font-bold text-white">Identité du centre</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom du centre"><Input value={branding.name} onChange={(e) => setBranding({ ...branding, name: e.target.value })} /></Field>
              <Field label="Badge / slogan"><Input value={branding.badge} onChange={(e) => setBranding({ ...branding, badge: e.target.value })} /></Field>
              <div className="sm:col-span-2">
                <Field label="Sous-titre"><Input value={branding.subtitle} onChange={(e) => setBranding({ ...branding, subtitle: e.target.value })} /></Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Phrase de présentation"><Textarea value={branding.tagline} onChange={(e) => setBranding({ ...branding, tagline: e.target.value })} /></Field>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-display mb-4 text-sm font-bold text-white">Informations pratiques</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Début de la formation"><Input value={infos.debut} onChange={(e) => setInfos({ ...infos, debut: e.target.value })} /></Field>
              <Field label="Durée"><Input value={infos.duree} onChange={(e) => setInfos({ ...infos, duree: e.target.value })} /></Field>
              <div className="sm:col-span-2">
                <Field label="Lieu"><Input value={infos.lieu} onChange={(e) => setInfos({ ...infos, lieu: e.target.value })} /></Field>
              </div>
              <Field label="Texte d'inscription"><Input value={infos.inscription} onChange={(e) => setInfos({ ...infos, inscription: e.target.value })} /></Field>
              <Field label="WhatsApp (un par ligne)">
                <Textarea value={infos.whatsapp.join("\n")} onChange={(e) => setInfos({ ...infos, whatsapp: e.target.value.split("\n").filter(Boolean) })} />
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-display mb-4 text-sm font-bold text-white">À propos / informations complémentaires</h3>
            <div className="space-y-4">
              <Field label="Titre"><Input value={apropos.titre} onChange={(e) => setApropos({ ...apropos, titre: e.target.value })} /></Field>
              <Field label="Texte"><Textarea className="min-h-[100px]" value={apropos.texte} onChange={(e) => setApropos({ ...apropos, texte: e.target.value })} /></Field>
            </div>
          </Card>
        </div>
      )}

      {/* ============ RESPONSABLE ============ */}
      {tab === "responsable" && (
        <Card className="max-w-2xl p-6">
          <h3 className="font-display mb-4 text-sm font-bold text-white">Responsable du centre</h3>
          <div className="mb-5 flex flex-wrap items-center gap-5">
            <div className="relative">
              <div className="h-32 w-32 overflow-hidden rounded-2xl border-2 border-amber-400/50">
                <img src={hero.responsibleImage || responsableImg} alt="Responsable" className="h-full w-full object-cover" />
              </div>
              <button onClick={() => setHero({ ...hero, responsibleImage: "" })} className="absolute -bottom-2 -right-2 rounded-lg border border-white/10 bg-[#05070D] p-2 text-slate-400 hover:text-red-400" title="Réinitialiser l'image"><ImageOff size={14} /></button>
            </div>
            <div>
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 px-4 py-2.5 text-sm font-bold text-cyan-300 hover:bg-cyan-400/10"><Upload size={15} /> Téléverser / remplacer la photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setHero({ ...hero, responsibleImage: await imgFor(f, 600) }); }} />
              </label>
              <p className="mt-2 text-[11px] text-slate-500">Photo du responsable affichée sur la page d'accueil.</p>
            </div>
          </div>
          <div className="space-y-4">
            <Field label="Nom du responsable"><Input value={hero.responsibleName} onChange={(e) => setHero({ ...hero, responsibleName: e.target.value })} /></Field>
            <Field label="Fonction"><Input value={hero.responsibleTitle} onChange={(e) => setHero({ ...hero, responsibleTitle: e.target.value })} /></Field>
            <Field label="Étiquette"><Input value={hero.highlight} onChange={(e) => setHero({ ...hero, highlight: e.target.value })} /></Field>
          </div>
        </Card>
      )}

      {/* ============ FORMATIONS ============ */}
      {tab === "formations" && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-display mb-4 text-sm font-bold text-red-400">GÉNIE INFORMATIQUE</h3>
            <div className="space-y-4">
              <Field label="Titre"><Input value={formations.informatique.titre} onChange={(e) => setFormations({ ...formations, informatique: { ...formations.informatique, titre: e.target.value } })} /></Field>
              <Field label="Description"><Textarea value={formations.informatique.description} onChange={(e) => setFormations({ ...formations, informatique: { ...formations.informatique, description: e.target.value } })} /></Field>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-display mb-4 text-sm font-bold text-cyan-300">GÉNIE INDUSTRIEL</h3>
            <div className="space-y-4">
              <Field label="Titre"><Input value={formations.industriel.titre} onChange={(e) => setFormations({ ...formations, industriel: { ...formations.industriel, titre: e.target.value } })} /></Field>
              <Field label="Description"><Textarea value={formations.industriel.description} onChange={(e) => setFormations({ ...formations, industriel: { ...formations.industriel, description: e.target.value } })} /></Field>
            </div>
          </Card>
          <Card className="flex items-center justify-between p-5" glow="none">
            <div>
              <p className="text-sm font-bold text-white">Modules, programmes & chapitres</p>
              <p className="text-xs text-slate-500">Chaque module possède une fiche détaillée (description, objectifs, programme, chapitres, image).</p>
            </div>
            <Link to="/app/modules"><Btn variant="outline"><BookOpen size={15} /> Gérer les modules</Btn></Link>
          </Card>
        </div>
      )}

      {/* ============ FRAIS ============ */}
      {tab === "frais" && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-display mb-4 text-sm font-bold text-white">Frais d'inscription</h3>
            <div className="max-w-xs">
              <Field label="Montant (FCFA)"><Input type="number" value={frais.inscription} onChange={(e) => setFrais({ ...frais, inscription: +e.target.value })} /></Field>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Ce montant est utilisé par le calcul automatique lors des inscriptions.</p>
          </Card>

          {([["informatique", "GÉNIE INFORMATIQUE", "red"], ["industriel", "GÉNIE INDUSTRIEL", "cyan"]] as const).map(([key, label, color]) => (
            <Card key={key} className="p-6">
              <h3 className={cn("font-display mb-4 text-sm font-bold", color === "red" ? "text-red-400" : "text-cyan-300")}>{label}</h3>
              <div className="space-y-2">
                {frais[key].map((f, i) => (
                  <div key={f.id || i} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                    <Input placeholder="Libellé (ex: 2 modules)" value={f.label} onChange={(e) => setFrais({ ...frais, [key]: frais[key].map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                    <Input type="number" placeholder="Nb modules" value={f.modules} onChange={(e) => setFrais({ ...frais, [key]: frais[key].map((x, j) => (j === i ? { ...x, modules: +e.target.value } : x)) })} />
                    <Input type="number" placeholder="Montant FCFA" value={f.montant} onChange={(e) => setFrais({ ...frais, [key]: frais[key].map((x, j) => (j === i ? { ...x, montant: +e.target.value } : x)) })} />
                    <Btn variant="ghost" onClick={() => setFrais({ ...frais, [key]: frais[key].filter((_, j) => j !== i) })}><Trash2 size={15} /></Btn>
                  </div>
                ))}
                <Btn variant="outline" onClick={() => setFrais({ ...frais, [key]: [...frais[key], { id: uid("FR"), label: "", modules: 0, montant: 0 }] })}>
                  <PlusCircle size={14} /> Ajouter une formule
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ============ AVANTAGES ============ */}
      {tab === "avantages" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Chaque avantage possède une image, un titre, une description, une explication et des infos supplémentaires. Réorganisez avec les flèches.</p>
            <Btn variant="outline" onClick={() => setAvantages([...avantages, { id: uid("AVG"), titre: "", description: "", explication: "", extra: "", image: "" }])}>
              <PlusCircle size={14} /> Ajouter un avantage
            </Btn>
          </div>
          {avantages.map(elAvantage)}
          {avantages.length === 0 && <p className="rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-slate-600">Aucun avantage — ajoutez-en un.</p>}
        </div>
      )}

      {/* ============ PARTENAIRES ============ */}
      {tab === "partenaires" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Gérez les partenaires institutionnels affichés sur le site. La suppression demande une confirmation.</p>
            <Btn variant="outline" onClick={() => setPartenaires([...partenaires, { id: uid("PTR"), nom: "", description: "", logo: "", site: "", actif: true }])}>
              <PlusCircle size={14} /> Ajouter un partenaire
            </Btn>
          </div>
          {partenaires.map(elPartner)}
          {partenaires.length === 0 && <p className="rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-slate-600">Aucun partenaire.</p>}
        </div>
      )}

      {/* ============ ANNONCES ============ */}
      {tab === "annonces" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Les annonces actives défilent en bandeau sur la page d'accueil du site.</p>
            <Btn variant="outline" onClick={() => setAnnonces([{ id: uid("ANN"), titre: "", body: "", date: new Date().toISOString().slice(0, 10), actif: true, type: "info" }, ...annonces])}>
              <PlusCircle size={14} /> Nouvelle annonce
            </Btn>
          </div>
          {annonces.map(elAnnonce)}
          {annonces.length === 0 && <p className="rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-slate-600">Aucune annonce.</p>}
        </div>
      )}

      {/* ============ PRÉ-INSCRIPTION ============ */}
      {tab === "preinscription" && (
        <Card className="max-w-2xl p-6">
          <h3 className="font-display mb-4 text-sm font-bold text-white">Bloc Pré-inscription</h3>
          <div className="mb-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div>
              <p className="text-sm font-bold text-slate-200">Formulaire de pré-inscription actif</p>
              <p className="text-[11px] text-slate-500">Le montant est calculé automatiquement selon les modules choisis.</p>
            </div>
            <button onClick={() => setPre({ ...pre, enabled: !pre.enabled })}
              className={cn("relative h-7 w-14 rounded-full transition-all", pre.enabled ? "bg-emerald-500/70" : "bg-white/10")}>
              <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white transition-all", pre.enabled ? "left-8" : "left-1")} />
            </button>
          </div>
          <div className="space-y-4">
            <Field label="Titre"><Input value={pre.title} onChange={(e) => setPre({ ...pre, title: e.target.value })} /></Field>
            <Field label="Description"><Textarea value={pre.description} onChange={(e) => setPre({ ...pre, description: e.target.value })} /></Field>
          </div>
          {!pre.enabled && <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 text-xs text-amber-300">⚠️ Le formulaire est actuellement masqué sur le site public.</div>}
        </Card>
      )}

      {/* confirmation de suppression */}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Confirmer la suppression">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10">
            <AlertTriangle size={26} className="text-red-400" />
          </div>
          <p className="text-sm text-slate-300">
            Voulez-vous vraiment supprimer <b className="text-white">{confirmDel?.label}</b> ?<br />
            <span className="text-xs text-slate-500">Cette action est définitive (protection contre les suppressions accidentelles).</span>
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Btn variant="ghost" onClick={() => setConfirmDel(null)}>Annuler</Btn>
            <Btn variant="red" onClick={doDelete}><Trash2 size={15} /> Supprimer définitivement</Btn>
          </div>
        </div>
      </Modal>

      {/* sticky save bar */}
      <div className="no-print sticky bottom-4 mt-6 flex items-center justify-between rounded-2xl border border-cyan-400/30 bg-[#081021]/95 px-5 py-3.5 shadow-[0_0_30px_-10px_rgba(0,229,255,0.6)] backdrop-blur">
        <p className="text-sm text-slate-400">💡 Pensez à enregistrer pour appliquer les modifications.</p>
        <div className="flex gap-2">
          <Link to="/"><Btn variant="ghost"><ExternalLink size={14} /> Aperçu</Btn></Link>
          <Btn onClick={persist} variant={saved ? "green" : "primary"}><Save size={15} /> {saved ? "Enregistré ✓" : "Enregistrer les modifications"}</Btn>
        </div>
      </div>
    </div>
  );
}
