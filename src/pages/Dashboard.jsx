import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRunner } from '../context/RunnerContext';
import logoFull from '../LOGO/logo-rohn-full.png';
import { ArrowLeft } from 'lucide-react';
import { formatTime, rankMapByBib, getRunnerRaceStatus } from '../lib/results';
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
    return {
      ...r,
      raceStatus: STATUS_LABEL[r.raceStatusCode] || r.raceStatusCode,
      finishTime: formatTime(r.finish) || '-',
      checkpointCount: Object.keys(r.cps || {}).length,
      rankDisplay: rank ? `#${rank}` : '-',
    };
  }), [runnersWithStatus, ranks]);

  const columns = useMemo(() => [
    { key: 'name', label: 'Name', defaultWidth: 180 },
    { key: 'bib', label: 'BIB', defaultWidth: 90 },
    { key: 'distance', label: 'Distance', defaultWidth: 100 },
    { key: 'gender', label: 'Gender', defaultWidth: 90 },
    { key: 'registration_status', label: 'Reg. Status', defaultWidth: 130 },
    {
      key: 'raceStatus',
      label: 'Race Status',
      defaultWidth: 110,
      render: (val) => <span style={{ color: STATUS_COLOR[val], fontWeight: 700 }}>{val}</span>,
    },
    { key: 'finishTime', label: 'Finish', defaultWidth: 100 },
    { key: 'age_group', label: 'Age Grp', defaultWidth: 160 },
    { key: 'checkpointCount', label: 'Checkpoints', defaultWidth: 100, isNumeric: true, align: 'center' },
    { key: 'rankDisplay', label: 'Grp Rank', defaultWidth: 90, align: 'center' },
  ], []);

  return (
    <div className="container" style={{ maxWidth: '1400px' }}>
      <Link to="/" className="btn-back" style={{ marginBottom: 0 }}><ArrowLeft size={18} /> กลับหน้าหลัก (Home)</Link>

      <div className="flex justify-between items-center" style={{ marginBottom: '2rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <img src={logoFull} alt="ROHN Logo" style={{ height: '60px' }} />
          <div style={{ width: '2px', height: '60px', backgroundColor: 'var(--text-muted)', opacity: 0.3 }}></div>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.5rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-main)', lineHeight: 1 }}>Overall Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, marginTop: '5px' }}>Live Race Statistics</p>
          </div>
        </div>
      </div>

      {loading && totalCount === 0 && (
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Loading results...</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.5rem' }}>
            {totalCount}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Runners</div>
        </div>
        <div className="card" style={{ padding: '1.2rem', textAlign: 'center', background: 'linear-gradient(145deg, var(--bg-card) 0%, rgba(37, 99, 235, 0.05) 100%)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-blue)', marginBottom: '0.5rem', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
            {checkedInCount} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {totalCount} ({checkInPct}%)</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Checked In</div>
        </div>
        <div className="card" style={{ padding: '1.2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success-green)', marginBottom: '0.5rem', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
            {finishedCount} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {totalCount} ({finishedPct}%)</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Finished</div>
        </div>
        <div className="card" style={{ padding: '1.2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-blue)', marginBottom: '0.5rem', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
            {inRaceCount} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {totalCount} ({inRacePct}%)</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>In Race</div>
        </div>
      </div>

      {/* DNS / DNF breakdown per distance */}
      {perDistanceStats.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>สรุปตามระยะทาง (DNS / DNF)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {perDistanceStats.map(s => (
              <div key={s.distance} className="card" style={{ padding: '1.2rem' }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.85rem' }}>{s.distance} <span style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-muted)' }}>({s.total} runners)</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: STATUS_COLOR.Finished }}>{s.finished}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Finished</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: STATUS_COLOR['In Race'] }}>{s.inRace}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>In Race</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: STATUS_COLOR.DNS }}>{s.dns}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>DNS</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: STATUS_COLOR.DNF }}>{s.dnf}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>DNF</div>
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
