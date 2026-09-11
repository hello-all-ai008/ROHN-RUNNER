import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRunner } from '../context/RunnerContext';
import logoFull from '../LOGO/logo-rohn-full.png';
import { ArrowLeft } from 'lucide-react';
import { formatTime, formatDuration, rankMapByBib, getRunnerRaceStatus, getRunnerStartTime, getRunnerNetTime } from '../lib/results';
import AdvancedTable from '../components/AdvancedTable';

const STATUS_LABEL = {
  FINISHED: 'Finished',
  IN_RACE: 'In Race',
  DNS: 'DNS',
  DNF: 'DNF',
};

const STATUS_COLOR = {
  Finished: 'var(--success-green)',
  'In Race': 'var(--accent-blue)',
  DNS: 'var(--text-muted)',
  DNF: 'var(--warn)',
  'Pre-registered': 'var(--text-muted)',
  'Checked In': 'var(--accent-blue)',
};

// Registration-desk state, shown only when the runner hasn't started yet
// (raceStatusCode === 'DNS') — otherwise the computed race status wins.
const REG_LABEL = {
  PRE_REGISTERED: 'Pre-registered',
  CHECKED_IN: 'Checked In',
};

function Dashboard() {
  // RunnerContext owns the Realtime Broadcast subscription and merges live
  // updates straight into `runners`, so this page just reads it.
  const { runners, loading } = useRunner();
  const liveRunners = runners;

  // Ranks for the whole table computed once per render, not once per row —
  // computeRank() re-filters/re-sorts the full list on every call.
  const ranks = useMemo(() => rankMapByBib(liveRunners), [liveRunners]);

  // Race-progress status per runner (Finished / In Race / DNS / DNF),
  // separate from registration_status (check-in desk state).
  const runnersWithStatus = useMemo(
    () => liveRunners.map(r => ({ ...r, raceStatusCode: getRunnerRaceStatus(r) })),
    [liveRunners]
  );

  const distances = useMemo(() => {
    const set = new Set();
    liveRunners.forEach(r => { if (r.distance) set.add(r.distance); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [liveRunners]);

  // First cat_color seen per distance — same "distance → color" lookup used
  // on /leaderboard and /monitor, so this page reads as part of the same
  // per-distance color language.
  const distanceColorMap = useMemo(() => {
    const map = {};
    liveRunners.forEach(r => {
      if (r.distance && r.cat_color && !map[r.distance]) map[r.distance] = r.cat_color;
    });
    return map;
  }, [liveRunners]);

  const totalCount = liveRunners.length;
  const checkedInCount = liveRunners.filter(r => r.registration_status === 'CHECKED_IN').length;
  const finishedCount = runnersWithStatus.filter(r => r.raceStatusCode === 'FINISHED').length;
  const inRaceCount = runnersWithStatus.filter(r => r.raceStatusCode === 'IN_RACE').length;

  const checkInPct = totalCount ? Math.round((checkedInCount / totalCount) * 100) : 0;
  const finishedPct = totalCount ? Math.round((finishedCount / totalCount) * 100) : 0;
  const inRacePct = totalCount ? Math.round((inRaceCount / totalCount) * 100) : 0;

  // DNS/DNF (and Finished/In Race for context) broken down per distance.
  const perDistanceStats = useMemo(() => {
    return distances.map(dist => {
      const inDist = runnersWithStatus.filter(r => r.distance === dist);
      const count = (status) => inDist.filter(r => r.raceStatusCode === status).length;
      return {
        distance: dist,
        total: inDist.length,
        finished: count('FINISHED'),
        inRace: count('IN_RACE'),
        dns: count('DNS'),
        dnf: count('DNF'),
      };
    });
  }, [distances, runnersWithStatus]);

  // Row data for the AdvancedTable — columns filter/sort on these fields
  // directly, so anything that needs to be filterable is pre-formatted here
  // rather than only computed at render time via col.render.
  const tableRows = useMemo(() => runnersWithStatus.map(r => {
    const rank = ranks.get(r.bib) || null;
    const netInfo = getRunnerNetTime(r);
    const startEpoch = netInfo.startEpoch ?? getRunnerStartTime(r, Date.now());
    const combinedStatus = r.raceStatusCode === 'DNS'
      ? (REG_LABEL[r.registration_status] || r.registration_status || 'DNS')
      : (STATUS_LABEL[r.raceStatusCode] || r.raceStatusCode);
    return {
      ...r,
      combinedStatus,
      startTime: formatTime(startEpoch) || '-',
      finishTime: formatTime(r.finish) || '-',
      netTime: netInfo.netTimeMs ? formatDuration(netInfo.netTimeMs) : '-',
      rankDisplay: rank ? `#${rank}` : '-',
    };
  }), [runnersWithStatus, ranks]);

  const columns = useMemo(() => [
    { key: 'name', label: 'Name', defaultWidth: 180 },
    { key: 'bib', label: 'BIB', defaultWidth: 90 },
    {
      key: 'distance',
      label: 'Distance',
      defaultWidth: 100,
      render: (val, row) => (
        <span style={{ background: row.cat_color || '#0f172a', color: '#ffffff', padding: '2px 10px', borderRadius: '99px', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
          {val}
        </span>
      ),
    },
    { key: 'gender', label: 'Gender', defaultWidth: 90 },
    {
      key: 'combinedStatus',
      label: 'Status',
      defaultWidth: 130,
      render: (val) => <span style={{ color: STATUS_COLOR[val], fontWeight: 700 }}>{val}</span>,
    },
    { key: 'startTime', label: 'Start', defaultWidth: 100 },
    { key: 'finishTime', label: 'Finish', defaultWidth: 100 },
    { key: 'netTime', label: 'Net Time', defaultWidth: 100 },
    { key: 'age_group', label: 'Age Grp', defaultWidth: 160 },
    { key: 'rankDisplay', label: 'Grp Rank', defaultWidth: 90, align: 'center' },
  ], []);

  return (
    <div className="container" style={{ maxWidth: '1400px' }}>
      <Link to="/" className="btn-back" style={{ marginBottom: 0 }}><ArrowLeft size={18} /> กลับหน้าหลัก (Home)</Link>

      <div className="flex justify-between items-center" style={{ marginBottom: '1rem', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logoFull} alt="ROHN Logo" style={{ height: '40px' }} />
          <div style={{ width: '2px', height: '40px', backgroundColor: 'var(--text-muted)', opacity: 0.3 }}></div>
          <div>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.2rem, 4vw, 2rem)', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-main)', lineHeight: 1 }}>Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, marginTop: '2px', fontSize: '0.8rem' }}>Live Statistics</p>
          </div>
        </div>
      </div>

      {loading && totalCount === 0 && (
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Loading results...</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        <div className="card" style={{ padding: '0.8rem 0.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.2rem' }}>
            {totalCount}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>Total</div>
        </div>
        <div className="card" style={{ padding: '0.8rem 0.5rem', textAlign: 'center', background: 'linear-gradient(145deg, var(--bg-card) 0%, rgba(37, 99, 235, 0.05) 100%)' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-blue)', marginBottom: '0.2rem', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
            {checkedInCount} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {totalCount} ({checkInPct}%)</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>Checked In</div>
        </div>
        <div className="card" style={{ padding: '0.8rem 0.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success-green)', marginBottom: '0.2rem', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
            {finishedCount} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {totalCount} ({finishedPct}%)</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>Finished</div>
        </div>
        <div className="card" style={{ padding: '0.8rem 0.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-blue)', marginBottom: '0.2rem', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
            {inRaceCount} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {totalCount} ({inRacePct}%)</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>In Race</div>
        </div>
      </div>

      {/* DNS / DNF breakdown per distance */}
      {perDistanceStats.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>Summary by Distance</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
            {perDistanceStats.map(s => (
              <div key={s.distance} className="card" style={{
                padding: '0.8rem 0.5rem',
                border: `2px solid ${distanceColorMap[s.distance] || 'var(--line)'}`,
                background: distanceColorMap[s.distance] ? `${distanceColorMap[s.distance]}1a` : 'var(--bg-card)'
              }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: distanceColorMap[s.distance] || 'var(--text-main)', marginBottom: '0.5rem', textAlign: 'center' }}>{s.distance} <span style={{ fontWeight: 600, fontSize: '0.7rem', color: 'var(--text-muted)' }}>({s.total})</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.2rem', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: STATUS_COLOR.Finished }}>{s.finished}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>FIN</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: STATUS_COLOR['In Race'] }}>{s.inRace}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>IN</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: STATUS_COLOR.DNS }}>{s.dns}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>DNS</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: STATUS_COLOR.DNF }}>{s.dnf}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>DNF</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Same per-column filter/search/sort/resize/pin data grid as Mae_khanin_Admin's
          /dashboard (AdvancedTable), minus its Excel export. */}
      <div style={{ background: 'var(--bg)', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid var(--line)', padding: '4px', overflowX: 'auto' }}>
        {tableRows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>ไม่มีข้อมูลนักวิ่ง</div>
        ) : (
          <AdvancedTable columns={columns} data={tableRows} pageSize={100} maxHeight="600px" />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
