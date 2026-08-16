import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, BookOpen, Award, ShieldCheck, GraduationCap, BarChart3,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Card, Stat, PageHead, Badge } from "@/lib/ui";
import { listFormations } from "@/lib/supabase/formations";
import { supabaseConfigured } from "@/lib/supabase/client";
import { writeAudit } from "@/lib/supabase/audit";
import { partnerService } from "@/lib/supabase/partner";

export default function PartnerPortal() {
  const { db } = useStore();
  const [formations, setFormations] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    if (!supabaseConfigured) {
      // mode local fallback
      setFormations(db.modules);
      setCertificates(db.certificates);
      return;
    }
    const load = async () => {
      try {
        const [forms, certs, stats] = await Promise.all([listFormations(), partnerService.getCertificates(), partnerService.getDashboard()]);
        setFormations(forms);
        setCertificates(certs);
        setDashboard(stats);
        // Journalisation de l'accès partenaire (best-effort, ne bloque pas l'affichage)
        writeAudit("PARTNER_ACCESS", "portal", "Consultation du portail partenaire").catch(() => undefined);
      } catch (err) {
        console.error("Erreur de chargement partenaire :", err);
      }
    };
    void load();
  }, [db]);

  return (
    <div className="space-y-6">
      <PageHead
        title="Portail Partenaire"
        subtitle="Espace d'encadrement, d'évaluation et de consultation institutionnelle"
      />

      <Card className="border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-transparent to-transparent p-6" glow="cyan">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="font-display text-sm font-black text-white">LIAISON DE CONFIANCE</h3>
            <p className="mt-1 text-sm text-slate-300">
              Bienvenue sur la plateforme SENTINELLES NUMÉRIQUES. Ce portail vous offre un accès de consultation directe et sécurisée pour évaluer l'offre de formation, l'assiduité globale et les délibérés certifiés par ENIA 2.0.
            </p>
          </div>
        </div>
      </Card>

      {/* ---------- indicateurs ---------- */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon={<Users size={20} />} label="Apprenants suivis" value={dashboard?.total_students ?? db.students.length} color="cyan" />
        <Stat icon={<BookOpen size={20} />} label="Modules actifs" value={dashboard?.active_modules ?? db.modules.length} color="blue" />
        <Stat icon={<GraduationCap size={20} />} label="Enseignants" value={dashboard?.total_teachers ?? db.teachers.length} color="gold" />
        <Stat icon={<Award size={20} />} label="Certificats émis" value={dashboard?.total_certificates ?? certificates.length} color="green" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* ---------- catalogue de formation ---------- */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display flex items-center gap-2 text-sm font-bold text-white">
              <BookOpen size={16} className="text-cyan-300" /> Catalogue des formations
            </h3>
            <Link to="/app/modules" className="text-xs font-bold text-cyan-300 hover:underline">Consulter les fiches →</Link>
          </div>
          <div className="space-y-3">
            {formations.map((f, i) => (
              <div key={f.id || i} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-300">
                  <BarChart3 size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">{f.name || f.titre}</p>
                  <p className="truncate text-xs text-slate-400">{f.description || "Formation certifiée par ENIA 2.0"}</p>
                </div>
                <Badge color={i === 0 ? "red" : "cyan"}>{f.code || "Filière"}</Badge>
              </div>
            ))}
            {formations.length === 0 && <p className="text-center text-xs text-slate-600 py-3">Aucune formation active.</p>}
          </div>
        </Card>

        {/* ---------- certificats délibérés ---------- */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display flex items-center gap-2 text-sm font-bold text-white">
              <Award size={16} className="text-amber-300" /> Délibérés certifiés
            </h3>
          </div>
          <div className="space-y-2">
            {certificates.slice(0, 4).map((c) => {
              return (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-200">{c.formation_name || "Certificat institutionnel"}</p>
                    <p className="font-mono text-[10px] text-amber-300/80">{c.numero}</p>
                  </div>
                  <Badge color="gold">{c.resultat}</Badge>
                </div>
              );
            })}
            {certificates.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/10 p-5 text-center">
                <p className="text-xs text-slate-600">Aucun certificat officiel n'a encore été émis pour les apprenants de production.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <p className="text-center text-[10px] uppercase tracking-[0.25em] text-slate-600 flex items-center justify-center gap-1.5">
        <ShieldCheck size={11} /> Espace de consultation sécurisé réservé aux partenaires certifiés.
      </p>
    </div>
  );
}
