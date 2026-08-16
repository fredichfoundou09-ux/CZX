import { useCallback, useEffect, useState } from "react";
import { supabaseConfigured } from "./client";

export function useSupabaseQuery<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [error, setError] = useState<Error | null>(null);
  const reload = useCallback(async () => { if (!supabaseConfigured) { setLoading(false); return; } setLoading(true); setError(null); try { setData(await loader()); } catch (err) { setError(err instanceof Error ? err : new Error("Erreur Supabase")); } finally { setLoading(false); } }, deps);
  useEffect(() => { void reload(); }, [reload]);
  return { data, loading, error, reload };
}
