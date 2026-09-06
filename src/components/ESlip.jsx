import React from 'react';
import './ESlip.css';
import logoBaanPong from '../LOGO/logo-BaanPong.jpg';
import logoMaekhaning from '../LOGO/logo-maekhaning.jpg';
import logoRohn from '../LOGO/logo-rohn-full.png';
import logoRohnLabel from '../LOGO/logo-rohn-label.png';

export default function ESlip({ runner, overallRank, catRank, stations = [] }) {
  if (!runner) return null;

  const fmtTime = (ts) => {
    if (!ts) return '—';
    try {
      const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
      return isNaN(d.getTime()) ? '—' : d.toTimeString().slice(0, 8);
    } catch {
      return '—';
    }
  };

  const fmtDate = (ts) => {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  const fmtDur = (ms) => {
    if (ms == null || isNaN(ms) || ms < 0) return '—';
    const s = Math.floor(ms / 1e3);
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${ss}`;
  };

  const printTime = new Date().toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  // Calculate sorted checkpoints
  const cpEntries = Object.entries(runner.cps || {}).sort((a, b) => Number(a[1]) - Number(b[1]));

  const firstCpOrStartTime = runner.gun_start_time
    ? new Date(runner.gun_start_time).getTime()
    : (cpEntries.length > 0 ? Number(cpEntries[0][1]) : (runner.checked_in_at ? new Date(runner.checked_in_at).getTime() : null));

  const netTimeMs = (runner.finish && firstCpOrStartTime) ? (Number(runner.finish) - Number(firstCpOrStartTime)) : null;

  return (
    <div className="eslip" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: '12px', right: '16px', fontSize: '9px', color: '#64748b' }}>
        Printed: {printTime}
      </div>
      <div className="head" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img
          src={logoBaanPong}
          alt="Baan Pong Trail Logo"
          style={{ height: '75px', maxWidth: '180px', width: 'auto', objectFit: 'contain', marginBottom: '8px' }}
        />
        <span style={{ fontSize: '13px', fontWeight: 600 }}>Official e-Slip</span>
      </div>

      <div className="row">
        <span>Name</span>
        <b style={{ textAlign: 'right' }}>{runner.name || '—'}</b>
      </div>
      <div className="row">
        <span>BIB</span>
        <b>{runner.bib || '—'}</b>
      </div>
      <div className="row">
        <span>Category</span>
        <b>{runner.cat_name || runner.distance || runner.cat || '—'}</b>
      </div>
      <div className="row">
        <span>Gender/Age Group</span>
        <b>{runner.gender || '—'} · {runner.age_group || runner.ageGroup || '—'}</b>
      </div>

      <div className="hr"></div>

      <div className="row">
        <span>Check-in Scan</span>
        <span style={{ fontFamily: 'monospace' }}>{fmtTime(runner.checkin || runner.checked_in_at)}</span>
      </div>

      {runner.gun_start_time && (
        <div className="row">
          <span>Start (Gun Time)</span>
          <span style={{ fontFamily: 'monospace' }}>{fmtTime(runner.gun_start_time)}</span>
        </div>
      )}

      {cpEntries.map(([cp, ts], idx) => {
        const stationName = stations?.find(s => s.id === cp)?.name || `Checkpoint ${idx + 1}`;
        return (
          <div className="row" key={cp}>
            <span>{stationName}</span>
            <span style={{ fontFamily: 'monospace' }}>{fmtTime(ts)}</span>
          </div>
        );
      })}

      <div className="row">
        <span>Finish</span>
        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{fmtTime(runner.finish)}</span>
      </div>

      <div className="hr"></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '14px 0' }}>
        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>Start date</div>
          <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'monospace' }}>
            {runner.gun_start_time
              ? fmtDate(runner.gun_start_time)
              : (runner.start_date
                  ? fmtDate(runner.start_date)
                  : (cpEntries.length > 0
                      ? fmtDate(cpEntries[0][1])
                      : (runner.checked_in_at ? fmtDate(runner.checked_in_at) : fmtDate(Date.now()))))}
          </div>
        </div>
        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>Net Time (Start-Finish)</div>
          <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'monospace', color: '#3b82f6' }}>
            {fmtDur(netTimeMs)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
        <div style={{ flex: 1, background: '#f8fafc', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Overall Rank</div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>#{overallRank || '—'}</div>
        </div>
        <div style={{ flex: 1, background: '#f8fafc', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Category Rank</div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>#{catRank || '—'}</div>
        </div>
      </div>

      <div className="hr" style={{ marginTop: '14px', marginBottom: '12px' }}></div>

      <div className="foot" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <img
            src={logoMaekhaning}
            alt="Mae Khaning Logo"
            style={{ height: '52px', maxWidth: '120px', width: 'auto', objectFit: 'contain', borderRadius: '4px' }}
          />
          <img
            src={logoRohn}
            alt="ROHN Logo"
            style={{ height: '75px', maxWidth: '200px', width: 'auto', objectFit: 'contain' }}
          />
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
          <span>Timing System by</span>
          <img 
            src={logoRohnLabel} 
            alt="ROHN" 
            style={{ height: '32px', width: 'auto', objectFit: 'contain' }} 
          />
        </div>
        <span style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>* Provisional Result ( Subject to change)</span>
      </div>
    </div>
  );
}
