import { useEffect, useState } from "react";
import { api, type Analysis } from "../api/client";

/** Polls an analysis until it reaches a terminal state. */
export function useAnalysisPolling(id: number | null, intervalMs = 1500) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id == null) return;
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const a = await api.getAnalysis(id);
        if (stop) return;
        setAnalysis(a);
        if (a.status === "queued" || a.status === "running") timer = setTimeout(tick, intervalMs);
      } catch (e) {
        if (!stop) setError(e instanceof Error ? e.message : "Request failed");
      }
    };
    tick();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [id, intervalMs]);

  return { analysis, error };
}
