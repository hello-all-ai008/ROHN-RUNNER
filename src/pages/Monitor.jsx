import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useRunner } from '../context/RunnerContext';
import { supabase } from '../lib/supabaseClient';
import logoFull from '../LOGO/logo-rohn-full.png';
import logoBaanPong from '../LOGO/logo-BaanPong.jpg';
import logoMaekhaning from '../LOGO/logo-maekhaning.jpg';
import { ArrowLeft, X, GripVertical } from 'lucide-react';
import map5k from '../pic/map5k2.jpg';
import map10k from '../pic/map10k2.jpg';

function formatStartDateTime(startVal, fallbackRunners = []) {
  let dateObj = null;
  if (startVal) {
    const d = new Date(startVal);
    if (!isNaN(d.getTime())) dateObj = d;
  }

  // Fallback date from other runners in the same event if available
  let eventDateStr = '13 ก.ย. 2026';
  if (!dateObj && Array.isArray(fallbackRunners)) {
    const refRunner = fallbackRunners.find(r => r.gun_start_time || r.checkin || r.checked_in_at);
    if (refRunner) {
      const refVal = refRunner.gun_start_time || refRunner.checkin || refRunner.checked_in_at;
      const rd = new Date(refVal);
      if (!isNaN(rd.getTime())) {
        const thaiMonth = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][rd.getMonth()];
        eventDateStr = `${rd.getDate()} ${thaiMonth} ${rd.getFullYear()}`;
      }
    }
  }

  if (dateObj) {
    const time = dateObj.toLocaleTimeString('th-TH', {
      timeZone: 'Asia/Bangkok',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const thaiMonth = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][dateObj.getMonth()];
    const date = `${dateObj.getDate()} ${thaiMonth} ${dateObj.getFullYear()}`;
    return { time, date, hasTime: true };
  }

  return { time: '--:--:--', date: eventDateStr, hasTime: false };
}

// Single source of truth for resolving a "check in" timestamp. Never lets a
// gunStartTime fallback be mistaken for a real checkin — callers must use
// `isRealCheckin` to decide how to label the value.
function resolveCheckinTime(evt, runner, gunStartTime) {
  if (evt?.checkinTime) return { checkinTime: evt.checkinTime, isRealCheckin: true };
  if (runner?.checkin) return { checkinTime: runner.checkin, isRealCheckin: true };
  if (runner?.checked_in_at) return { checkinTime: runner.checked_in_at, isRealCheckin: true };
  if (gunStartTime) return { checkinTime: gunStartTime, isRealCheckin: false };
  return { checkinTime: null, isRealCheckin: false };
}

function Monitor() {
  const { id } = useParams();
  const monitorId = id || '1';
  const navigate = useNavigate();
  const { castEvent, getRunnerByBib, castToMonitor, runners } = useRunner();

  // Keep a ref to the latest getRunnerByBib so callbacks that must stay
  // referentially stable (applyEvent) never close over a stale version.
  const getRunnerByBibRef = useRef(getRunnerByBib);
  useEffect(() => { getRunnerByBibRef.current = getRunnerByBib; });

  const [active, setActive] = useState(false);
  const [displayData, setDisplayData] = useState({
    bib: '----',
    name: 'Runner Name',
    distance: '',
    ageGroup: '',
    source: 'rohn_runner_scanner',
    gunStartTime: null,
    checkinTime: null,
    isRealCheckin: false
  });
  const [manualBib, setManualBib] = useState('');
  const [showControls, setShowControls] = useState(false);

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
        } catch { }
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

  const applyEvent = useCallback((evt) => {
    if (!evt) return;
    const targetId = String(evt.monitorId);
    if (targetId === String(monitorId) || targetId === 'all') {
      const bib = evt.bib || '----';
      const runner = getRunnerByBibRef.current(bib);
      const gunStartTime = evt.gunStartTime || runner?.gun_start_time || null;
      const { checkinTime, isRealCheckin } = resolveCheckinTime(evt, runner, gunStartTime);
      const isScanner = evt.source === 'rohn_runner_scanner';

      setDisplayData({
        bib: bib,
        name: evt.name || runner?.name || 'Runner Name',
        distance: evt.distance || runner?.distance || '',
        ageGroup: evt.ageGroup || evt.age_group || runner?.ageGroup || '',
        source: isScanner ? 'rohn_runner_scanner' : 'rohn_admin_checkin',
        gunStartTime: gunStartTime,
        checkinTime: checkinTime,
        isRealCheckin: isRealCheckin
      });
      setActive(true);
    }
  }, [monitorId]);

  // (Removed) Do not restore last cast event from localStorage on mount to prevent showing old bib

  // React to live castEvent updates from context.
  useEffect(() => {
    if (castEvent) applyEvent(castEvent);
  }, [castEvent, applyEvent]);

  // Subscribe to realtime transports. Must NOT depend on castEvent, or the
  // channel/BroadcastChannel/listener gets torn down and recreated on every
  // single broadcast.
  useEffect(() => {
    // 1. Supabase Realtime Channel for instant cross-device/cross-origin updates
    const supabaseChannel = supabase.channel('rohn_monitor_stream', {
      config: { broadcast: { ack: false } }
    });
    supabaseChannel.on('broadcast', { event: 'monitor_cast' }, ({ payload }) => {
      if (payload) {
        applyEvent(payload);
      }
    });
    supabaseChannel.subscribe();

    // 2. BroadcastChannel for fast same-origin tab sync
    let bc;
    try {
      bc = new BroadcastChannel('rohn_monitor_channel');
      bc.onmessage = (e) => {
        if (e.data) applyEvent(e.data);
      };
    } catch { }

    // 3. Window postMessage for child/popout windows
    const handleMessage = (e) => {
      if (e.data && (e.data.type === 'ROHN_MONITOR_CAST' || e.data.monitorId)) {
        applyEvent(e.data);
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      supabase.removeChannel(supabaseChannel);
      if (bc) bc.close();
      window.removeEventListener('message', handleMessage);
    };
  }, [monitorId, applyEvent]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualBib.trim()) return;
    const runner = getRunnerByBib(manualBib.trim());
    if (runner) {
      const { checkinTime, isRealCheckin } = resolveCheckinTime(null, runner, runner.gun_start_time);
      castToMonitor(monitorId, runner.bib, runner.name, runner.distance, runner.ageGroup, {
        source: 'rohn_runner_scanner',
        gunStartTime: runner.gun_start_time,
        checkinTime: checkinTime,
        isRealCheckin: isRealCheckin
      });
    } else {
      castToMonitor(monitorId, manualBib.trim(), 'NOT FOUND', '-', '-', {
        source: 'rohn_runner_scanner',
        gunStartTime: null,
        checkinTime: null,
        isRealCheckin: false
      });
    }
    setManualBib('');
  };

  const displayRunner = getRunnerByBib(displayData.bib);
  const { checkinTime: effectiveTime, isRealCheckin } = displayData.checkinTime
    ? { checkinTime: displayData.checkinTime, isRealCheckin: displayData.isRealCheckin }
    : resolveCheckinTime(null, displayRunner, displayData.gunStartTime || displayRunner?.gun_start_time);
  const startInfo = formatStartDateTime(effectiveTime, runners);

  return (
    <div style={{ backgroundColor: 'var(--bg-dark)', height: '100vh', overflow: 'hidden' }} className={active ? 'show-active' : ''}>
      <style>{`
        @media (max-width: 768px) {
          #activeState, #idleState {
            flex-direction: column !important;
            padding: 1rem !important;
            padding-top: 8.5rem !important;
            justify-content: flex-start !important;
          }
          #activeState > div:first-child {
            flex: 0 0 auto !important;
            width: 100% !important;
            padding: 0.5rem !important;
          }
          #activeState > div:first-child .monitor-bib {
            font-size: clamp(3.5rem, 15vw, 5rem) !important;
          }
          #activeState > div:first-child .monitor-name {
            font-size: clamp(1.2rem, 7vw, 2rem) !important;
            margin: 0.2rem 0 !important;
          }
          #activeState > div:first-child > div:nth-child(3) {
            font-size: clamp(0.9rem, 4vw, 1.2rem) !important;
            margin-bottom: 0.5rem !important;
          }
          .resizer-bar {
            display: none !important;
          }
          #activeState > div:last-child {
            flex: 1 1 auto !important;
            width: 100% !important;
            height: auto !important;
            padding: 0 !important;
            justify-content: center !important;
          }
          #activeState > div:last-child img:first-child {
            max-height: 40vh !important;
          }
          .monitor-logos {
            gap: 1rem !important;
            padding: 0.5rem 1rem !important;
            margin-top: 0.5rem !important;
          }
          .monitor-logos img {
            height: 45px !important;
          }
          .status-badge {
            padding: 0.5rem 1.5rem !important;
            font-size: clamp(1rem, 5vw, 1.2rem) !important;
          }
          .status-badge > div:last-child {
             font-size: clamp(1.5rem, 6vw, 2rem) !important;
          }
          .top-controls-wrapper {
            top: 0.8rem !important;
            right: 0.8rem !important;
            align-items: flex-end !important;
          }
          .top-controls {
            flex-wrap: wrap !important;
            justify-content: flex-end !important;
            max-width: 90vw !important;
            gap: 0.5rem !important;
            padding: 0.8rem !important;
          }
          .top-controls form {
            width: 100%;
            justify-content: flex-end;
          }
          .top-controls form input {
            width: 80px !important;
            padding: 0.3rem 0.5rem !important;
            font-size: 0.8rem !important;
          }
          .top-controls form button, .top-controls select, .top-controls > button {
            padding: 0.3rem 0.6rem !important;
            font-size: 0.8rem !important;
          }
          .btn-back {
            top: 0.8rem !important;
            left: 0.8rem !important;
            padding: 0.4rem 0.8rem !important;
            font-size: 0.85rem !important;
          }
        }
      `}</style>
      <Link to="/" className="btn-back" style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 20 }}><ArrowLeft size={18} /> กลับหน้าหลัก (Home)</Link>

      <div className="top-controls-wrapper" style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
        <button
          onClick={() => setShowControls(!showControls)}
          style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50px',
            padding: '0.5rem 1.2rem',
            color: '#000',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backdropFilter: 'blur(10px)',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}
        >
          {showControls ? <X size={16} /> : '⚙️'} {showControls ? 'ซ่อน (Close)' : 'ตั้งค่า (Settings)'}
        </button>

        {showControls && (
          <div className="top-controls" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            padding: '1rem',
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
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
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 'bold',
                border: '1px solid rgba(255,255,255,0.2)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="1" style={{ color: '#000000ff' }}>Monitor 1</option>
              <option value="2" style={{ color: '#000000ff' }}>Monitor 2</option>
              <option value="3" style={{ color: '#000000ff' }}>Monitor 3</option>
              <option value="4" style={{ color: '#000000ff' }}>Monitor 4</option>
              <option value="5" style={{ color: '#000000ff' }}>Monitor 5</option>
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
            <div
              className="status-badge"
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.6rem 2.4rem',
                borderRadius: '24px',
                whiteSpace: 'nowrap'
              }}
            >
              <div style={{
                fontSize: 'clamp(0.85rem, 1.2vw, 1.15rem)',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                opacity: 0.9,
                marginBottom: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>{isRealCheckin ? 'Check in' : 'Start (scheduled)'}</span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span>{startInfo.date}</span>
              </div>
              <div style={{
                fontSize: 'clamp(2.5rem, 4.2vw, 4.5rem)',
                fontWeight: 900,
                letterSpacing: '2px',
                lineHeight: 1.05,
                fontFamily: 'monospace'
              }}>
                {startInfo.time}
              </div>
            </div>
          </div>

          {/* Resizer Divider Bar */}
          <div
            className="resizer-bar"
            onMouseDown={startDragging}
            onTouchStart={startDragging}
            onDoubleClick={() => {
              setLeftRatio(38);
              try { localStorage.setItem('rohn_monitor_split_ratio', '38'); } catch { }
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
              height: '100vh',
              padding: '2rem 0.5rem 2rem 0.5rem',
              boxSizing: 'border-box',
              opacity: 0, // start invisible before animation
              animation: 'slideUpMap 1s cubic-bezier(0.23, 1, 0.32, 1) 0.2s forwards'
            }}>
              <img
                src={displayData.distance === '10KM' ? map10k : map5k}
                alt={`${displayData.distance} Map`}
                style={{
                  maxHeight: '75vh',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  borderRadius: '24px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                  border: '2px solid rgba(255,255,255,0.05)'
                }}
              />

              {/* Logos under map: logo-baanpong, logo-maekhaning, logo-rohn-full */}
              <div className="monitor-logos" style={{
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
