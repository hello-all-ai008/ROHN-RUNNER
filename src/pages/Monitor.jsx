import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useRunner } from '../context/RunnerContext';
import logoFull from '../LOGO/logo-rohn-full.png';
import logoBaanPong from '../LOGO/logo-BaanPong.jpg';
import logoMaekhaning from '../LOGO/logo-maekhaning.jpg';
import { ArrowLeft, X, GripVertical } from 'lucide-react';
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

  // Resizable split state (persisted in localStorage)
  const [leftRatio, setLeftRatio] = useState(() => {
    try {
      const saved = localStorage.getItem('rohn_monitor_split_ratio');
      const val = parseFloat(saved);
      return !isNaN(val) && val >= 20 && val <= 75 ? val : 38;
    } catch {
      return 38;
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);

  const startDragging = (e) => {
    e.preventDefault();
    setIsDragging(true);
    isDraggingRef.current = true;
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDraggingRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const totalWidth = window.innerWidth;
      if (!totalWidth) return;
      const newRatio = (clientX / totalWidth) * 100;
      const clamped = Math.min(Math.max(newRatio, 20), 75);
      setLeftRatio(clamped);
    };

    const handleStop = () => {
      if (isDraggingRef.current) {
        setIsDragging(false);
        isDraggingRef.current = false;
        try {
          localStorage.setItem('rohn_monitor_split_ratio', String(leftRatio));
        } catch {}
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleStop);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleStop);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleStop);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleStop);
    };
  }, [leftRatio]);

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
        <img src={logoFull} alt="ROHN Logo" style={{ maxWidth: '500px', marginBottom: '2rem' }} />
        <h1 style={{ fontSize: '3rem', color: 'var(--text-muted)' }}>Ready for Check-in</h1>
        <p style={{ color: 'rgba(0,0,0,0.2)', fontSize: '1.5rem', marginTop: '1rem' }}>Waiting for scanner data...</p>
      </div>

      {active && (
        <div 
          key={castEvent?.timestamp || 'initial'} 
          className="monitor-container" 
          id="activeState" 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            pointerEvents: 'auto', 
            display: 'flex', 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '2.5rem 3.5rem', 
            boxSizing: 'border-box',
            userSelect: isDragging ? 'none' : 'auto'
          }}
        >
          {/* Left: Runner details (resizable) */}
          <div style={{ 
            flex: `0 0 ${leftRatio}%`,
            width: `${leftRatio}%`,
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            boxSizing: 'border-box',
            animation: 'slideInLeft 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
          }}>
            <div className="monitor-bib" style={{ fontSize: 'clamp(5.5rem, 9vw, 10rem)', margin: 0, lineHeight: 1 }}>{displayData.bib}</div>
            <div className="monitor-name" style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)', margin: '1rem 0', textAlign: 'center', wordBreak: 'break-word' }}>{displayData.name}</div>
            <div style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)', color: 'var(--text-muted)', marginBottom: '2rem', fontWeight: 500, textAlign: 'center' }}>{displayData.distance} • {displayData.ageGroup}</div>
            <div className="status-badge" style={{ fontSize: 'clamp(1.5rem, 2.2vw, 2.5rem)', padding: '0.8rem 2.8rem', whiteSpace: 'nowrap' }}>CHECKED IN</div>
          </div>

          {/* Resizer Divider Bar */}
          <div
            onMouseDown={startDragging}
            onTouchStart={startDragging}
            onDoubleClick={() => {
              setLeftRatio(38);
              try { localStorage.setItem('rohn_monitor_split_ratio', '38'); } catch {}
            }}
            title="ลากซ้าย-ขวา เพื่อปรับขนาดสัดส่วน (ดับเบิ้ลคลิกเพื่อรีเซ็ต 38%)"
            style={{
              width: '28px',
              height: '85vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'col-resize',
              userSelect: 'none',
              zIndex: 15,
              flexShrink: 0
            }}
          >
            <div style={{
              width: '5px',
              height: isDragging ? '120px' : '75px',
              backgroundColor: isDragging ? 'var(--accent-blue, #0f172a)' : 'rgba(0, 0, 0, 0.22)',
              borderRadius: '99px',
              boxShadow: isDragging ? '0 0 12px rgba(15, 23, 42, 0.4)' : 'none',
              transition: 'height 0.2s, background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <GripVertical size={14} color={isDragging ? '#ffffff' : 'rgba(0,0,0,0.5)'} />
            </div>
          </div>
          
          {/* Right: Map & Logos */}
          {displayData.distance && (
            <div style={{ 
              flex: `0 0 calc(${100 - leftRatio}% - 32px)`,
              width: `calc(${100 - leftRatio}% - 32px)`,
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '90vh',
              padding: '0.5rem',
              boxSizing: 'border-box',
              opacity: 0, // start invisible before animation
              animation: 'slideUpMap 1s cubic-bezier(0.23, 1, 0.32, 1) 0.2s forwards'
            }}>
              <img 
                src={displayData.distance === '10KM' ? map10k : map5k} 
                alt={`${displayData.distance} Map`} 
                style={{ 
                  maxHeight: '68vh', 
                  maxWidth: '100%', 
                  objectFit: 'contain', 
                  borderRadius: '24px', 
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)', 
                  border: '2px solid rgba(255,255,255,0.05)' 
                }} 
              />

              {/* Logos under map: logo-baanpong, logo-maekhaning, logo-rohn-full */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '4.5rem', 
                marginTop: '1.2rem',
                padding: '0.8rem 4rem',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.06)',
                maxWidth: '100%',
                flexWrap: 'nowrap'
              }}>
                <img 
                  src={logoBaanPong} 
                  alt="Logo Baan Pong" 
                  style={{ height: '60px', width: 'auto', objectFit: 'contain', borderRadius: '8px' }} 
                />
                <img 
                  src={logoMaekhaning} 
                  alt="Logo Mae Khaning" 
                  style={{ height: '60px', width: 'auto', objectFit: 'contain', borderRadius: '8px' }} 
                />
                <img 
                  src={logoFull} 
                  alt="Logo ROHN Full" 
                  style={{ height: '78px', width: 'auto', objectFit: 'contain' }} 
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Monitor;
