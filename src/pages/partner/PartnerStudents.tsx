import { useEffect, useState } from "react";
import { Users, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { Card, PageHead, Badge, Empty } from "@/lib/ui";
import { supabaseConfigured } from "@/lib/supabase/client";
import { partnerService } from "@/lib/supabase/partner";

export default function PartnerStudents() {
  const { db } = useStore();
  const [q, setQ] = useState("");
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    if (supabaseConfigured) {
      partnerService.getStudents().then(setStudents).catch(() => setStudents([]));
    } else {
      setStudents(db.students.map((s) => ({ id: s.id, nom: s.nom, prenom: s.prenom, statut: s.statut, date_inscription: s.dateInscription })));
    }
  }, [db]);

  const filtered = students.filter((s) => `${s.nom} ${s.prenom} ${s.id}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <PageHead title="Apprenants" subtitle={`Liste des apprenants • ${filtered.length} résultat(s)`} />
      <Card className="p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="w-full rounded-xl border border-white/10 bg-[#05070D]/80 pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-400/60" placeholder="Rechercher..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left">
          <thead>
            <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <th className="px-4 py-3">N° Apprenant</th><th className="px-4 py-3">Nom</th><th className="px-4 py-3">Prénom</th><th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-xs text-cyan-300">{s.id}</td>
                <td className="px-4 py-3 text-sm font-bold text-white">{s.nom}</td>
                <td className="px-4 py-3 text-sm text-slate-300">{s.prenom}</td>
                <td className="px-4 py-3"><Badge color={s.statut === "actif" ? "green" : "red"}>{s.statut}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <Empty icon={<Users size={36} />} title="Aucun apprenant trouvé" />}
      </Card>
    </div>
  );
}
