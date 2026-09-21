import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRunner } from '../context/RunnerContext';
import { normalizeScannedBib } from '../lib/bibUtils';
import { getRunnerRaceStatus, getRunnerNetTime, formatDuration, formatTime } from '../lib/results';
import ESlip, { computeRunnerRanks, formatEnglishLabel } from '../components/ESlip';
import logoFull from '../LOGO/logo-rohn-full.png';
import { 
  ArrowLeft, 
  Search, 
  Printer, 
  User, 
  Trophy, 
  Medal, 
  Timer, 
  CheckCircle2, 
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function ESlipPrintStation() {
  const { runners, stations, categories, loading } = useRunner();
  const [query, setQuery] = useState('');
  const [selectedBib, setSelectedBib] = useState(null);
  const [autoPrint, setAutoPrint] = useState(() => {
    try {
      const saved = localStorage.getItem('rohn_auto_print_eslip');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });
  const [showSlipPreview, setShowSlipPreview] = useState(true);
  const [printFeedback, setPrintFeedback] = useState(null);

  const inputRef = useRef(null);
  const printTimeoutRef = useRef(null);

  // Focus search box on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Save autoPrint preference
  const handleToggleAutoPrint = (val) => {
    setAutoPrint(val);
    try {
      localStorage.setItem('rohn_auto_print_eslip', String(val));
    } catch {}
  };

  // Find selected runner
  const selectedRunner = useMemo(() => {
    if (!selectedBib || !runners?.length) return null;
    return runners.find(r => String(r.bib || '').trim().toLowerCase() === String(selectedBib).trim().toLowerCase()) || null;
  }, [selectedBib, runners]);

  // Compute live ranks for the selected runner
  const ranks = useMemo(() => {
    if (!selectedRunner) return null;
    return computeRunnerRanks(selectedRunner, runners);
  }, [selectedRunner, runners]);

  // Trigger browser print
  const triggerPrint = (runnerToPrint) => {
    if (!runnerToPrint) return;
    const bib = runnerToPrint.bib || '—';
    setPrintFeedback(`กำลังพิมพ์ใบ E-Slip สำหรับ BIB ${bib}...`);

    const prevTitle = document.title;
    document.title = '';

    setTimeout(() => {
      window.print();
      document.title = prevTitle || 'ROHN Runner';
      setPrintFeedback(`ส่งคำสั่งพิมพ์สำหรับ BIB ${bib} สำเร็จ!`);
      setTimeout(() => setPrintFeedback(null), 3000);

      // Re-focus search input and select text for next runner
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
    }, 120);
  };

  // Handle Search Input Submission or Barcode Enter
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const cleanBib = normalizeScannedBib(query);
    if (!cleanBib) return;

    // Search exact BIB first
    let found = (runners || []).find(r => String(r.bib || '').trim().toLowerCase() === cleanBib.toLowerCase());

    // If not found by exact bib, try name search
    if (!found) {
      found = (runners || []).find(r => 
        r.name && String(r.name).toLowerCase().includes(cleanBib.toLowerCase())
      );
    }

    if (found) {
      setSelectedBib(found.bib);
      if (autoPrint) {
        if (printTimeoutRef.current) clearTimeout(printTimeoutRef.current);
        printTimeoutRef.current = setTimeout(() => {
          triggerPrint(found);
        }, 150);
      }
    } else {
      setSelectedBib(null);
      setPrintFeedback(`ไม่พบข้อมูลนักวิ่งสำหรับ "${query}"`);
      setTimeout(() => setPrintFeedback(null), 3000);
    }
  };

  // Autocomplete suggestions when typing
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !runners?.length || (selectedRunner && String(selectedRunner.bib) === q)) return [];
    return runners
      .filter(r => 
        String(r.bib || '').toLowerCase().includes(q) || 
        String(r.name || '').toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [query, runners, selectedRunner]);

  const selectSuggestion = (runner) => {
    setQuery(runner.bib);
    setSelectedBib(runner.bib);
    if (autoPrint) {
      setTimeout(() => triggerPrint(runner), 150);
    }
  };

  // Runner stats calculation
  const runnerStatus = selectedRunner ? getRunnerRaceStatus(selectedRunner) : null;
  const netInfo = useMemo(() => selectedRunner ? getRunnerNetTime(selectedRunner) : { netTimeMs: null }, [selectedRunner]);
  const netTimeStr = netInfo.netTimeMs != null ? formatDuration(netInfo.netTimeMs) : null;
  const gunTimeStr = selectedRunner?.finish ? formatTime(selectedRunner.finish) : null;
  const cleanGender = selectedRunner ? formatEnglishLabel(selectedRunner.gender) : '—';
  const cleanAgeGroup = selectedRunner ? formatEnglishLabel(selectedRunner.age_group || selectedRunner.ageGroup || selectedRunner.age) : '—';

  return (
    <div className="container" style={{ maxWidth: '1200px', minHeight: '100vh', padding: '1.5rem 1rem' }}>
      
      {/* Top Navigation & Status Bar (Hidden during print) */}
      <div className="hide-on-print" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/summary" className="btn-back" style={{ marginBottom: 0 }}>
            <ArrowLeft size={18} /> กลับหน้าสรุปผล (Summary)
          </Link>
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--line, #cbd5e1)' }}></div>
          <Link to="/dashboard" style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>
            Dashboard
          </Link>
        </div>

        {/* Auto Print Checkbox Card */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 16px',
          borderRadius: '10px',
          background: autoPrint ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card, #f8fafc)',
          border: `1.5px solid ${autoPrint ? '#10b981' : 'var(--line, #cbd5e1)'}`,
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.15s ease'
        }}>
          <input
            type="checkbox"
            checked={autoPrint}
            onChange={(e) => handleToggleAutoPrint(e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
          />
          <span style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: autoPrint ? '#059669' : 'var(--text-muted, #64748b)'
          }}>
            {autoPrint ? '⚡ พิมพ์อัตโนมัติ (Auto Print เมื่อพบ BIB)' : '✋ ยังไม่ต้องปริ้น (กดพิมพ์เอง)'}
          </span>
        </label>
      </div>

      {/* Main Header (Hidden during print) */}
      <div className="hide-on-print" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <img src={logoFull} alt="ROHN Logo" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} />
        <div style={{ width: '2px', height: '40px', backgroundColor: 'var(--line, #cbd5e1)' }}></div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink, #1e293b)' }}>
            จุดพิมพ์ใบ E-Slip (Print Station)
          </h1>
          <p style={{ margin: '2px 0 0', color: 'var(--text-muted, #64748b)', fontSize: '0.85rem' }}>
            ค้นหาหมายเลข BIB หรือสแกนบาร์โค้ดเพื่อพิมพ์สลิปผลการแข่งขันทันที
          </p>
        </div>
      </div>

      {/* Search Input Box (Hidden during print) */}
      <div className="hide-on-print card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'var(--surface, #ffffff)', border: '1px solid var(--line, #e2e8f0)', borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search 
                size={22} 
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} 
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="พิมพ์หมายเลข BIB หรือชื่อนักวิ่ง (เช่น 1001, สมชาย) แล้วกด Enter..."
                style={{
                  width: '100%',
                  padding: '14px 44px 14px 48px',
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  borderRadius: '10px',
                  border: '2px solid #3b82f6',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: 'var(--bg, #f8fafc)',
                  color: 'var(--ink, #0f172a)'
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setSelectedBib(null); inputRef.current?.focus(); }}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    padding: '4px'
                  }}
                  title="ล้างคำค้นหา"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 24px',
                borderRadius: '10px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
                whiteSpace: 'nowrap'
              }}
            >
              <Search size={18} /> ค้นหา
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              zIndex: 50,
              overflow: 'hidden'
            }}>
              {suggestions.map((r) => (
                <div
                  key={r.bib}
                  onClick={() => selectSuggestion(r)}
                  style={{
                    padding: '10px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background 0.1s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 800, color: '#2563eb', fontFamily: 'monospace', fontSize: '1rem' }}>BIB {r.bib}</span>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{r.name}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {r.distance ? `${r.distance} KM` : ''} • {formatEnglishLabel(r.gender)} • {r.age_group || '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </form>

        {/* Feedback message banner */}
        {printFeedback && (
          <div style={{
            marginTop: '12px',
            padding: '8px 14px',
            borderRadius: '8px',
            background: printFeedback.includes('ไม่พบ') ? '#fef2f2' : '#ecfdf5',
            color: printFeedback.includes('ไม่พบ') ? '#dc2626' : '#059669',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {printFeedback.includes('ไม่พบ') ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {printFeedback}
          </div>
        )}
      </div>

      {/* Runner Information & Action Container */}
      {selectedRunner ? (
        <div style={{ display: 'grid', gridTemplateColumns: showSlipPreview ? '1.2fr 0.8fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Left Column: Runner Information Cards */}
          <div className="hide-on-print">
            
            {/* Header Identity Card */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem', background: 'var(--surface, #ffffff)', border: '1px solid var(--line, #e2e8f0)', borderRadius: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{
                      background: '#2563eb',
                      color: '#ffffff',
                      fontSize: '1.4rem',
                      fontWeight: 900,
                      padding: '4px 14px',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      letterSpacing: '1px'
                    }}>
                      BIB {selectedRunner.bib || '—'}
                    </span>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      background: runnerStatus === 'FINISHED' ? '#ecfdf5' : (runnerStatus === 'IN_RACE' ? '#eff6ff' : '#fef2f2'),
                      color: runnerStatus === 'FINISHED' ? '#059669' : (runnerStatus === 'IN_RACE' ? '#2563eb' : '#dc2626')
                    }}>
                      {runnerStatus === 'FINISHED' ? '✅ FINISHED' : (runnerStatus === 'IN_RACE' ? '🏃 IN RACE' : 'DNF / DNS')}
                    </span>
                  </div>
                  <h2 style={{ margin: '6px 0 0', fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink, #1e293b)' }}>
                    {selectedRunner.name || '—'}
                  </h2>
                </div>

                {/* Print Button */}
                <button
                  type="button"
                  onClick={() => triggerPrint(selectedRunner)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                >
                  <Printer size={22} /> พิมพ์ใบ E-Slip
                </button>
              </div>

              {/* Basic Runner Metadata Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', padding: '12px', background: 'var(--bg, #f8fafc)', borderRadius: '10px', border: '1px solid var(--line, #e2e8f0)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ระยะ / รุ่น (Distance)</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                    {selectedRunner.distance ? `${selectedRunner.distance} KM` : '—'} 
                    {selectedRunner.cat_name ? ` : ${selectedRunner.cat_name}` : ''}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>เพศ (Gender)</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{cleanGender}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>กลุ่มอายุ (Age Group)</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{cleanAgeGroup}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>เวลาสุทธิ (Net Time)</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#2563eb', fontFamily: 'monospace' }}>
                    {netTimeStr || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Dedicated Rank Cards (Overall, Age Group, Gender Overall) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1rem' }}>
              
              {/* Overall Rank */}
              <div className="card" style={{ padding: '1.25rem 1rem', textAlign: 'center', background: 'var(--surface, #ffffff)', border: '1.5px solid #cbd5e1', borderRadius: '12px' }}>
                <div style={{ display: 'inline-flex', padding: '8px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', marginBottom: '8px' }}>
                  <Trophy size={20} />
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Overall Rank (อันดับรวม)
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>
                  {ranks?.overallDisplay || '—'}
                </div>
              </div>

              {/* Age Group Rank */}
              <div className="card" style={{ padding: '1.25rem 1rem', textAlign: 'center', background: 'var(--surface, #ffffff)', border: '1.5px solid #cbd5e1', borderRadius: '12px' }}>
                <div style={{ display: 'inline-flex', padding: '8px', borderRadius: '10px', background: '#f5f3ff', color: '#7c3aed', marginBottom: '8px' }}>
                  <Medal size={20} />
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Age Group (อันดับรุ่นอายุ)
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>
                  {ranks?.catDisplay || '—'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600, marginTop: '2px' }}>
                  {cleanAgeGroup}
                </div>
              </div>

              {/* Gender Overall Rank ("overall เฉพาะเพศนั้นๆ") */}
              <div className="card" style={{ padding: '1.25rem 1rem', textAlign: 'center', background: 'var(--surface, #ffffff)', border: '1.5px solid #cbd5e1', borderRadius: '12px' }}>
                <div style={{ display: 'inline-flex', padding: '8px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', marginBottom: '8px' }}>
                  <User size={20} />
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Gender Overall (เฉพาะเพศ)
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>
                  {ranks?.genderDisplay || '—'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                  {cleanGender}
                </div>
              </div>
            </div>

            {/* Toggle Preview Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowSlipPreview(!showSlipPreview)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {showSlipPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                {showSlipPreview ? 'ซ่อนตัวอย่างสลิป' : 'แสดงตัวอย่างสลิป (Slip Preview)'}
              </button>
            </div>
          </div>

          {/* Right Column: Physical E-Slip Preview & Print Target */}
          {showSlipPreview && (
            <div className="card hide-on-print" style={{ 
              padding: '1.5rem', 
              background: '#f8fafc', 
              border: '1px solid #cbd5e1', 
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '10px' }}>
                📄 ตัวอย่างใบสลิปความร้อน (80mm Thermal Receipt)
              </div>
              <div style={{ 
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)', 
                borderRadius: '8px', 
                overflow: 'hidden',
                background: '#ffffff'
              }}>
                <ESlip
                  runner={selectedRunner}
                  overallRank={ranks?.overallRank}
                  catRank={ranks?.catRank}
                  runners={runners}
                  stations={stations}
                  categories={categories}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State / Standby Screen */
        <div className="hide-on-print card" style={{ padding: '3.5rem 2rem', textAlign: 'center', background: 'var(--surface, #ffffff)', border: '2px dashed var(--line, #cbd5e1)', borderRadius: '16px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', marginBottom: '1rem' }}>
            <Printer size={36} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink, #1e293b)' }}>
            พร้อมพิมพ์สลิปทันที (Ready to Print)
          </h3>
          <p style={{ margin: 0, color: 'var(--text-muted, #64748b)', fontSize: '0.95rem', maxWidth: '450px', marginInline: 'auto' }}>
            พิมพ์หมายเลข BIB ในช่องค้นหาด้านบน หรือใช้เครื่องสแกนบาร์โค้ดยิงที่บิบ ระบบจะดึงข้อมูลนักวิ่งและสั่งพิมพ์ใบ E-Slip ให้อัตโนมัติ
          </p>
        </div>
      )}

      {/* Dedicated Clean Printable Container (Rendered during window.print()) */}
      {selectedRunner && (
        <div className="eslip-print-target" style={{ display: 'none' }}>
          <ESlip
            runner={selectedRunner}
            overallRank={ranks?.overallRank}
            catRank={ranks?.catRank}
            runners={runners}
            stations={stations}
            categories={categories}
          />
        </div>
      )}

      {/* Print Specific Injected CSS */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .hide-on-print {
            display: none !important;
            visibility: hidden !important;
          }
          .eslip-print-target {
            display: block !important;
            margin: 0 auto !important;
            width: 70mm !important;
          }
        }
      `}</style>

    </div>
  );
}
