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

// Group key used consistently for rank + leaderboard grouping so the
// numbers agree across pages.
export function groupKey(runner) {
  return `${runner.distance}||${runner.age_group}||${runner.gender}`;
}

// This runner's 1-based position within its group, sorted by finish time
// ascending. Returns null if the runner hasn't finished yet.
export function computeRank(runner, allRunners) {
  if (!runner.finish) return null;
  const group = allRunners
    .filter((r) => r.finish && groupKey(r) === groupKey(runner))
    .sort((a, b) => a.finish - b.finish);
  const index = group.findIndex((r) => r.bib === runner.bib);
  return index === -1 ? null : index + 1;
}

// Rank for every finished runner, grouped by distance + age group + gender,
// computed once. Prefer this over calling computeRank() per row in a large
// table — computeRank() re-filters and re-sorts the whole array on every
// call, which is O(n^2) over a full runner list.
export function rankMapByBib(allRunners) {
  const groups = new Map();
  allRunners
    .filter((r) => r.finish)
    .forEach((r) => {
      const key = groupKey(r);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    });

  const ranks = new Map();
  groups.forEach((list) => {
    [...list]
      .sort((a, b) => a.finish - b.finish)
      .forEach((r, i) => ranks.set(r.bib, i + 1));
  });
  return ranks;
}

// Top N finishers per distance + age group + gender, sorted by finish time.
export function topNByGroup(allRunners, n = 5) {
  const groups = new Map();
  allRunners
    .filter((r) => r.finish)
    .forEach((r) => {
      const key = groupKey(r);
      if (!groups.has(key)) {
        groups.set(key, { distance: r.distance, age_group: r.age_group, gender: r.gender, runners: [] });
      }
      groups.get(key).runners.push(r);
    });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    runners: [...group.runners].sort((a, b) => a.finish - b.finish).slice(0, n),
  }));
}

export function formatTime(epochMs) {
  if (!epochMs) return null;
  return new Date(epochMs).toLocaleTimeString('th-TH', { hour12: false });
}

// Checkpoint scan times are keyed by station UUID, which anon can't resolve
// to a name — render them generically as "Checkpoint 1", "Checkpoint 2", …
// sorted by time, with a synthetic "Finish" node appended when applicable.
export function checkpointTimeline(cps, finish) {
  const times = Object.values(cps || {}).sort((a, b) => a - b);
  const timeline = times.map((t, i) => ({ label: `Checkpoint ${i + 1}`, time: formatTime(t) }));
  if (finish) {
    timeline.push({ label: 'Finish', time: formatTime(finish) });
  }
  return timeline;
}
