import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CURRENT_EVENT_ID } from '../lib/constants';
import { normalizeRunner } from '../lib/results';

const PAGE_SIZE = 1000; // PostgREST caps each request at 1000 rows regardless of a higher client limit.

const RunnerContext = createContext();

export const useRunner = () => useContext(RunnerContext);

async function fetchAllPublicResults() {
  const rows = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from('public_results')
      .select('*')
      .eq('event_id', CURRENT_EVENT_ID)
      .order('bib')
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

export const RunnerProvider = ({ children }) => {
  const [runners, setRunners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [castEvent, setCastEvent] = useState(null);

  const loadRunners = useCallback(async () => {
    try {
      const rows = await fetchAllPublicResults();
      setRunners(rows.map(normalizeRunner));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load runners');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRunners();

    // Clean up any legacy mock runners storage key if present
    try {
      localStorage.removeItem('react_runners_v2');
    } catch {}

    const handleStorage = (e) => {
      if (e.key === 'react_cast_event' || e.key === 'rohn_monitor_cast') {
        try { setCastEvent(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    let bc;
    try {
      bc = new BroadcastChannel('rohn_monitor_channel');
      bc.onmessage = (ev) => {
        if (ev.data) setCastEvent(ev.data);
      };
    } catch {}

    const handleMessage = (ev) => {
      if (ev.data && (ev.data.type === 'ROHN_MONITOR_CAST' || ev.data.monitorId)) {
        setCastEvent(ev.data);
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('message', handleMessage);
      if (bc) bc.close();
    };
  }, [loadRunners]);

  // Live updates for ESlip/Leaderboard/Dashboard via Realtime Broadcast, with
  // a window-focus refetch as a fallback in case a broadcast is missed. Lives
  // here (not per-page) so every consumer of `runners` gets live data for
  // free and there is exactly one subscription/merge path to keep correct.
  //
  // The channel is private: realtime.broadcast_changes() always requires
  // Realtime Authorization (an RLS policy on realtime.messages), there is no
  // public/private toggle on it like plain realtime.send() has. setAuth()
  // attaches the client's current key (anon, here) so that policy check can
  // evaluate `to anon`.
  useEffect(() => {
    let cancelled = false;
    const channel = supabase.channel(`results:${CURRENT_EVENT_ID}`, {
      config: { private: true },
    });

    channel.on('broadcast', { event: '*' }, (payload) => {
      const row = payload.payload?.record;
      if (!row || !row.bib) return;
      const updated = normalizeRunner(row);
      setRunners((prev) => prev.map((r) => (String(r.bib) === String(updated.bib) ? { ...r, ...updated } : r)));
    });

    supabase.realtime.setAuth().then(() => {
      if (!cancelled) channel.subscribe();
    });

    const handleFocus = () => loadRunners();
    window.addEventListener('focus', handleFocus);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadRunners]);

  const getRunnerByBib = (bib) => {
    if (!bib) return null;
    const target = String(bib).trim();
    return runners.find(r => String(r.bib) === target) || null;
  };

  const checkInRunner = (bib) => {
    if (!bib) return { success: false, message: 'กรุณาระบุหมายเลข BIB' };
    const target = String(bib).trim();
    const runner = runners.find(r => String(r.bib) === target);

    if (runner) {
      return {
        success: true,
        name: runner.name || 'Runner',
        distance: runner.distance || '',
        ageGroup: runner.ageGroup || runner.age_group || '',
        gunStartTime: runner.gun_start_time || null,
        runner: runner
      };
    }
    return { success: false, message: `ไม่พบหมายเลข BIB "${target}" ในระบบฐานข้อมูล` };
  };

  const castToMonitor = (monitorId, bib, name, distance, ageGroup, extra = {}) => {
    const event = {
      type: 'ROHN_MONITOR_CAST',
      source: extra?.source || 'rohn_runner_scanner',
      monitorId: monitorId,
      bib: bib,
      name: name,
      distance: distance,
      ageGroup: ageGroup,
      gunStartTime: extra?.gunStartTime || null,
      timestamp: new Date().getTime(),
      ...extra
    };
    // Update local state (for same window if needed) and localStorage for other tabs
    setCastEvent(event);
    localStorage.setItem('react_cast_event', JSON.stringify(event));
    try {
      localStorage.setItem('rohn_monitor_cast', JSON.stringify(event));
      const bc = new BroadcastChannel('rohn_monitor_channel');
      bc.postMessage(event);
      bc.close();
    } catch {}
  };

  return (
    <RunnerContext.Provider value={{ runners, loading, error, getRunnerByBib, checkInRunner, castToMonitor, castEvent, refetchRunners: loadRunners }}>
      {children}
    </RunnerContext.Provider>
  );
};
