import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CURRENT_EVENT_ID } from '../lib/constants';
import { normalizeRunner } from '../lib/results';

// Legacy 5-runner mock roster. Kept ONLY to back Scanner.jsx's / Monitor.jsx's
// checkInRunner() flow (those pages are out of scope and stay on mock data) —
// it is never merged into the real `runners` state below.
const initialMockRunners = [
  { bib: "1001", name: "Tiw Runner", ageGroup: "30-39", gender: "M", distance: "5KM", status: "DNS" },
  { bib: "1002", name: "Somchai Fast", ageGroup: "20-29", gender: "M", distance: "10KM", status: "DNS" },
  { bib: "1003", name: "Suda Trail", ageGroup: "30-39", gender: "F", distance: "5KM", status: "DNS" },
  { bib: "1004", name: "Mana Power", ageGroup: "40-49", gender: "M", distance: "10KM", status: "DNS" },
  { bib: "1005", name: "Wandee Run", ageGroup: "20-29", gender: "F", distance: "5KM", status: "DNS" }
];

const MOCK_STORAGE_KEY = 'react_runners_v2';
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

    const handleStorage = (e) => {
      if (e.key === 'react_cast_event') {
        setCastEvent(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
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
      setRunners((prev) => prev.map((r) => (r.bib === updated.bib ? { ...r, ...updated } : r)));
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

  const getRunnerByBib = (bib) => runners.find(r => r.bib === bib);

  // Legacy check-in flow for Scanner.jsx — writes to a mock localStorage
  // roster only, never to Supabase and never into the real `runners` state.
  const checkInRunner = (bib) => {
    const stored = localStorage.getItem(MOCK_STORAGE_KEY);
    const mockRunners = stored ? JSON.parse(stored) : initialMockRunners;

    let runnerName = "";
    let runnerDistance = "";
    let runnerAgeGroup = "";
    let found = false;

    const newMockRunners = mockRunners.map(r => {
      if (r.bib === bib) {
        found = true;
        runnerName = r.name;
        runnerDistance = r.distance;
        runnerAgeGroup = r.ageGroup;
        return {
          ...r,
          status: "CHECKED_IN",
          checkInTime: new Date().toLocaleString()
        };
      }
      return r;
    });

    if (found) {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(newMockRunners));
      return { success: true, name: runnerName, distance: runnerDistance, ageGroup: runnerAgeGroup };
    }
    return { success: false, message: "BIB not found" };
  };

  const castToMonitor = (monitorId, bib, name, distance, ageGroup) => {
    const event = {
      monitorId: monitorId,
      bib: bib,
      name: name,
      distance: distance,
      ageGroup: ageGroup,
      timestamp: new Date().getTime()
    };
    // Update local state (for same window if needed) and localStorage for other tabs
    setCastEvent(event);
    localStorage.setItem('react_cast_event', JSON.stringify(event));
  };

  return (
    <RunnerContext.Provider value={{ runners, loading, error, getRunnerByBib, checkInRunner, castToMonitor, castEvent, refetchRunners: loadRunners }}>
      {children}
    </RunnerContext.Provider>
  );
};
