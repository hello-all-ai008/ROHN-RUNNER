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

export function getFinishEpoch(r) {
  if (!r || !r.finish) return null;
  const t = typeof r.finish === 'number' ? r.finish : new Date(r.finish).getTime();
  return isNaN(t) ? null : t;
}

// Group key used consistently for rank + leaderboard grouping so the
// numbers agree across pages.
export function groupKey(runner) {
  return `${runner.distance}||${runner.age_group}||${runner.gender}`;
}

// Compute 1st Male and 1st Female for each distance (regardless of age group)
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
      .sort((a, b) => (getFinishEpoch(a) || 0) - (getFinishEpoch(b) || 0));

    const females = runnersInDist
      .filter((r) => isFemale(r.gender))
      .sort((a, b) => (getFinishEpoch(a) || 0) - (getFinishEpoch(b) || 0));

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

// This runner's 1-based position within its group, sorted by finish time
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
    .sort((a, b) => (getFinishEpoch(a) || 0) - (getFinishEpoch(b) || 0));
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
      .sort((a, b) => (getFinishEpoch(a) || 0) - (getFinishEpoch(b) || 0))
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

// Top N finishers per distance + age group + gender, sorted by finish time.
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
      runners: [...group.runners].sort((a, b) => (getFinishEpoch(a) || 0) - (getFinishEpoch(b) || 0)).slice(0, n),
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
  const finishMs = getFinishEpoch(r);
  if (!finishMs) return '--:--:--';
  const startMs = r.gun_start_time ? new Date(r.gun_start_time).getTime() : (r.checked_in_at ? new Date(r.checked_in_at).getTime() : null);
  if (startMs && finishMs > startMs) {
    return formatDuration(finishMs - startMs);
  }
  return formatTime(finishMs);
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
