import { Link } from "react-router-dom";
import {
  ShieldCheck, CalendarDays, MapPin, Clock, MessageCircle, FileText, Lock, Cloud, Network,
  Cpu, Code2, Medal, Award, GraduationCap, TrendingUp, ChevronRight, UserCircle2, ArrowRight,
  BookOpen, Terminal,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { moduleIcon, money, Btn, SectionTitle, formationLabel } from "@/lib/ui";
import responsableImg from "@/assets/responsable.jpg";
import apprenantsImg from "@/assets/apprenants.jpg";

const codeLines = [
  { t: "const sentinel = new Academy();", c: "text-emerald-300" },
  { t: "sentinel.train('hackers_ethiques');", c: "text-cyan-300" },
  { t: "while (learning) { code(); }", c: "text-red-400" },
  { t: "if (success) bourse('3 ANS');", c: "text-amber-300" },
  { t: "// Génie Informatique + Industriel", c: "text-slate-500" },
  { t: "return 'AVENIR NUMÉRIQUE';", c: "text-emerald-300" },
];

export default function Home() {
  const { db } = useStore();
  const s = db.settings;
  const infos = s.infos;
  const infoModules = db.modules.filter((m) => m.formation === "informatique");
  const indModules = db.modules.filter((m) => m.formation === "industriel");
  const respImg = s.hero.responsibleImage || responsableImg;

  return (
    <div>
      {/* ============ HERO ============ */}
      <section className="bg-circuit scanlines relative overflow-hidden">
        <div className="bg-grid-hex pointer-events-none absolute inset-0 opacity-60" />
        <div className="bg-code pointer-events-none absolute inset-0 opacity-40" />

        {/* particles */}
        {[
          "left-[8%] top-[22%] h-1.5 w-1.5 bg-cyan-300", "left-[18%] top-[70%] h-1 w-1 bg-emerald-300",
          "left-[45%] top-[12%] h-1 w-1 bg-red-400", "right-[12%] top-[55%] h-1.5 w-1.5 bg-cyan-300",
          "right-[22%] top-[18%] h-1 w-1 bg-emerald-300", "left-[60%] top-[80%] h-1 w-1 bg-blue-400",
        ].map((c, i) => (
          <span key={i} className={`animate-pulse-glow pointer-events-none absolute rounded-full blur-[1px] ${c}`} />
        ))}

        <div className="relative mx-auto max-w-7xl px-4 pt-8 sm:px-6">
          {/* partner strip — dynamique */}
          <div className="mb-10 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
            {s.partenaires.filter((p) => p.actif).map((p) => (
              <div key={p.id} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-slate-200 backdrop-blur" title={p.description}>
                {p.logo ? <img src={p.logo} alt="" className="h-6 w-6 rounded-lg object-cover" /> : <GraduationCap size={18} className="text-cyan-300" />}
                {p.nom}
              </div>
            ))}
          </div>

          {/* annonces défilantes */}
          {s.annonces.filter((a) => a.actif).length > 0 && (
            <div className="mb-8 overflow-hidden rounded-xl border border-cyan-400/25 bg-[#0A1224]/70">
              <div className="animate-marquee flex w-max gap-12 whitespace-nowrap py-2.5 px-6">
                {[...s.annonces.filter((a) => a.actif), ...s.annonces.filter((a) => a.actif)].map((a, i) => (
                  <span key={i} className="flex items-center gap-2 text-sm">
                    <span className={`h-1.5 w-1.5 rounded-full ${a.type === "important" ? "bg-red-400" : a.type === "offre" ? "bg-emerald-300" : "bg-cyan-300"} animate-pulse-glow`} />
                    <b className="text-white">{a.titre}</b>
                    <span className="text-slate-400">{a.body}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid items-center gap-12 pb-16 lg:grid-cols-[1.15fr_1fr] lg:pb-24">
            {/* left */}
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300">
                <ShieldCheck size={13} className="animate-pulse-glow" /> {s.branding.badge}
              </div>
              <h1 className="font-display text-3xl font-black leading-tight text-white sm:text-4xl xl:text-5xl">
                {s.branding.name}
              </h1>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{s.branding.subtitle}</p>

              <div className="mt-7 space-y-1">
                <p className="font-display text-lg font-bold text-slate-100 sm:text-xl">CENTRE DE FORMATION EN</p>
                <p className="font-display text-3xl font-black leading-tight sm:text-4xl xl:text-5xl">
                  <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(0,140,255,0.5)]">GÉNIE INFORMATIQUE</span>
                </p>
                <p className="font-display text-2xl font-black leading-tight sm:text-3xl xl:text-4xl">
                  <span className="bg-gradient-to-r from-red-500 to-rose-400 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(255,23,68,0.5)]">ET GÉNIE INDUSTRIEL</span>
                </p>
              </div>

              <p className="mt-6 max-w-xl text-base text-slate-300 sm:text-lg">{s.branding.tagline}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/pre-inscription">
                  <Btn variant="primary" className="px-7 py-3 text-base"><FileText size={18} /> S'inscrire</Btn>
                </Link>
                <Link to="/formations">
                  <Btn variant="outline" className="px-7 py-3 text-base">Découvrir les formations <ChevronRight size={18} /></Btn>
                </Link>
              </div>

              {/* info chips */}
              <div className="mt-8 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { icon: <CalendarDays size={16} className="text-cyan-300" />, k: "Début", v: infos.debut },
                  { icon: <Clock size={16} className="text-blue-400" />, k: "Durée", v: infos.duree },
                  { icon: <MessageCircle size={16} className="text-emerald-300" />, k: "WhatsApp", v: infos.whatsapp[0] },
                ].map((c, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur">
                    <div className="flex items-center gap-2 text-xs text-slate-400">{c.icon}{c.k}</div>
                    <p className="mt-1 text-sm font-bold text-slate-100">{c.v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* right — responsable + laptop */}
            <div className="relative">
              {/* glow */}
              <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-cyan-500/15 via-transparent to-red-500/15 blur-2xl" />

              <div className="relative mx-auto max-w-md">
                {/* responsable card */}
                <div className="relative z-10 rounded-2xl border border-cyan-400/30 bg-[#081021]/90 p-4 shadow-[0_0_50px_-12px_rgba(0,229,255,0.5)] backdrop-blur">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-24 w-24 overflow-hidden rounded-2xl border-2 border-cyan-400/50">
                        <img src={respImg} alt="Responsable du centre" className="h-full w-full object-cover" />
                      </div>
                      <span className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-emerald-400/50 bg-[#05070D]">
                        <ShieldCheck size={14} className="text-emerald-300" />
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300">{s.hero.highlight}</p>
                      <p className="font-display mt-1 text-lg font-extrabold leading-tight text-amber-300 drop-shadow-[0_0_12px_rgba(255,179,0,0.45)]">{s.hero.responsibleName}</p>
                      <p className="mt-1 text-xs text-slate-400">{s.hero.responsibleTitle}</p>
                    </div>
                  </div>
                </div>

                {/* laptop with code */}
                <div className="relative z-10 -mt-2 ml-auto w-[88%]">
                  <div className="rounded-t-xl border border-b-0 border-white/10 bg-[#0A1224] p-3 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.8)]">
                    <div className="mb-2 flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                      <span className="ml-2 flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[9px] font-bold text-slate-400"><Terminal size={9} /> sentinelles@academy:~</span>
                    </div>
                    <div className="space-y-1 font-mono text-[10px] leading-relaxed sm:text-[11px]">
                      {codeLines.map((l, i) => (
                        <p key={i} className={l.c}>
                          <span className="text-slate-600">{String(i + 1).padStart(2, "0")}.</span> {l.t}
                        </p>
                      ))}
                      <p className="animate-caret inline-block h-3 w-2 bg-cyan-300 align-middle" />
                    </div>
                  </div>
                  <div className="h-3 rounded-b-xl border border-white/10 bg-gradient-to-b from-[#0A1224] to-[#060B18]" />
                </div>

                {/* floating icons */}
                <div className="animate-floaty absolute -left-3 top-16 z-20 rounded-xl border border-emerald-400/40 bg-[#05070D]/90 p-2.5 shadow-[0_0_20px_-6px_rgba(0,255,136,0.7)]">
                  <Lock size={18} className="text-emerald-300" />
                </div>
                <div className="animate-floaty-slow absolute -right-2 top-6 z-20 rounded-xl border border-cyan-400/40 bg-[#05070D]/90 p-2.5 shadow-[0_0_20px_-6px_rgba(0,229,255,0.7)]">
                  <Cloud size={18} className="text-cyan-300" />
                </div>
                <div className="animate-floaty absolute -right-1 bottom-24 z-20 rounded-xl border border-red-500/40 bg-[#05070D]/90 p-2.5 shadow-[0_0_20px_-6px_rgba(255,23,68,0.6)]">
                  <Network size={18} className="text-red-400" />
                </div>
                <div className="animate-floaty-slow absolute -left-1 bottom-8 z-20 rounded-xl border border-blue-500/40 bg-[#05070D]/90 p-2.5 shadow-[0_0_20px_-6px_rgba(0,140,255,0.7)]">
                  <Cpu size={18} className="text-blue-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ INFORMATIONS PRATIQUES ============ */}
      <section className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <SectionTitle color="cyan">Informations pratiques</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { icon: <CalendarDays size={22} className="text-cyan-300" />, t: "Début de la formation", v: infos.debut, b: "border-cyan-400/30" },
            { icon: <MapPin size={22} className="text-blue-400" />, t: "Lieu", v: infos.lieu, b: "border-blue-500/30" },
            { icon: <Clock size={22} className="text-red-400" />, t: "Durée", v: infos.duree, b: "border-red-500/30" },
            { icon: <MessageCircle size={22} className="text-emerald-300" />, t: "WhatsApp", v: infos.whatsapp.join("  •  "), b: "border-emerald-400/30" },
            { icon: <FileText size={22} className="text-amber-300" />, t: "Inscription", v: infos.inscription, b: "border-amber-400/30" },
          ].map((c, i) => (
            <div key={i} className={`rounded-2xl border ${c.b} bg-white/[0.03] p-5 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.05]`}>
              <div className="mb-3 inline-flex rounded-xl bg-white/5 p-2.5">{c.icon}</div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{c.t}</p>
              <p className="mt-1.5 text-sm font-bold text-slate-100">{c.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ FORMATIONS ============ */}
      <section className="relative border-y border-white/5 bg-[#04070F] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <SectionTitle color="cyan">Nos formations</SectionTitle>
            <h2 className="font-display text-2xl font-black text-white sm:text-4xl">Deux parcours, un même avenir</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-400">{s.branding.subtitle}</p>
          </div>

          <div className="grid gap-10 lg:grid-cols-2">
            {/* Informatique */}
            <div>
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-500/15 to-transparent p-4">
                <Code2 size={28} className="text-red-400" />
                <div>
                  <h3 className="font-display text-xl font-black text-red-400">{s.formations.informatique.titre}</h3>
                  <p className="text-xs text-slate-400">{s.formations.informatique.description}</p>
                </div>
              </div>
              <div className="space-y-4">
                {infoModules.map((m) => (
                  <div key={m.id} className="group rounded-2xl border border-red-500/20 bg-[#0A1224]/80 p-5 transition hover:border-red-500/50 hover:shadow-[0_0_30px_-10px_rgba(255,23,68,0.5)]">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-red-400">{moduleIcon(m.icon, "h-5 w-5")}</div>
                      <div>
                        <p className="font-mono text-[10px] font-bold tracking-[0.25em] text-red-400/80">MODULE {String(m.numero).padStart(2, "0")}</p>
                        <h4 className="font-display text-base font-bold text-white">{m.titre}</h4>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {m.notions.map((n, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400" /> {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Industriel */}
            <div>
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/15 to-transparent p-4">
                <BookOpen size={28} className="text-cyan-300" />
                <div>
                  <h3 className="font-display text-xl font-black text-cyan-300">{s.formations.industriel.titre}</h3>
                  <p className="text-xs text-slate-400">{s.formations.industriel.description}</p>
                </div>
              </div>
              <div className="space-y-4">
                {indModules.map((m) => (
                  <div key={m.id} className="group rounded-2xl border border-cyan-400/20 bg-[#0A1224]/80 p-5 transition hover:border-cyan-400/50 hover:shadow-[0_0_30px_-10px_rgba(0,229,255,0.5)]">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-2.5 text-cyan-300">{moduleIcon(m.icon, "h-5 w-5")}</div>
                      <div>
                        <p className="font-mono text-[10px] font-bold tracking-[0.25em] text-cyan-400/80">MODULE {String(m.numero).padStart(2, "0")}</p>
                        <h4 className="font-display text-base font-bold text-white">{m.titre}</h4>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {m.notions.map((n, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-400" /> {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FRAIS + AVANTAGES ============ */}
      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          {/* frais */}
          <div>
            <SectionTitle color="blue">Frais de formation</SectionTitle>
            <div className="rounded-2xl border border-cyan-400/25 bg-[#07152B]/80 p-6 shadow-[0_0_40px_-14px_rgba(0,140,255,0.6)]">
              <div className="mb-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-sm font-bold text-slate-200">Frais d'inscription</span>
                <span className="font-display text-lg font-black text-amber-300">{money(s.frais.inscription)}</span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-4">
                  <h4 className="font-display mb-3 text-sm font-black text-red-400">GÉNIE INFORMATIQUE</h4>
                  <ul className="space-y-2">
                    {s.frais.informatique.map((f) => (
                      <li key={f.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
                        <span className="text-slate-300">{f.label}</span>
                        <span className="font-bold text-red-300">{money(f.montant)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/5 p-4">
                  <h4 className="font-display mb-3 text-sm font-black text-cyan-300">GÉNIE INDUSTRIEL</h4>
                  <ul className="space-y-2">
                    {s.frais.industriel.map((f) => (
                      <li key={f.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
                        <span className="text-slate-300">{f.label}</span>
                        <span className="font-bold text-cyan-300">{money(f.montant)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <Link to="/pre-inscription" className="mt-5 block">
                <Btn className="w-full py-3">Pré-inscription en ligne <ArrowRight size={16} /></Btn>
              </Link>
            </div>
          </div>

          {/* avantages — entièrement dynamique */}
          <div id="avantages">
            <SectionTitle color="green">Avantages</SectionTitle>
            <div className="overflow-hidden rounded-2xl border border-emerald-400/25 bg-[#07152B]/80">
              <div className="space-y-3 p-6">
                {s.avantages.map((a, i) => (
                  <div key={a.id} className={`group rounded-xl border bg-white/[0.03] transition hover:bg-white/[0.05] ${i === 0 ? "border-amber-400/30" : i === 1 ? "border-cyan-400/30" : "border-emerald-400/30"}`}>
                    <div className="flex items-start gap-3 p-3.5">
                      {a.image ? (
                        <img src={a.image} alt="" className="h-14 w-20 shrink-0 rounded-lg border border-white/10 object-cover" />
                      ) : (
                        <div className="mt-0.5 shrink-0">
                          {i === 0 ? <Award size={20} className="text-amber-300" /> : i === 1 ? <Medal size={20} className="text-cyan-300" /> : <TrendingUp size={20} className="text-emerald-300" />}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white">{a.titre}</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-300">{a.description}</p>
                        {a.explication && <p className="mt-1 text-xs leading-relaxed text-slate-400">{a.explication}</p>}
                        {a.extra && <span className="mt-2 inline-block rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">{a.extra}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="relative">
                <img src={apprenantsImg} alt="Apprenants du centre" className="h-56 w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07152B] via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-black/70 px-3 py-1.5 backdrop-blur">
                  <GraduationCap size={15} className="text-cyan-300" />
                  <span className="text-xs font-bold text-white">ENIA 2.0 — L'avenir numérique</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ BOURSE BANNER ============ */}
      <section className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-cyan-400/30 bg-gradient-to-r from-[#07152B] via-[#0A1224] to-[#1a0a14] p-8 shadow-[0_0_60px_-16px_rgba(0,229,255,0.5)] sm:p-10">
          <div className="bg-grid-hex pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
                <GraduationCap size={38} className="text-cyan-300" />
              </div>
              <div>
                <p className="font-display text-4xl font-black tracking-wide text-white drop-shadow-[0_0_20px_rgba(0,229,255,0.6)] sm:text-5xl">
                  {s.bourse.title}
                </p>
                <p className="mt-2 text-lg font-bold uppercase tracking-[0.2em] text-emerald-300">{s.bourse.subtitle}</p>
              </div>
            </div>
            <div>
              <Link to="/pre-inscription">
                <Btn variant="red" className="animate-pulse-glow px-8 py-4 text-lg tracking-wide">{s.bourse.button}</Btn>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* formation chips */}
      <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><UserCircle2 size={14} /> {formationLabel("informatique")}</span>
          <span className="h-1 w-1 rounded-full bg-slate-600" />
          <span className="flex items-center gap-1.5"><UserCircle2 size={14} /> {formationLabel("industriel")}</span>
          <span className="h-1 w-1 rounded-full bg-slate-600" />
          <span>{infos.duree}</span>
          <span className="h-1 w-1 rounded-full bg-slate-600" />
          <span>Début : {infos.debut}</span>
        </div>
      </div>
    </div>
  );
}
