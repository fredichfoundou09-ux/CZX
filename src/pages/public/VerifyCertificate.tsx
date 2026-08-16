import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Award, CheckCircle2, Search, ShieldCheck } from "lucide-react";
import { Badge, Btn, Card, Empty, Input, PageHead } from "@/lib/ui";
import { supabaseConfigured } from "@/lib/supabase/client";
import { verifyCertificate } from "@/lib/supabase/certificateVerification";

export default function VerifyCertificate() {
  const params = useParams();
  const [numero, setNumero] = useState(params.numero ?? "");
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async () => {
    if (!numero.trim()) return;
    if (!supabaseConfigured) { setError("La vérification Supabase n'est pas configurée."); return; }
    setLoading(true); setError(""); setRecord(null);
    try { const data = await verifyCertificate(numero); if (!data) setError("Aucun certificat officiel ne correspond à ce numéro."); else setRecord(data); }
    catch { setError("Impossible de vérifier le certificat actuellement."); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (params.numero) void search(); }, [params.numero]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <PageHead title="Vérifier un certificat" subtitle="Vérification publique des certificats SENTINELLES NUMÉRIQUES" />
      <Card className="p-6">
        <div className="flex gap-2">
          <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Numéro officiel du certificat" />
          <Btn onClick={search} disabled={loading}><Search size={15} /> {loading ? "Vérification..." : "Vérifier"}</Btn>
        </div>
      </Card>
      {error && <div className="mt-4"><Empty icon={<ShieldCheck size={36} />} title={error} /></div>}
      {record && (
        <Card className="mt-4 p-7 text-center" glow="green">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10"><CheckCircle2 size={30} className="text-emerald-300" /></div>
          <Badge color="green">Certificat authentique</Badge>
          <h2 className="font-display mt-3 text-2xl font-black text-white">{record.student_name}</h2>
          <p className="mt-1 text-sm text-cyan-300">{record.formation_name}</p>
          <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-2 text-left">
            <Info label="Numéro" value={record.numero} />
            <Info label="Date" value={record.issued_on} />
            <Info label="Période" value={record.periode} />
            <Info label="Résultat" value={`${record.resultat} - ${record.note}/20`} />
          </div>
          <Award size={18} className="mx-auto mt-5 text-amber-300" />
        </Card>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p><p className="mt-0.5 text-sm font-bold text-slate-200">{value}</p></div>;
}