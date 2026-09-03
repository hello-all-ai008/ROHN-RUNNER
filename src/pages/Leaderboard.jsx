import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logoFull from '../LOGO/logo-rohn-full.png';
import { ArrowLeft } from 'lucide-react';

const mockResults = {
  '5KM': [
    { age: "20-29 Male", runners: [{ name: "Alex B", bib: "5001", time: "00:25:10"}, {name: "John D", bib: "5002", time: "00:26:05"}] },
    { age: "20-29 Female", runners: [{ name: "Wandee Run", bib: "1005", time: "00:28:15"}, {name: "Sarah C", bib: "5003", time: "00:29:40"}] },
    { age: "30-39 Male", runners: [{ name: "Mike T", bib: "5004", time: "00:24:50"}] }
  ],
  '10KM': [
    { age: "20-29 Male", runners: [{ name: "Somchai Fast", bib: "1002", time: "00:55:10"}] },
    { age: "30-39 Male", runners: [{ name: "Tiw Runner", bib: "1001", time: "00:52:15"}, {name: "Dave G", bib: "1006", time: "00:53:05"}] },
    { age: "40-49 Male", runners: [{ name: "Mana Power", bib: "1004", time: "00:58:30"}] }
  ]
};

function Leaderboard() {
  const allGroups = Object.entries(mockResults).flatMap(([dist, groups]) => 
    groups.map(g => ({ ...g, distance: dist }))
  );

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', padding: '0 2rem' }}>
        {allGroups.map((group, gIdx) => (
          <div key={gIdx} style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '1rem', borderLeft: '4px solid var(--accent-blue)', paddingLeft: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--accent-blue)' }}>{group.distance}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>|</span>
              {group.age}
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
                        {r.time}
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
