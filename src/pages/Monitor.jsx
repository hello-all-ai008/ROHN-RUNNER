import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useRunner } from '../context/RunnerContext';
import logoFull from '../LOGO/logo-rohn-full.png';
import { ArrowLeft, X } from 'lucide-react';
import map5k from '../pic/map5k2.jpg';
import map10k from '../pic/map10k2.jpg';

function Monitor() {
  const { id } = useParams();
  const monitorId = id || '1';
  const navigate = useNavigate();
  const { castEvent, getRunnerByBib, castToMonitor } = useRunner();
  
  const [active, setActive] = useState(false);
  const [displayData, setDisplayData] = useState({ bib: '----', name: 'Runner Name', distance: '', ageGroup: '' });
  const [manualBib, setManualBib] = useState('');

  useEffect(() => {
    const applyEvent = (evt) => {
      if (!evt) return;
      const targetId = String(evt.monitorId);
      if (targetId === String(monitorId) || targetId === 'all') {
        setDisplayData({ 
          bib: evt.bib || '----', 
          name: evt.name || 'Runner Name', 
          distance: evt.distance || '', 
          ageGroup: evt.ageGroup || evt.age_group || '' 
        });
        setActive(true);
      }
    };

    if (castEvent) {
      applyEvent(castEvent);
    }

    let bc;
    try {
      bc = new BroadcastChannel('rohn_monitor_channel');
      bc.onmessage = (e) => {
        if (e.data) applyEvent(e.data);
      };
    } catch {}

    const handleMessage = (e) => {
      if (e.data && (e.data.type === 'ROHN_MONITOR_CAST' || e.data.monitorId)) {
        applyEvent(e.data);
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('message', handleMessage);
    };
  }, [castEvent, monitorId]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualBib.trim()) return;
    const runner = getRunnerByBib(manualBib.trim());
    if (runner) {
      castToMonitor(monitorId, runner.bib, runner.name, runner.distance, runner.ageGroup);
    } else {
      castToMonitor(monitorId, manualBib.trim(), 'NOT FOUND', '-', '-');
    }
    setManualBib('');
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-dark)', height: '100vh', overflow: 'hidden' }} className={active ? 'show-active' : ''}>
      <Link to="/" className="btn-back" style={{ position: 'absolute', top: '2rem', left: '2rem' }}><ArrowLeft size={18} /> กลับหน้าหลัก (Home)</Link>
      
      <div style={{ position: 'absolute', top: '2rem', right: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 10 }}>
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            placeholder="Manual BIB" 
            value={manualBib}
            onChange={e => setManualBib(e.target.value)}
            style={{ 
              backgroundColor: '#ffffff', 
              padding: '0.5rem 1rem', 
              borderRadius: '8px', 
              color: '#000000', 
              border: '1px solid #cbd5e1',
              outline: 'none',
              width: '120px'
            }}
          />
          <button type="submit" style={{
            backgroundColor: 'var(--accent-blue)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>Enter</button>
        </form>

        <div style={{ width: '1px', height: '30px', backgroundColor: 'rgba(255,255,255,0.2)' }}></div>

        <label style={{ color: 'var(--text-muted)', fontWeight: 600 }}>เลือกจอ:</label>
        <select 
          value={monitorId} 
          onChange={(e) => navigate(`/monitor/${e.target.value}`)}
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.1)', 
            padding: '0.5rem 1rem', 
            borderRadius: '8px', 
            color: 'var(--text-main)', 
            fontWeight: 'bold',
            border: '1px solid rgba(255,255,255,0.2)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="1" style={{ color: '#000' }}>Monitor 1</option>
          <option value="2" style={{ color: '#000' }}>Monitor 2</option>
          <option value="3" style={{ color: '#000' }}>Monitor 3</option>
          <option value="4" style={{ color: '#000' }}>Monitor 4</option>
          <option value="5" style={{ color: '#000' }}>Monitor 5</option>
        </select>

        {active && (
          <button 
            type="button" 
            onClick={() => setActive(false)}
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1.2rem',
              cursor: 'pointer',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
              fontSize: '0.95rem'
            }}
            title="กดเพื่อปิดการแสดงข้อมูลนักวิ่งคนนี้ และกลับสู่หน้ารอการสแกน"
          >
            <X size={18} /> ปิดแสดงรายชื่อ
          </button>
        )}
      </div>

      <div className="monitor-container" id="idleState" style={{ opacity: active ? 0 : 1, transform: active ? 'scale(0.95)' : 'scale(1)', transition: 'all 0.5s ease', pointerEvents: active ? 'none' : 'auto' }}>
        <img src={logoFull} alt="ROHN Logo" style={{ maxWidth: '400px', marginBottom: '2rem' }} />
        <h1 style={{ fontSize: '3rem', color: 'var(--text-muted)' }}>Ready for Check-in</h1>
        <p style={{ color: 'rgba(0,0,0,0.2)', fontSize: '1.5rem', marginTop: '1rem' }}>Waiting for scanner data...</p>
      </div>

      {active && (
        <div key={castEvent?.timestamp || 'initial'} className="monitor-container" id="activeState" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'auto', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '4rem', boxSizing: 'border-box' }}>
          <div style={{ 
            flex: '0 0 35%',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            animation: 'slideInLeft 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
          }}>
            <div className="monitor-bib" style={{ fontSize: '10rem', margin: 0, lineHeight: 1 }}>{displayData.bib}</div>
            <div className="monitor-name" style={{ fontSize: '4rem', margin: '1rem 0', textAlign: 'center' }}>{displayData.name}</div>
            <div style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '2rem', fontWeight: 500 }}>{displayData.distance} • {displayData.ageGroup}</div>
            <div className="status-badge" style={{ fontSize: '2.5rem', padding: '1rem 3rem' }}>CHECKED IN</div>
            
            <button
              type="button"
              onClick={() => setActive(false)}
              style={{
                marginTop: '2rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: '2px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '16px',
                padding: '0.8rem 2.2rem',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '1.4rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.15)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#ef4444';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.color = '#ef4444';
              }}
              title="ปิดการแสดงผลรายชื่อนักวิ่งคนนี้"
            >
              <X size={26} /> ปิดแสดงรายชื่อ
            </button>
          </div>
          
          {displayData.distance && (
            <div style={{ 
              flex: '0 0 60%',
              display: 'flex', justifyContent: 'center', alignItems: 'center', height: '90vh',
              opacity: 0, // start invisible before animation
              animation: 'slideUpMap 1s cubic-bezier(0.23, 1, 0.32, 1) 0.2s forwards'
            }}>
              <img 
                src={displayData.distance === '10KM' ? map10k : map5k} 
                alt={`${displayData.distance} Map`} 
                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', borderRadius: '30px', boxShadow: '0 30px 60px rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.05)' }} 
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Monitor;
