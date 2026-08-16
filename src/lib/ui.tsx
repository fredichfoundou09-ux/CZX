import React, { ReactNode } from "react";
import DOMPurify from "dompurify";
import {
  Code2, Network, Server, Terminal, ShieldCheck, Sigma, Lock, Cog, Zap, Cpu, Plug,
  Factory, Waves, GitBranch, Ruler, Binary, AudioWaveform, Calculator, Wrench, FolderLock,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Formation } from "./types";

/* ---------- helpers ---------- */
export const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const fmt = (n: number) => n.toLocaleString("fr-FR");

export const money = (n: number) => `${fmt(n)} FCFA`;

export const formationLabel = (f: Formation) => (f === "informatique" ? "Génie Informatique" : "Génie Industriel");

export const today = () => new Date().toISOString().slice(0, 10);

/* ---------- calcul automatique du montant selon les modules choisis ---------- */
export function calcFee(
  frais: { inscription: number; informatique: { label: string; modules: number; montant: number }[]; industriel: { label: string; modules: number; montant: number }[] },
  formation: Formation,
  count: number
): { montant: number; formule: string } {
  if (count <= 0) return { montant: 0, formule: "Aucun module" };
  const rows = [...(formation === "informatique" ? frais.informatique : frais.industriel)].sort((a, b) => a.modules - b.modules);
  const exact = rows.find((r) => r.modules === count);
  if (exact) return { montant: exact.montant, formule: exact.label };
  const next = rows.find((r) => r.modules > count);
  if (next) return { montant: next.montant, formule: `Pack ${next.label}` };
  const last = rows[rows.length - 1];
  if (last) return { montant: last.montant, formule: `Pack ${last.label}` };
  return { montant: 0, formule: "Sur devis" };
}

/* ---------- total dû par un apprenant ---------- */
export function totalDue(
  frais: { inscription: number; informatique: { label: string; modules: number; montant: number }[]; industriel: { label: string; modules: number; montant: number }[] },
  formation: Formation,
  count: number
) {
  return frais.inscription + calcFee(frais, formation, count).montant;
}

/* ---------- réorganisation de listes ---------- */
export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function readImage(file: File, maxW = 700): Promise<string> {
  return new Promise((resolve, reject) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) return reject(new Error("Format d'image non autorisé."));
    if (file.size > 8 * 1024 * 1024) return reject(new Error("Image trop volumineuse (8 Mo maximum)."));
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDimension = Math.max(img.width, img.height);
        const scale = Math.min(1, maxW / maxDimension);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(String(reader.result));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => resolve(String(reader.result));
      img.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function printHTML(title: string, body: string) {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  const safeTitle = title.replace(/[<>&"']/g, "");
  const safeBody = DOMPurify.sanitize(body, {
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  });
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title>
  <style>
    *{box-sizing:border-box;font-family:'Segoe UI',Arial,sans-serif}
    body{margin:0;background:#05070D;color:#F5F7FA;padding:32px}
    .receipt{max-width:720px;margin:0 auto;background:#0A1224;border:1px solid #00E5FF;border-radius:16px;padding:32px}
    h1,h2,h3{margin:0 0 8px}
    .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #1d2b45}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .label{color:#8A94A6;font-size:12px;text-transform:uppercase;letter-spacing:1px}
    .accent{color:#00E5FF}.gold{color:#FFB300}.red{color:#FF1744}.green{color:#00FF88}
    @media print{body{background:#fff;color:#000}.receipt{background:#fff;border:2px solid #000;color:#000}}
  </style></head><body>${safeBody}<script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`);
  w.document.close();
}

/** Accepte uniquement des URLs HTTP(S) externes. */
export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export const moduleIcon = (key: string, className = "h-5 w-5") => {
  const map: Record<string, ReactNode> = {
    code: <Code2 className={className} />,
    network: <Network className={className} />,
    server: <Server className={className} />,
    terminal: <Terminal className={className} />,
    shield: <ShieldCheck className={className} />,
    sigma: <Sigma className={className} />,
    lock: <Lock className={className} />,
    folder: <FolderLock className={className} />,
    cog: <Cog className={className} />,
    zap: <Zap className={className} />,
    cpu: <Cpu className={className} />,
    plug: <Plug className={className} />,
    factory: <Factory className={className} />,
    waves: <Waves className={className} />,
    git: <GitBranch className={className} />,
    ruler: <Ruler className={className} />,
    binary: <Binary className={className} />,
    audio: <AudioWaveform className={className} />,
    calc: <Calculator className={className} />,
    wrench: <Wrench className={className} />,
  };
  return map[key] ?? <Code2 className={className} />;
};

/* ---------- primitives ---------- */
export function Card({ children, className, glow = "cyan" }: { children: ReactNode; className?: string; glow?: "cyan" | "red" | "green" | "gold" | "none" }) {
  const g =
    glow === "red"
      ? "border-red-500/25 hover:shadow-[0_0_28px_-8px_rgba(255,23,68,0.5)]"
      : glow === "green"
      ? "border-emerald-400/25 hover:shadow-[0_0_28px_-8px_rgba(0,255,136,0.5)]"
      : glow === "gold"
      ? "border-amber-400/25 hover:shadow-[0_0_28px_-8px_rgba(255,179,0,0.5)]"
      : glow === "none"
      ? "border-white/10"
      : "border-cyan-400/25 hover:shadow-[0_0_28px_-8px_rgba(0,229,255,0.5)]";
  return (
    <div className={cn("rounded-2xl border bg-[#0A1224]/80 backdrop-blur-sm transition-all duration-300", g, className)}>
      {children}
    </div>
  );
}

export function Btn({
  children, onClick, variant = "primary", className, type = "button", disabled,
}: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "red" | "green" | "ghost" | "outline";
  className?: string; type?: "button" | "submit"; disabled?: boolean;
}) {
  const v = {
    primary: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_-4px_rgba(0,229,255,0.6)] hover:brightness-110",
    red: "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_20px_-4px_rgba(255,23,68,0.6)] hover:brightness-110",
    green: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_20px_-4px_rgba(0,255,136,0.5)] hover:brightness-110",
    ghost: "bg-white/5 text-slate-200 hover:bg-white/10 border border-white/10",
    outline: "bg-transparent text-cyan-300 border border-cyan-400/40 hover:bg-cyan-400/10",
  }[variant];
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      className={cn("inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none", v, className)}>
      {children}
    </button>
  );
}

export function Badge({ children, color = "cyan", className }: { children: ReactNode; color?: "cyan" | "red" | "green" | "gold" | "gray" | "blue"; className?: string }) {
  const c = {
    cyan: "bg-cyan-400/10 text-cyan-300 border-cyan-400/30",
    red: "bg-red-500/10 text-red-400 border-red-500/30",
    green: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30",
    gold: "bg-amber-400/10 text-amber-300 border-amber-400/30",
    gray: "bg-white/5 text-slate-300 border-white/10",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  }[color];
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider", c, className)}>{children}</span>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-white/10 bg-[#05070D]/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all focus:border-cyan-400/60 focus:shadow-[0_0_16px_-6px_rgba(0,229,255,0.5)]";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputCls, "appearance-none", props.className)} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputCls, "min-h-[90px]", props.className)} />;
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative max-h-[92vh] w-full overflow-y-auto rounded-2xl border border-cyan-400/30 bg-[#081021] p-6 shadow-[0_0_60px_-12px_rgba(0,229,255,0.4)]", wide ? "max-w-4xl" : "max-w-lg")}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="font-display text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="rounded-lg border border-white/10 px-2.5 py-1 text-slate-400 hover:bg-white/10 hover:text-white">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Stat({ icon, label, value, color = "cyan", sub }: { icon: ReactNode; label: string; value: ReactNode; color?: "cyan" | "red" | "green" | "gold" | "blue"; sub?: string }) {
  const c = {
    cyan: "text-cyan-300 bg-cyan-400/10 border-cyan-400/30",
    red: "text-red-400 bg-red-500/10 border-red-500/30",
    green: "text-emerald-300 bg-emerald-400/10 border-emerald-400/30",
    gold: "text-amber-300 bg-amber-400/10 border-amber-400/30",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  }[color];
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="font-display mt-1.5 text-2xl font-bold text-white">{value}</p>
          {sub && <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>}
        </div>
        <div className={cn("rounded-xl border p-2.5", c)}>{icon}</div>
      </div>
    </Card>
  );
}

export function PageHead({ title, subtitle, actions }: { title: ReactNode; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Empty({ icon, title, sub }: { icon: ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-14 text-center">
      <div className="mb-3 text-slate-600">{icon}</div>
      <p className="font-semibold text-slate-300">{title}</p>
      {sub && <p className="mt-1 max-w-sm text-sm text-slate-500">{sub}</p>}
    </div>
  );
}

export function Progress({ value, color = "cyan" }: { value: number; color?: "cyan" | "red" | "green" | "gold" }) {
  const c = { cyan: "from-cyan-400 to-blue-500", red: "from-red-500 to-rose-500", green: "from-emerald-400 to-teal-500", gold: "from-amber-300 to-orange-400" }[color];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
      <div className={cn("h-full rounded-full bg-gradient-to-r transition-all", c)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function SectionTitle({ children, color = "cyan" }: { children: ReactNode; color?: "cyan" | "red" | "green" | "blue" | "gold" }) {
  const c = {
    cyan: "text-cyan-300 border-cyan-400/30",
    red: "text-red-400 border-red-500/30",
    green: "text-emerald-300 border-emerald-400/30",
    blue: "text-blue-400 border-blue-500/30",
    gold: "text-amber-300 border-amber-400/30",
  }[color];
  return (
    <div className={cn("mb-4 inline-flex items-center gap-2 rounded-full border bg-white/[0.03] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em]", c)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      {children}
    </div>
  );
}

/* ---------- garde de permission d'interface ---------- */
const READ_ONLY_ROLES = ["partner", "partner_admin"];

/** Masque les actions d'écriture pour les rôles en lecture seule (défense en profondeur UI). */
export function Can({ role, write = false, children }: { role: string | undefined; write?: boolean; children: ReactNode }) {
  if (write && role && READ_ONLY_ROLES.includes(role)) return null;
  return <>{children}</>;
}

export function isReadOnly(role: string | undefined) {
  return !!role && READ_ONLY_ROLES.includes(role);
}
