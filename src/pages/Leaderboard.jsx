import React from 'react';
import { Link } from 'react-router-dom';
import logoFull from '../LOGO/logo-rohn-full.png';
import { ArrowLeft } from 'lucide-react';
import { useRunner } from '../context/RunnerContext';
import { topNByGroup, formatTime } from '../lib/results';

function Leaderboard() {
  // RunnerContext owns the Realtime Broadcast subscription and merges live
  // updates straight into `runners`, so this page just reads it.
  const { runners, loading } = useRunner();

  const groups = topNByGroup(runners, 5);

  return (
    <div style={{ backgroundColor: 'var(--bg-dark)', minHeight: '100vh', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2rem', borderBottom: '1px solid rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <div>
          <Link to="/" className="btn-back"><ArrowLeft size={18} /> กลับหน้าหลัก (Home)</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1rem' }}>
            <img src={logoFull} alt="ROHN Logo" style={{ height: '60px' }} />
            <div style={{ width: '2px', height: '60px', backgroundColor: 'var(--text-muted)', opacity: 0.3 }}></div>
            <div>
              <h1 style={{ margin: 0, fontSize: '2.5rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-main)', lineHeight: 1 }}>Live Leaderboard</h1>
              <p style={{ color: 'var(--text-muted)', margin: 0, marginTop: '5px' }}>Top 5 Official Results</p>
            </div>
          </div>
        </div>

        <div></div>
      </div>

      {loading && groups.length === 0 && (
        <p style={{ color: 'var(--text-muted)', padding: '0 2rem' }}>Loading results...</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', padding: '0 2rem' }}>
        {groups.map((group, gIdx) => (
          <div key={gIdx} style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '1rem', borderLeft: '4px solid var(--accent-blue)', paddingLeft: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--accent-blue)' }}>{group.distance}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>|</span>
              {group.age_group} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({group.gender})</span>
            </div>

            {[...Array(5)].map((_, i) => {
              const r = group.runners[i];
              const rankClass = i < 3 ? `rank-${i+1}` : '';

              if (r) {
                return (
                  <div key={i} className="leaderboard-row">
                    <div className={`rank ${rankClass}`}>{i+1}</div>
                    <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-main)' }}>{r.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>BIB: {r.bib}</div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--success-green)', fontWeight: 'bold' }}>
                        {formatTime(r.finish)}
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={i} className="leaderboard-row" style={{ opacity: 0.3 }}>
                    <div className="rank">{i+1}</div>
                    <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ color: 'var(--text-main)' }}>---</div>
                      <div style={{ color: 'var(--text-main)' }}>--:--:--</div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Leaderboard;
