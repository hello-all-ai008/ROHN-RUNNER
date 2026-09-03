import React from 'react';
import { Link } from 'react-router-dom';
import { useRunner } from '../context/RunnerContext';
import logoFull from '../LOGO/logo-rohn-full.png';
import { ArrowLeft } from 'lucide-react';

function Dashboard() {
  const { runners } = useRunner();
  
  const checkedInCount = runners.filter(r => r.status === 'CHECKED_IN').length;
  const totalCount = runners.length;
  const checkInPct = totalCount ? Math.round((checkedInCount / totalCount) * 100) : 0;

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
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#eab308', marginBottom: '0.5rem', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
            {Math.round(totalCount * 0.4)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {totalCount} (40%)</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Station A1</div>
        </div>
        <div className="card" style={{ padding: '1.2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f97316', marginBottom: '0.5rem', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
            {Math.round(totalCount * 0.1)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {Math.round(totalCount * 0.4)} (25%)</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Station A2</div>
        </div>
        <div className="card" style={{ padding: '1.2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success-green)', marginBottom: '0.5rem', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
            {Math.round(totalCount * 0.2)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {totalCount} (20%)</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Finished</div>
        </div>
        <div className="card" style={{ padding: '1.2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.5rem', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
            {Math.round(totalCount * 0.1)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {totalCount} (10%)</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>DNS</div>
        </div>
      </div>

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>BIB</th>
              <th>Date</th>
              <th>Start</th>
              <th>A1</th>
              <th>A2</th>
              <th>Finish</th>
              <th>Age Grp</th>
              <th>Grp Rank</th>
              <th>Overall</th>
            </tr>
          </thead>
          <tbody>
            {runners.map(r => (
              <tr key={r.bib}>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td><span style={{ color: 'var(--accent-blue)' }}>{r.bib}</span></td>
                <td style={{ color: r.checkInTime ? 'var(--success-green)' : 'inherit' }}>{r.checkInTime || '-'}</td>
                <td>{r.checkInTime ? '05:00:00' : '-'}</td>
                <td>{r.checkInTime ? '05:45:12' : '-'}</td>
                <td>{r.checkInTime ? '06:30:45' : '-'}</td>
                <td style={{ color: r.checkInTime ? 'var(--success-green)' : 'inherit', fontWeight: r.checkInTime ? 'bold' : 'normal' }}>{r.checkInTime ? '07:15:30' : '-'}</td>
                <td>{r.ageGroup}</td>
                <td>{r.checkInTime ? '3' : '-'}</td>
                <td>{r.checkInTime ? '12' : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
