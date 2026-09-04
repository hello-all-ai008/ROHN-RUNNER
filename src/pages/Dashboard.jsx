import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRunner } from '../context/RunnerContext';
import logoFull from '../LOGO/logo-rohn-full.png';
import { ArrowLeft } from 'lucide-react';
import { formatTime, rankMapByBib } from '../lib/results';

function Dashboard() {
  // RunnerContext owns the Realtime Broadcast subscription and merges live
  // updates straight into `runners`, so this page just reads it.
  const { runners, loading } = useRunner();
  const liveRunners = runners;

  // Ranks for the whole table computed once per render, not once per row —
  // computeRank() re-filters/re-sorts the full list on every call.
  const ranks = useMemo(() => rankMapByBib(liveRunners), [liveRunners]);

  const totalCount = liveRunners.length;
  const checkedInCount = liveRunners.filter(r => r.registration_status === 'CHECKED_IN').length;
  const finishedCount = liveRunners.filter(r => r.finish).length;
  const notFinishedCount = totalCount - finishedCount;

  const checkInPct = totalCount ? Math.round((checkedInCount / totalCount) * 100) : 0;
  const finishedPct = totalCount ? Math.round((finishedCount / totalCount) * 100) : 0;
  const notFinishedPct = totalCount ? Math.round((notFinishedCount / totalCount) * 100) : 0;

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
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f97316', marginBottom: '0.5rem', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
            {notFinishedCount} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {totalCount} ({notFinishedPct}%)</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Not Yet Finished</div>
        </div>
      </div>

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>BIB</th>
              <th>Status</th>
              <th>Finish</th>
              <th>Age Grp</th>
              <th>Checkpoints</th>
              <th>Grp Rank</th>
            </tr>
          </thead>
          <tbody>
            {liveRunners.map(r => {
              const rank = ranks.get(r.bib) || null;
              const checkpointCount = Object.keys(r.cps || {}).length;
              return (
                <tr key={r.bib}>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td><span style={{ color: 'var(--accent-blue)' }}>{r.bib}</span></td>
                  <td style={{ color: r.registration_status === 'CHECKED_IN' ? 'var(--success-green)' : 'inherit' }}>{r.registration_status}</td>
                  <td style={{ color: r.finish ? 'var(--success-green)' : 'inherit', fontWeight: r.finish ? 'bold' : 'normal' }}>{formatTime(r.finish) || '-'}</td>
                  <td>{r.age_group}</td>
                  <td>{checkpointCount}</td>
                  <td>{rank ? `#${rank}` : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
