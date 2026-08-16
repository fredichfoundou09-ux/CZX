import { useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap, ExternalLink, Image as ImageIcon, Maximize2, Download, X, Sparkles,
  Wallet, FileCheck2, Handshake, ChevronRight, Info, BadgeDollarSign, ShieldCheck,
  CheckCircle2, ZoomIn, ZoomOut, PenSquare, Lock, BookOpen, Users,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Btn, Card, Badge, PageHead, SectionTitle, Empty, safeExternalUrl } from "@/lib/ui";
import afficheDefaut from "@/assets/enia-affiche.jpg";

/* =========================================================
   MODULE ENIA 2.0 — consultation (Admin / Formateur / Apprenant)
   Lecture seule pour Formateur & Apprenant (RBAC).
   ========================================================= */
export function EniaPage() {
  const { db, user } = useStore();
  const e = db.settings.enia;
  const partenaires = db.settings.partenaires
    .filter((p) => p.actif)
    .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
  const canManage = user?.role === "superadmin" || user?.role === "admin";
  const [zoom, setZoom] = useState(false);
  const [scale, setScale] = useState(1);
  const affiche = e.affiche || afficheDefaut;

  if (!e.enabled && !canManage) {
    return (
      <div>
        <PageHead title="ENIA 2.0" />
        <Empty icon={<Lock size={40} />} title="Module non disponible" sub="Ce contenu n'est pas publié actuellement." />
      </div>
    );
  }

  const openLink = () => {
    const url = safeExternalUrl(e.lien.url);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      <PageHead
        title="ENIA 2.0"
        subtitle={e.sousTitre}
        actions={
          <>
            {!e.enabled && canManage && <Badge color="gold">Non publié</Badge>}
            {canManage && (
              <Link to="/app/enia-admin"><Btn variant="outline"><PenSquare size={15} /> Gérer le contenu</Btn></Link>
            )}
            {e.lien.actif && e.lien.url && (
              <Btn onClick={openLink}><ExternalLink size={15} /> Visiter ENIA 2.0</Btn>
            )}
          </>
        }
      />

      {/* ---------- carte de présentation ---------- */}
      <Card className="mb-5 overflow-hidden" glow="cyan">
        <div className="bg-grid-hex relative p-6 sm:p-7">
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 shadow-[0_0_25px_-8px_rgba(0,229,255,0.6)]">
              <GraduationCap size={30} className="text-cyan-300" />
            </div>
            <div className="min-w-60 flex-1">
              <h2 className="font-display text-2xl font-black text-white">{e.nom}</h2>
              <p className="mt-0.5 text-sm font-semibold uppercase tracking-[0.15em] text-cyan-300">{e.sousTitre}</p>
              <p className="mt-3 max-w-2xl text-sm text-slate-300">{e.accroche}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href="#enia-bourse"><Btn variant="primary"><Sparkles size={15} /> Découvrir</Btn></a>
                {e.lien.actif && e.lien.url ? (
                  <Btn variant="outline" onClick={openLink}><ExternalLink size={15} /> Site ENIA</Btn>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-500">
                    <ExternalLink size={15} /> Lien non configuré
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr]">
        {/* ---------- affiche ---------- */}
        <Card className="overflow-hidden" glow="cyan">
          <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-5 py-3">
            <h3 className="font-display flex items-center gap-2 text-sm font-bold text-white">
              <ImageIcon size={15} className="text-cyan-300" /> Affiche officielle
            </h3>
            <div className="flex gap-1.5">
              <button onClick={() => { setZoom(true); setScale(1); }} title="Plein écran"
                className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300">
                <Maximize2 size={14} />
              </button>
              {e.afficheTelechargeable && (
                <a href={affiche} download="ENIA-2.0-affiche.jpg" title="Télécharger"
                  className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:border-emerald-400/40 hover:text-emerald-300">
                  <Download size={14} />
                </a>
              )}
            </div>
          </div>
          <button onClick={() => { setZoom(true); setScale(1); }} className="group relative block w-full">
            <img src={affiche} alt="Affiche ENIA 2.0" className="max-h-[560px] w-full object-contain bg-black/30" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
              <span className="flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-[#05070D]/90 px-4 py-2 text-xs font-bold text-cyan-300">
                <ZoomIn size={14} /> Agrandir
              </span>
            </span>
          </button>
        </Card>

        <div className="space-y-5">
          {/* ---------- présentation ---------- */}
          <Card className="p-6">
            <SectionTitle color="cyan">{e.presentationTitre}</SectionTitle>
            <p className="text-sm leading-relaxed text-slate-300">{e.presentation}</p>
          </Card>

          {/* ---------- highlights ---------- */}
          <Card className="overflow-hidden" glow="green">
            <div className="border-b border-emerald-400/20 bg-gradient-to-r from-emerald-400/10 to-transparent px-5 py-3">
              <h3 className="font-display flex items-center gap-2 text-sm font-black tracking-wide text-emerald-300">
                <BadgeDollarSign size={16} /> {e.highlightTitre}
              </h3>
            </div>
            <div className="space-y-2 p-5">
              {e.highlights.map((h) => (
                <div key={h.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10 font-display text-sm font-black text-emerald-300">
                    {h.numero}
                  </span>
                  <span className="text-sm font-semibold text-slate-200">{h.texte}</span>
                </div>
              ))}
              <p className="pt-1 text-center text-[11px] uppercase tracking-[0.2em] text-slate-500">{e.sousTitre}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* ---------- bourse ---------- */}
      <div id="enia-bourse" className="mt-5">
        <Card className="p-6" glow="gold">
          <SectionTitle color="gold">{e.bourse.titre}</SectionTitle>
          <p className="text-sm text-slate-300">{e.bourse.intro}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {e.bourse.avantages.map((a) => (
              <div key={a.id} className="flex items-start gap-2.5 rounded-xl border border-amber-400/15 bg-amber-400/5 px-3.5 py-2.5">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-amber-300" />
                <span className="text-xs text-slate-200">{a.texte}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
            <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
              <Info size={13} /> {e.bourse.concretementTitre}
            </p>
            <p className="text-sm text-slate-300">{e.bourse.concretement}</p>
          </div>
        </Card>
      </div>

      {/* ---------- frais + pièces ---------- */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="border-b border-white/5 bg-white/[0.02] px-5 py-3">
            <h3 className="font-display flex items-center gap-2 text-sm font-bold text-white">
              <Wallet size={15} className="text-blue-400" /> {e.fraisTitre}
            </h3>
          </div>
          {e.frais.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">Aucun frais renseigné.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  <th className="px-5 py-2.5">Élément</th>
                  <th className="px-5 py-2.5 text-right">Information</th>
                </tr>
              </thead>
              <tbody>
                {e.frais.map((f) => (
                  <tr key={f.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-5 py-2.5 text-sm text-slate-300">{f.label}</td>
                    <td className="px-5 py-2.5 text-right text-sm font-bold text-white">{f.valeur}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="overflow-hidden" glow="red">
          <div className="border-b border-white/5 bg-white/[0.02] px-5 py-3">
            <h3 className="font-display flex items-center gap-2 text-sm font-bold text-white">
              <FileCheck2 size={15} className="text-red-400" /> {e.piecesTitre}
            </h3>
          </div>
          <div className="space-y-3 p-5">
            {e.pieces.map((g) => (
              <div key={g.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                <p className="text-sm font-bold text-slate-100">{g.titre}</p>
                <ul className="mt-2 space-y-1">
                  {g.items.map((it, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400" /> {it}
                    </li>
                  ))}
                </ul>
                {g.frais && (
                  <p className="mt-2 inline-block rounded-lg border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                    {g.frais}
                  </p>
                )}
              </div>
            ))}
            {e.piecesNote && (
              <p className="rounded-xl border border-red-500/25 bg-red-500/5 p-3 text-xs font-semibold text-red-300">
                ⚠️ {e.piecesNote}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* ---------- lien officiel + partenaires ---------- */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Card className="p-6" glow="cyan">
          <SectionTitle color="cyan">Lien officiel</SectionTitle>
          <p className="text-sm font-bold text-white">{e.lien.nom}</p>
          <p className="mt-1 text-xs text-slate-400">{e.lien.description}</p>
          {e.lien.actif && e.lien.url ? (
            <>
              <p className="mt-2 truncate font-mono text-[11px] text-cyan-300">{e.lien.url}</p>
              <Btn className="mt-4 w-full" onClick={openLink}><ExternalLink size={15} /> VISITER ENIA 2.0</Btn>
            </>
          ) : (
            <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-slate-500">
              Le lien n'est pas encore configuré par l'administration.
            </p>
          )}
        </Card>

        <Card className="p-6">
          <SectionTitle color="green">Partenaires</SectionTitle>
          {partenaires.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun partenaire publié.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {partenaires.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  {p.logo ? (
                    <img src={p.logo} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-500">
                      <Handshake size={16} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-200">{p.nom}</p>
                    <p className="truncate text-[10px] text-slate-500">{p.description}</p>
                  </div>
                  {safeExternalUrl(p.site) && (
                    <a href={safeExternalUrl(p.site)!} target="_blank" rel="noopener noreferrer" title="Visiter"
                      className="shrink-0 rounded-lg border border-white/10 p-1.5 text-slate-400 transition hover:border-cyan-400/40 hover:text-cyan-300">
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ---------- passerelles vers les autres modules ---------- */}
      <Card className="mt-5 p-5">
        <h3 className="font-display mb-3 text-sm font-bold text-white">Poursuivre mon parcours</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { to: "/pre-inscription", l: "Pré-inscription", i: <FileCheck2 size={16} />, ext: true },
            { to: user?.role === "student" ? "/app/ma-bourse" : "/app/bourses", l: "Bourses", i: <BadgeDollarSign size={16} /> },
            { to: user?.role === "student" ? "/app/mes-modules" : "/app/modules", l: "Formations", i: <BookOpen size={16} /> },
            { to: "/app/notifications", l: "Notifications", i: <Users size={16} /> },
          ].map((a, i) =>
            a.ext ? (
              <a key={i} href={`#${a.to}`} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-sm font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300">
                {a.i} {a.l}
              </a>
            ) : (
              <Link key={i} to={a.to} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-sm font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300">
                {a.i} {a.l}
              </Link>
            )
          )}
        </div>
      </Card>

      {!canManage && (
        <p className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-600">
          <ShieldCheck size={12} /> Consultation seule — les informations sont gérées par l'administration.
        </p>
      )}

      {/* ---------- visionneuse plein écran ---------- */}
      {zoom && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="font-display text-sm font-bold text-white">Affiche {e.nom}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setScale((s) => Math.max(0.5, s - 0.25))} className="rounded-lg border border-white/10 p-2 text-slate-300 hover:text-cyan-300"><ZoomOut size={16} /></button>
              <span className="w-12 text-center font-mono text-xs text-slate-400">{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale((s) => Math.min(4, s + 0.25))} className="rounded-lg border border-white/10 p-2 text-slate-300 hover:text-cyan-300"><ZoomIn size={16} /></button>
              {e.afficheTelechargeable && (
                <a href={affiche} download="ENIA-2.0-affiche.jpg" className="rounded-lg border border-white/10 p-2 text-slate-300 hover:text-emerald-300"><Download size={16} /></a>
              )}
              <button onClick={() => setZoom(false)} className="rounded-lg border border-red-500/30 p-2 text-red-400 hover:bg-red-500/10"><X size={16} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <img src={affiche} alt="Affiche ENIA 2.0" className="mx-auto origin-top transition-transform" style={{ transform: `scale(${scale})` }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* petit lien de navigation interne réutilisé */
export function EniaShortcut() {
  return (
    <Link to="/app/enia" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-sm font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300">
      <GraduationCap size={16} /> ENIA 2.0 <ChevronRight size={14} className="ml-auto" />
    </Link>
  );
}
