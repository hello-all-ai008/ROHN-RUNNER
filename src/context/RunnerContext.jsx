import React, { createContext, useContext, useState, useEffect } from 'react';

const initialMockRunners = [
  { bib: "1001", name: "Tiw Runner", ageGroup: "30-39", gender: "M", distance: "5KM", status: "DNS" },
  { bib: "1002", name: "Somchai Fast", ageGroup: "20-29", gender: "M", distance: "10KM", status: "DNS" },
  { bib: "1003", name: "Suda Trail", ageGroup: "30-39", gender: "F", distance: "5KM", status: "DNS" },
  { bib: "1004", name: "Mana Power", ageGroup: "40-49", gender: "M", distance: "10KM", status: "DNS" },
  { bib: "1005", name: "Wandee Run", ageGroup: "20-29", gender: "F", distance: "5KM", status: "DNS" }
];

const RunnerContext = createContext();

export const useRunner = () => useContext(RunnerContext);

export const RunnerProvider = ({ children }) => {
  const [runners, setRunners] = useState([]);
  const [castEvent, setCastEvent] = useState(null);

  // Initialize and load from local storage
  useEffect(() => {
    const stored = localStorage.getItem('react_runners_v2');
    if (!stored) {
      localStorage.setItem('react_runners_v2', JSON.stringify(initialMockRunners));
      setRunners(initialMockRunners);
    } else {
      setRunners(JSON.parse(stored));
    }

    const handleStorage = (e) => {
      if (e.key === 'react_runners_v2') {
        try { setRunners(JSON.parse(e.newValue)); } catch {}
      }
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
  }, []);

  const getRunnerByBib = (bib) => {
    return runners.find(r => r.bib === bib);
  };

  const checkInRunner = (bib) => {
    let runnerName = "";
    let runnerDistance = "";
    let runnerAgeGroup = "";
    let found = false;

    const newRunners = runners.map(r => {
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
      setRunners(newRunners);
      localStorage.setItem('react_runners_v2', JSON.stringify(newRunners));
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
    <RunnerContext.Provider value={{ runners, getRunnerByBib, checkInRunner, castToMonitor, castEvent }}>
      {children}
    </RunnerContext.Provider>
  );
};
