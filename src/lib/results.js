// Shared helpers for turning raw `public_results` rows into what ESlip,
// Leaderboard, and Dashboard need to render. Rank is always computed
// client-side and scoped to distance + age group + gender, since the view
// exposes no rank column.

// Adapts a raw `public_results` row (or a realtime broadcast payload with
// the same shape) into what the read pages render: a composite "10KM"
// distance label (instead of separate distance/unit columns) plus an
// `ageGroup` alias kept for Monitor.jsx's manual-BIB lookup.
export function normalizeRunner(row) {
  const distanceLabel = row.distance != null && row.unit
    ? `${row.distance}${row.unit}`
    : (row.distance != null ? String(row.distance) : '');
  return {
    ...row,
    distance: distanceLabel,
    ageGroup: row.age_group || ''
  };
}

export function isMale(gender) {
  if (!gender) return false;
  const g = String(gender).trim().toLowerCase();
  return g === 'm' || g === 'male' || g.startsWith('ชาย') || g === 'man';
}

export function isFemale(gender) {
  if (!gender) return false;
  const g = String(gender).trim().toLowerCase();
  return g === 'f' || g === 'female' || g.startsWith('หญิง') || g === 'woman';
}

export function parseTimeToEpoch(timeVal, refTimestamp) {
  if (timeVal == null || timeVal === '') return null;
  if (typeof timeVal === 'number') {
    return isNaN(timeVal) ? null : timeVal;
  }
  const s = String(timeVal).trim();
  if (!s) return null;

  // Numeric epoch string (10 to 13 digits)
  if (/^\d{10,13}$/.test(s)) {
    const num = Number(s);
    return isNaN(num) ? null : num;
  }

  // Full ISO string or date with '-' or '/'
  if (s.includes('-') || s.includes('/')) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.getTime();
  }

  // Time of day "HH:mm:ss" or "HH:mm"
  const parts = s.split(':').map(Number);
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    const baseDate = refTimestamp ? new Date(refTimestamp) : new Date();
    baseDate.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
    let epoch = baseDate.getTime();
    // If refTimestamp was finish and time-of-day start is after finish, start was previous day
    if (refTimestamp && epoch > refTimestamp) {
      baseDate.setDate(baseDate.getDate() - 1);
      epoch = baseDate.getTime();
    }
    return epoch;
  }

  return null;
}

export function getFinishEpoch(r) {
  if (!r || !r.finish) return null;
  return parseTimeToEpoch(r.finish);
}

export function getRunnerStartTime(runner, refTimestamp) {
  if (!runner) return null;

  // 1. Explicit start fields
  const candidates = [
    runner.gun_start_time,
    runner.gunStartTime,
    runner.start_time,
    runner.startTime,
    runner.start
  ];

  for (const c of candidates) {
    if (c != null && c !== '') {
      const ep = parseTimeToEpoch(c, refTimestamp);
      if (ep != null) return ep;
    }
  }

  // 2. Check in runner.cps for a start checkpoint or earliest CP
  if (runner.cps && typeof runner.cps === 'object') {
    for (const [key, val] of Object.entries(runner.cps)) {
      if (/start|ปล่อยตัว/i.test(String(key))) {
        const ep = parseTimeToEpoch(val, refTimestamp);
        if (ep != null) return ep;
      }
    }
  }

  // 3. Check-in time
  const checkinVal = runner.checked_in_at || runner.checkin;
  if (checkinVal != null && checkinVal !== '') {
    const ep = parseTimeToEpoch(checkinVal, refTimestamp);
    if (ep != null) return ep;
  }

  // 4. Earliest checkpoint in cps (if before refTimestamp)
  if (runner.cps && typeof runner.cps === 'object') {
    const cpTimes = Object.values(runner.cps)
      .map(v => parseTimeToEpoch(v, refTimestamp))
      .filter(t => t != null && (!refTimestamp || t < refTimestamp));
    if (cpTimes.length > 0) {
      return Math.min(...cpTimes);
    }
  }

  return null;
}

export function getRunnerNetTime(runner) {
  if (!runner || !runner.finish) {
    return { netTimeMs: null, finishEpoch: null, startEpoch: null, isNet: false };
  }

  const finishEpoch = getFinishEpoch(runner);
  if (!finishEpoch) {
    return { netTimeMs: null, finishEpoch: null, startEpoch: null, isNet: false };
  }

  const startEpoch = getRunnerStartTime(runner, finishEpoch);

  if (startEpoch != null && finishEpoch > startEpoch) {
    const netTimeMs = finishEpoch - startEpoch;
    return { netTimeMs, finishEpoch, startEpoch, isNet: true };
  }

  return { netTimeMs: null, finishEpoch, startEpoch: null, isNet: false };
}

export function compareRunnerNetTime(a, b) {
  const aNet = getRunnerNetTime(a);
  const bNet = getRunnerNetTime(b);

  const aVal = aNet.isNet && aNet.netTimeMs != null ? aNet.netTimeMs : (aNet.finishEpoch || Infinity);
  const bVal = bNet.isNet && bNet.netTimeMs != null ? bNet.netTimeMs : (bNet.finishEpoch || Infinity);

  return aVal - bVal;
}

// Group key used consistently for rank + leaderboard grouping so the
// numbers agree across pages.
export function groupKey(runner) {
  return `${runner.distance}||${runner.age_group}||${runner.gender}`;
}

// Compute 1st Male and 1st Female for each distance (regardless of age group)
// Ranked by Net Time (finish - start)
export function getOverallLeaders(allRunners) {
  const finished = (allRunners || []).filter((r) => getFinishEpoch(r));
  
  const distanceMap = new Map();
  finished.forEach((r) => {
    const dist = r.distance || 'Unknown';
    if (!distanceMap.has(dist)) distanceMap.set(dist, []);
    distanceMap.get(dist).push(r);
  });

  const overallLeaders = [];
  const overallWinnerBibs = new Set();

  distanceMap.forEach((runnersInDist, dist) => {
    const males = runnersInDist
      .filter((r) => isMale(r.gender))
      .sort(compareRunnerNetTime);

    const females = runnersInDist
      .filter((r) => isFemale(r.gender))
      .sort(compareRunnerNetTime);

    const male1 = males[0] || null;
    const female1 = females[0] || null;

    if (male1 && male1.bib) overallWinnerBibs.add(String(male1.bib));
    if (female1 && female1.bib) overallWinnerBibs.add(String(female1.bib));

    overallLeaders.push({
      distance: dist,
      male: male1,
      female: female1,
    });
  });

  overallLeaders.sort((a, b) => a.distance.localeCompare(b.distance, undefined, { numeric: true }));

  return { overallLeaders, overallWinnerBibs };
}

// This runner's 1-based position within its group, sorted by net time (finish - start)
// ascending. Supports excluding overall winners (1 คนรับได้แค่ 1 รางวัล)
export function computeRank(runner, allRunners, excludeOverall = true) {
  if (!runner || !runner.finish) return null;
  const runnerFinish = getFinishEpoch(runner);
  if (!runnerFinish) return null;

  let excludeBibs = new Set();
  if (excludeOverall) {
    const { overallWinnerBibs } = getOverallLeaders(allRunners);
    excludeBibs = overallWinnerBibs;

    // If this runner is the overall champion, rank 1 overall
    if (runner.bib && overallWinnerBibs.has(String(runner.bib))) {
      return 1;
    }
  }

  const group = allRunners
    .filter((r) => getFinishEpoch(r) && groupKey(r) === groupKey(runner) && (!r.bib || !excludeBibs.has(String(r.bib))))
    .sort(compareRunnerNetTime);
  const index = group.findIndex((r) => String(r.bib) === String(runner.bib));
  return index === -1 ? null : index + 1;
}

// Rank for every finished runner, grouped by distance + age group + gender,
// computed once.
export function rankMapByBib(allRunners, excludeOverall = true) {
  let excludeBibs = new Set();
  if (excludeOverall) {
    const { overallWinnerBibs } = getOverallLeaders(allRunners);
    excludeBibs = overallWinnerBibs;
  }

  const groups = new Map();
  allRunners
    .filter((r) => getFinishEpoch(r) && (!r.bib || !excludeBibs.has(String(r.bib))))
    .forEach((r) => {
      const key = groupKey(r);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    });

  const ranks = new Map();
  groups.forEach((list) => {
    [...list]
      .sort(compareRunnerNetTime)
      .forEach((r, i) => ranks.set(String(r.bib), i + 1));
  });

  if (excludeOverall) {
    const { overallWinnerBibs } = getOverallLeaders(allRunners);
    overallWinnerBibs.forEach((bib) => {
      ranks.set(String(bib), 1);
    });
  }

  return ranks;
}

// Top N finishers per distance + age group + gender, sorted by net time (finish - start).
// Supports excluding overall winners so 1 คนรับได้แค่ 1 รางวัล
export function topNByGroup(allRunners, n = 5, excludeBibs = new Set()) {
  const groups = new Map();
  allRunners
    .filter((r) => getFinishEpoch(r) && (!r.bib || !excludeBibs.has(String(r.bib))))
    .forEach((r) => {
      const key = groupKey(r);
      if (!groups.has(key)) {
        groups.set(key, { distance: r.distance, age_group: r.age_group, gender: r.gender, runners: [] });
      }
      groups.get(key).runners.push(r);
    });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      runners: [...group.runners].sort(compareRunnerNetTime).slice(0, n),
    }))
    .sort((a, b) => {
      if (a.distance !== b.distance) return a.distance.localeCompare(b.distance, undefined, { numeric: true });
      if (a.gender !== b.gender) return a.gender.localeCompare(b.gender);
      return (a.age_group || '').localeCompare(b.age_group || '');
    });
}

export function formatDuration(ms) {
  if (!ms || ms <= 0) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatTime(epochMs) {
  if (!epochMs) return null;
  const t = typeof epochMs === 'number' ? epochMs : new Date(epochMs).getTime();
  if (isNaN(t)) return null;
  return new Date(t).toLocaleTimeString('th-TH', { hour12: false });
}

export function getRunnerDisplayTime(r) {
  const { netTimeMs, finishEpoch, isNet } = getRunnerNetTime(r);
  if (isNet && netTimeMs != null) {
    return formatDuration(netTimeMs);
  }
  if (finishEpoch != null) {
    return formatTime(finishEpoch);
  }
  return '--:--:--';
}

// Checkpoint scan times are keyed by station UUID, which anon can't resolve
// to a name — render them generically as "Checkpoint 1", "Checkpoint 2", …
// sorted by time, with synthetic "Check in"/"Start" nodes prepended and a
// "Finish" node appended. "Start" is the official gun-start time, shared by
// every runner in the category (mass start, from the Events "ผูกจุดตรวจและเวลา"
// config) — distinct from "Check in", which is this runner's own scan time.
export function checkpointTimeline(cps, finish, checkedInAt, gunStartTime) {
  const timeline = [];
  if (checkedInAt) {
    timeline.push({ label: 'Check in', time: formatTime(new Date(checkedInAt).getTime()) });
  }
  if (gunStartTime) {
    timeline.push({ label: 'Start', time: formatTime(new Date(gunStartTime).getTime()) });
  }
  const times = Object.values(cps || {}).sort((a, b) => a - b);
  times.forEach((t, i) => timeline.push({ label: `Checkpoint ${i + 1}`, time: formatTime(t) }));
  if (finish) {
    timeline.push({ label: 'Finish', time: formatTime(finish) });
  }
  return timeline;
}
