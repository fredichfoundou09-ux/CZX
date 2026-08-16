import { useEffect, useState } from "react";
import { GraduationCap, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { Card, PageHead, Empty } from "@/lib/ui";
import { supabaseConfigured } from "@/lib/supabase/client";
import { partnerService } from "@/lib/supabase/partner";

export default function PartnerTeachers() {
  const { db } = useStore();
  const [q, setQ] = useState("");
  const [teachers, setTeachers] = useState<any[]>([]);
  useEffect(() => {
    if (supabaseConfigured) partnerService.getTeachers().then(setTeachers).catch(() => setTeachers([]));
    else setTeachers(db.teachers);
  }, [db]);
  const filtered = teachers.filter((t) => `${t.nom} ${t.prenom} ${t.specialite}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <PageHead title="Enseignants" subtitle={`${filtered.length} formateur(s)`} />
      <Card className="p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="w-full rounded-xl border border-white/10 bg-[#05070D]/80 pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-400/60" placeholder="Rechercher..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((t) => (
          <Card key={t.id} className="p-5" glow="cyan">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30"><GraduationCap size={22} className="text-cyan-300" /></div>
              <div><p className="font-display text-sm font-bold text-white">{t.prenom} {t.nom}</p><p className="text-[11px] text-slate-400">{t.specialite}</p></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {db.modules.filter((m) => t.modules?.includes(m.id)).map((m) => <span key={m.id} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-slate-400">{m.numero}. {m.titre}</span>)}
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <Empty icon={<GraduationCap size={36} />} title="Aucun enseignant trouvé" />}
      </div>
    </div>
  );
}
