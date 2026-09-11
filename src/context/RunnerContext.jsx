import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CURRENT_EVENT_ID } from '../lib/constants';
import { normalizeRunner } from '../lib/results';
import { smartFindRunner, normalizeScannedBib } from '../lib/bibUtils';

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

export const DEFAULT_STATIONS = [
  { id: '37a6e24a-32ae-47fb-806f-6255bfc07a44', name: 'Start', type: 'START', sequence_order: 1 },
  { id: '6cd9e19b-90c9-4c53-bc93-5976632dd4bc', name: 'A1', type: 'CP', sequence_order: 2 },
  { id: 'b021a57d-5c13-463c-970c-9100c3f09d21', name: 'A2', type: 'CP', sequence_order: 3 },
  { id: '4f7f4393-8103-4b28-a28a-e015c712d4f5', name: 'Finish', type: 'FINISH', sequence_order: 4 },
];

export const DEFAULT_PAGE_CONFIG = {
  scanner: true,
  monitor: true,
  eslip: true,
  dashboard: true,
  leaderboard: true,
  displayMode: 'disabled_badge',
  notices: {}
};

export const RunnerProvider = ({ children }) => {
  const [runners, setRunners] = useState([]);
  const [stations, setStations] = useState(DEFAULT_STATIONS);
  const [pageConfig, setPageConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('rohn_runner_page_config') || localStorage.getItem(`rohn_runner_page_config_${CURRENT_EVENT_ID}`);
      return saved ? { ...DEFAULT_PAGE_CONFIG, ...JSON.parse(saved) } : DEFAULT_PAGE_CONFIG;
    } catch {
      return DEFAULT_PAGE_CONFIG;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [castEvent, setCastEvent] = useState(null);

  const loadStations = useCallback(async () => {
    // 1. Direct DB select first (authoritative list of stations for the event)
    try {
      const { data, error } = await supabase.from('stations').select('id, name, type, sequence_order').eq('event_id', CURRENT_EVENT_ID);
      if (!error && data && data.length > 0) {
        setStations(data);
        return;
      }
    } catch (e) {}

    // 2. Try edge function invoke via Supabase client (fallback)
    try {
      const { data, error } = await supabase.functions.invoke(
        `login-options?event_id=${encodeURIComponent(CURRENT_EVENT_ID)}`,
        { method: 'GET' }
      );
      if (!error && Array.isArray(data?.slots)) {
        const list = data.slots
          .filter(s => s.station_id)
          .map(s => ({
            id: s.station_id,
            name: s.station_name,
            type: s.station_type,
            sequence_order: s.sequence_order
          }));
        if (list.length > 0) {
          setStations(list);
          return;
        }
      }
    } catch (e) {}

    // 3. Direct fetch fallback
    try {
      const res = await fetch(`https://kjtbfzsgnsvkfjgayuys.supabase.co/functions/v1/login-options?event_id=${CURRENT_EVENT_ID}`);
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.slots)) {
          const list = json.slots
            .filter(s => s.station_id)
            .map(s => ({
              id: s.station_id,
              name: s.station_name,
              type: s.station_type,
              sequence_order: s.sequence_order
            }));
          if (list.length > 0) {
            setStations(list);
            return;
          }
        }
      }
    } catch (e) {}
  }, []);

  const loadRunners = useCallback(async () => {
    try {
      const rows = await fetchAllPublicResults();
      
      // Check for config row
      const configRow = rows.find(r => r.bib === 'RUNNER_CONFIG');
      if (configRow && configRow.cps && typeof configRow.cps === 'object' && Object.keys(configRow.cps).length > 0) {
        setPageConfig(prev => ({
          ...prev,
          ...configRow.cps
        }));
        try {
          localStorage.setItem('rohn_runner_page_config', JSON.stringify(configRow.cps));
        } catch {}
      }

      // Filter out config row and system rows from runners list
      const actualRunners = rows.filter(r => r.bib !== 'RUNNER_CONFIG' && !String(r.bib || '').startsWith('__'));
      setRunners(actualRunners.map(normalizeRunner));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load runners');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStations();
  }, [loadStations]);

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
      if (payload.event === 'config_update' && payload.payload?.config) {
        setPageConfig(prev => ({ ...prev, ...payload.payload.config }));
        try {
          localStorage.setItem('rohn_runner_page_config', JSON.stringify(payload.payload.config));
        } catch {}
        return;
      }
      if (payload.event === 'monitor_cast' || payload.event === 'cast') {
        if (payload.payload) {
          setCastEvent(payload.payload);
        }
        return;
      }
      const row = payload.payload?.record;
      if (!row || !row.bib) return;
      if (row.bib === 'RUNNER_CONFIG') {
        if (row.cps && typeof row.cps === 'object') {
          setPageConfig(prev => ({ ...prev, ...row.cps }));
        }
        return;
      }
      const updated = normalizeRunner(row);
      setRunners((prev) => prev.map((r) => (String(r.bib) === String(updated.bib) ? { ...r, ...updated } : r)));
    });

    supabase.realtime.setAuth().then(() => {
      if (!cancelled) channel.subscribe();
    });

    // Also subscribe to public monitor stream for cross-origin/cross-device casting
    const monitorChannel = supabase.channel('rohn_monitor_stream', {
      config: { broadcast: { ack: false } }
    });
    monitorChannel.on('broadcast', { event: 'monitor_cast' }, ({ payload }) => {
      if (payload) {
        setCastEvent(payload);
      }
    });
    monitorChannel.subscribe();

    const handleFocus = () => loadRunners();
    window.addEventListener('focus', handleFocus);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      supabase.removeChannel(monitorChannel);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadRunners]);

  const getRunnerByBib = (bib) => {
    return smartFindRunner(bib, runners);
  };

  const checkInRunner = (bib) => {
    if (!bib) return { success: false, message: 'กรุณาระบุหมายเลข BIB' };
    const runner = smartFindRunner(bib, runners);

    if (runner) {
      let gunStartTime = runner.gun_start_time || null;
      if (!gunStartTime && runners.length > 0) {
        const distNum = String(runner.distance || '').replace(/\D/g, '');
        const match = runners.find(r => String(r.distance || '').replace(/\D/g, '') === distNum && r.gun_start_time);
        gunStartTime = match?.gun_start_time || null;
      }
      return {
        success: true,
        name: runner.name || 'Runner',
        distance: runner.distance || '',
        ageGroup: runner.ageGroup || runner.age_group || '',
        gunStartTime: gunStartTime,
        cat_color: runner.cat_color || null,
        runner: runner
      };
    }
    const clean = normalizeScannedBib(bib) || String(bib).trim();
    return { success: false, message: `ไม่พบหมายเลข BIB "${clean}" ในระบบฐานข้อมูล` };
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

    try {
      const ch = supabase.channel('rohn_monitor_stream');
      // One-off send channel per scan (broadcast works even before
      // .subscribe() via realtime-js's REST fallback) — must be explicitly
      // removed after sending, or the client accumulates a new channel
      // object per scan for the lifetime of the tab (hundreds on race day).
      ch.send({
        type: 'broadcast',
        event: 'monitor_cast',
        payload: event
      }).finally(() => {
        supabase.removeChannel(ch);
      });
    } catch {}
  };

  return (
    <RunnerContext.Provider value={{ runners, stations, loading, error, pageConfig, getRunnerByBib, checkInRunner, castToMonitor, castEvent, refetchRunners: loadRunners }}>
      {children}
    </RunnerContext.Provider>
  );
};
