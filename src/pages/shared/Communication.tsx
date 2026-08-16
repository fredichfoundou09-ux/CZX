import { useMemo, useState } from "react";
import { Send, Mail, Bell, CheckCheck, Users, UserCircle2, Inbox, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/utils/cn";
import { Btn, Card, Field, Input, Textarea, Empty, PageHead, Badge, uid, today } from "@/lib/ui";

const notifColor: Record<string, string> = {
  info: "border-cyan-400/30 text-cyan-300",
  paiement: "border-amber-400/30 text-amber-300",
  test: "border-red-500/30 text-red-400",
  inscription: "border-emerald-400/30 text-emerald-300",
  certif: "border-blue-500/30 text-blue-400",
  bourse: "border-amber-400/30 text-amber-300",
};

export function MessageCenter() {
  const { db, user, update, userName, log } = useStore();
  const [mode, setMode] = useState<"inbox" | "new">("inbox");
  const [to, setTo] = useState("all_students");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const mine = db.messages
    .filter((m) => m.toId === user!.id || m.fromId === user!.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    const msg = { id: uid("MSG"), fromId: user!.id, fromName: user!.name, toId: to, subject, body, date: today(), lu: false };
    update((d) => ({ ...d, messages: [msg, ...d.messages] }));
    if (to !== "all_students" && to !== "all_teachers") {
      update((d) => ({ ...d, notifications: [{ id: uid("NTF"), toId: to, title: `Nouveau message : ${subject}`, body, date: today(), lu: false, type: "info" }, ...d.notifications] }));
    }
    log(`Message envoyé à ${userName(to)} : ${subject}`);
    setSubject(""); setBody(""); setMode("inbox");
  };

  const targets = useMemo(() => {
    const opts: { id: string; label: string; icon: React.ReactNode }[] = [];
    if (["superadmin", "admin", "teacher"].includes(user!.role)) opts.push({ id: "all_students", label: "Tous les apprenants", icon: <Users size={14} /> });
    if (["superadmin", "admin"].includes(user!.role)) opts.push({ id: "all_teachers", label: "Tous les enseignants", icon: <UserCircle2 size={14} /> });
    db.users.filter((u) => u.id !== user!.id).forEach((u) => opts.push({ id: u.id, label: u.name, icon: <UserCircle2 size={14} /> }));
    return opts;
  }, [db.users, user]);

  return (
    <div>
      <PageHead
        title="Messagerie interne"
        subtitle="Messages privés, groupes et annonces"
        actions={
          <Btn onClick={() => setMode(mode === "inbox" ? "new" : "inbox")}>
            {mode === "inbox" ? <><Send size={16} /> Nouveau message</> : <><Inbox size={16} /> Boîte de réception</>}
          </Btn>
        }
      />

      {mode === "new" ? (
        <Card className="mx-auto max-w-2xl p-6">
          <form onSubmit={send} className="space-y-4">
            <Field label="Destinataire">
              <div className="grid max-h-52 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">
                {targets.map((t) => (
                  <button type="button" key={t.id} onClick={() => setTo(t.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-all",
                      to === t.id ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200" : "border-white/10 text-slate-300 hover:bg-white/5"
                    )}>
                    {t.icon} <span className="truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Objet"><Input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Objet du message" /></Field>
            <Field label="Message"><Textarea required value={body} onChange={(e) => setBody(e.target.value)} placeholder="Rédigez votre message..." /></Field>
            <Btn type="submit" className="w-full py-3"><Send size={16} /> Envoyer</Btn>
          </form>
        </Card>
      ) : mine.length === 0 ? (
        <Empty icon={<Mail size={40} />} title="Aucun message" sub="Vos conversations apparaîtront ici." />
      ) : (
        <div className="space-y-3">
          {mine.map((m) => {
            const incoming = m.fromId !== user!.id;
            const isBroadcast = m.toId === "all_students" || m.toId === "all_teachers";
            return (
              <Card key={m.id} className="p-5" glow={incoming ? "cyan" : "green"}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {incoming ? <Mail size={16} className="text-cyan-300" /> : <Send size={16} className="text-emerald-300" />}
                    <p className="text-sm font-bold text-white">{m.subject}</p>
                    {!m.lu && incoming && <Badge color="red">Nouveau</Badge>}
                  </div>
                  <p className="text-[11px] text-slate-500">{m.date}</p>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {incoming ? <>De <span className="font-bold text-slate-300">{m.fromName}</span></> : <>À <span className="font-bold text-slate-300">{isBroadcast ? userName(m.toId) : userName(m.toId)}</span></>}
                </p>
                <p className="mt-2.5 whitespace-pre-wrap text-sm text-slate-200">{m.body}</p>
                {incoming && !m.lu && (
                  <button
                    onClick={() => update((d) => ({ ...d, messages: d.messages.map((x) => x.id === m.id ? { ...x, lu: true } : x) }))}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-cyan-300 hover:underline"
                  >
                    <CheckCheck size={14} /> Marquer comme lu
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function NotificationsPage() {
  const { db, user, update } = useStore();
  const mine = db.notifications
    .filter((n) => n.toId === user!.id || n.toId === "all")
    .sort((a, b) => b.date.localeCompare(a.date));

  const markAll = () =>
    update((d) => ({ ...d, notifications: d.notifications.map((n) => (n.toId === user!.id || n.toId === "all") ? { ...n, lu: true } : n) }));

  return (
    <div>
      <PageHead
        title="Notifications"
        subtitle="Alertes, annonces et suivi de votre dossier"
        actions={<Btn variant="outline" onClick={markAll}><CheckCheck size={16} /> Tout marquer comme lu</Btn>}
      />
      {mine.length === 0 ? (
        <Empty icon={<Bell size={40} />} title="Aucune notification" />
      ) : (
        <div className="space-y-3">
          {mine.map((n) => (
            <div key={n.id} className={cn("flex items-start gap-3 rounded-2xl border bg-[#0A1224]/70 p-4", notifColor[n.type] ?? "border-white/10")}>
              <div className={cn("mt-0.5 rounded-xl border p-2", notifColor[n.type] ?? "")}><Bell size={16} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-white">{n.title}</p>
                  <span className="flex shrink-0 items-center gap-2">
                    {!n.lu && <span className="h-2 w-2 rounded-full bg-red-500" />}
                    <span className="text-[11px] text-slate-500">{n.date}</span>
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-300">{n.body}</p>
                {!n.lu && (
                  <button
                    onClick={() => update((d) => ({ ...d, notifications: d.notifications.map((x) => x.id === n.id ? { ...x, lu: true } : x) }))}
                    className="mt-2 text-xs font-bold text-cyan-300 hover:underline"
                  >
                    Marquer comme lu
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RecentMessages({ limit = 3 }: { limit?: number }) {
  const { db, user } = useStore();
  const mine = db.messages.filter((m) => m.toId === user!.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
  if (mine.length === 0) return <p className="text-sm text-slate-500">Aucun message reçu.</p>;
  return (
    <div className="space-y-2.5">
      {mine.map((m) => (
        <div key={m.id} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <Mail size={15} className="mt-0.5 shrink-0 text-cyan-300" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-200">{m.subject} {!m.lu && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-red-500 align-middle" />}</p>
            <p className="truncate text-xs text-slate-500">De {m.fromName} • {m.date}</p>
          </div>
          <ChevronRight size={15} className="mt-1 shrink-0 text-slate-600" />
        </div>
      ))}
    </div>
  );
}
