import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ShieldCheck, LogIn, Menu, X, MessageCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils/cn";
import { useStore } from "@/lib/store";
import { Btn } from "@/lib/ui";

const LINKS = [
  { to: "/", label: "Accueil" },
  { to: "/formations", label: "Formations" },
  { to: "/tarifs", label: "Frais" },
  { to: "/pre-inscription", label: "Pré-inscription" },
];

export default function PublicLayout() {
  const { db, user } = useStore();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const s = db.settings;

  return (
    <div className="bg-night min-h-screen text-slate-100">
      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#05070D]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_20px_-4px_rgba(0,229,255,0.9)]">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <p className="font-display text-sm font-extrabold tracking-wide text-white sm:text-base">{s.branding.name}</p>
              <p className="hidden text-[10px] uppercase tracking-[0.25em] text-cyan-300 sm:block">{s.branding.badge}</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                    isActive ? "bg-cyan-400/10 text-cyan-300" : "text-slate-300 hover:bg-white/5 hover:text-white"
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Link to="/connexion" className="ml-2">
              <Btn variant={user ? "outline" : "primary"}>
                <LogIn size={16} /> {user ? "Mon espace" : "Se connecter"}
              </Btn>
            </Link>
          </nav>
          <button onClick={() => setOpen(!open)} className="rounded-lg border border-white/10 p-2 text-slate-200 md:hidden">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {open && (
          <nav className="border-t border-white/5 px-4 py-3 md:hidden">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5">
                {l.label}
              </NavLink>
            ))}
            <Link to="/connexion" onClick={() => setOpen(false)} className="mt-2 block rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-center text-sm font-bold text-white">
              {user ? "Mon espace" : "Se connecter"}
            </Link>
          </nav>
        )}
      </header>

      <Outlet />

      {/* footer */}
      <footer className="border-t border-white/5 bg-[#04060B]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck size={22} className="text-cyan-400" />
              <span className="font-display text-sm font-extrabold text-white">{s.branding.name}</span>
            </div>
            <p className="text-sm text-slate-400">{s.branding.subtitle}</p>
            <p className="mt-3 text-sm text-slate-500">{s.branding.tagline}</p>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Informations pratiques</p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>📅 Début : {s.infos.debut}</li>
              <li>📍 {s.infos.lieu}</li>
              <li>⏱️ Durée : {s.infos.duree}</li>
              <li className="flex items-center gap-2 text-emerald-300">
                <MessageCircle size={14} /> {s.infos.whatsapp.join(" / ")}
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Partenaires</p>
            <div className="flex flex-wrap gap-2">
              {s.partenaires.filter((p) => p.actif).map((p) => (
                <span key={p.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300">
                  {p.logo && <img src={p.logo} alt="" className="h-5 w-5 rounded object-cover" />}
                  {p.nom}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500">© {new Date().getFullYear()} {s.branding.name} — Tous droits réservés. {loc.pathname !== "/" && <Link to="/" className="text-cyan-400 hover:underline">Retour à l'accueil</Link>}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
