import React from 'react';
import './ESlip.css';
import { useRunner } from '../context/RunnerContext';
import logoBaanPong from '../LOGO/logo-BaanPong.jpg';
import logoMaekhaning from '../LOGO/logo-maekhaning.jpg';
import logoRohn from '../LOGO/logo-rohn-full.png';
import logoRohnLabel from '../LOGO/logo-rohn-label.png';
import { getRunnerNetTime, KNOWN_STATION_MAP } from '../lib/results';

// Extract English inside parentheses or after colon, stripping Thai text
export function formatEnglishLabel(val) {
  if (!val) return '—';
  const str = String(val).trim();
  if (!str) return '—';

  // 1. Look for English inside parentheses: e.g. "ชาย (Male)" -> "Male", "40-49 ปี (40–49 years)" -> "40–49 years"
  const parenMatch = str.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    const inside = parenMatch[1].trim();
    if (inside) return inside;
  }

  // 2. Look for English after colon: e.g. "50 ปีขึ้นไป: 50 years and over" -> "50 years and over"
  if (str.includes(':')) {
    const parts = str.split(':');
    const after = parts[parts.length - 1].trim();
    if (/[a-zA-Z]/.test(after)) {
      return after;
    }
  }

  // 3. If mixed Thai and English without parentheses, remove Thai characters (\u0E00-\u0E7F)
  if (/[\u0E00-\u0E7F]/.test(str) && /[a-zA-Z]/.test(str)) {
    const cleaned = str.replace(/[\u0E00-\u0E7F]/g, '').replace(/^[:\s\-–—/]+|[:\s\-–—/]+$/g, '').trim();
    if (cleaned) return cleaned;
  }

  // 4. Common single-letter codes or Thai genders
  const upper = str.toUpperCase();
  if (upper === 'M' || upper === 'MALE' || str === 'ชาย') return 'Male';
  if (upper === 'F' || upper === 'FEMALE' || str === 'หญิง') return 'Female';

  // 5. Thai age patterns without parentheses fallback
  if (/^ไม่เกิน\s*(\d+)/.test(str)) {
    const m = str.match(/\d+/);
    return m ? `Under ${m[0]} yrs` : 'Under 29 yrs';
  }
  if (/(\d+)\s*ปีขึ้นไป/.test(str)) {
    const m = str.match(/\d+/);
    return m ? `${m[0]} yrs & over` : '60 yrs & over';
  }
  if (/(\d+)\s*[-–]\s*(\d+)/.test(str)) {
    const m = str.match(/(\d+)\s*[-–]\s*(\d+)/);
    return m ? `${m[1]}-${m[2]} yrs` : str;
  }
  if (/ทั่วไป/i.test(str)) return 'Open';

  return str;
}

export function formatCategoryDisplay(runner) {
  if (!runner) return '—';

  const catName = (runner.cat_name || '').trim();
  let dist = runner.distance != null && runner.distance !== '' ? String(runner.distance).trim() : '';
  const unit = (runner.unit || '').trim();

  if (dist) {
    if (unit && !dist.toUpperCase().includes(unit.toUpperCase())) {
      dist = `${dist} ${unit}`;
    } else if (/^\d+(\.\d+)?$/.test(dist)) {
      dist = `${dist} KM`;
    }
  }

  // Format dist spacing: "10KM" -> "10 KM"
  if (dist) {
    dist = dist.replace(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/, '$1 $2');
  }

  // If no dist yet, check if raw cat starts with distance (e.g. "10 KM : Hard Rock")
  const rawCat = (runner.cat || '').trim();
  if (!dist && rawCat) {
    const match = rawCat.match(/^([\d.]+\s*[a-zA-Z]+)/);
    if (match) {
      dist = match[1].replace(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/, '$1 $2');
    }
  }

  // Name part
  let name = catName;
  if (!name && rawCat) {
    const match = rawCat.match(/^[\d.]+\s*[a-zA-Z]+\s*[:\-]?\s*(.*)$/);
    if (match && match[1]) {
      name = match[1].trim();
    } else {
      name = rawCat;
    }
  }

  if (dist && name) {
    const cleanDist = dist.replace(/\s+/g, '').toLowerCase();
    const cleanName = name.replace(/\s+/g, '').toLowerCase();
    if (cleanName.startsWith(cleanDist)) {
      return name;
    }
    return `${dist} ${name}`;
  }

  return dist || name || rawCat || '—';
}

export function computeRunnerRanks(targetRunner, allRunners = []) {
  if (!targetRunner || !targetRunner.finish) {
    return { overallRank: '—', catRank: '—' };
  }

  const getFinEpoch = (r) => {
    if (!r || !r.finish) return null;
    if (typeof r.finish === 'number') return isNaN(r.finish) ? null : r.finish;
    const s = String(r.finish).trim();
    if (/^\d{10,13}$/.test(s)) {
      const n = Number(s);
      return isNaN(n) ? null : n;
    }
    const d = new Date(s).getTime();
    return isNaN(d) ? null : d;
  };

  const getStartEpoch = (r) => {
    if (!r) return null;
    if (r.cps && typeof r.cps === 'object') {
      for (const [k, v] of Object.entries(r.cps)) {
        if (/start|ปล่อยตัว/i.test(String(k))) {
          const ep = typeof v === 'number' ? v : new Date(v).getTime();
          if (!isNaN(ep)) return ep;
        }
      }
    }
    const gun = r.gunStartTime || r.gun_start_time || r.start_time;
    if (gun) {
      const ep = typeof gun === 'number' ? gun : new Date(gun).getTime();
      if (!isNaN(ep)) return ep;
    }
    return null;
  };

  const getNetMs = (r) => {
    const fin = getFinEpoch(r);
    if (!fin) return Infinity;
    const st = getStartEpoch(r);
    if (st != null && fin > st) {
      return fin - st;
    }
    return fin;
  };

  const getDistKey = (r) => {
    if (!r) return '';
    const num = r.distance != null ? String(r.distance).replace(/[^\d.]/g, '') : '';
    if (num) return num;
    return String(r.cat_name || r.cat || '').trim().toLowerCase();
  };

  const targetFin = getFinEpoch(targetRunner);
  if (!targetFin) {
    return { overallRank: '—', catRank: '—' };
  }

  const targetDistKey = getDistKey(targetRunner);
  const targetBib = String(targetRunner.bib || '').trim();

  // Filter finished runners in the same distance
  const finishedInDist = (allRunners || []).filter(r => {
    const fin = getFinEpoch(r);
    if (!fin) return false;
    if (!targetDistKey) return true;
    return getDistKey(r) === targetDistKey;
  });

  finishedInDist.sort((a, b) => {
    const netA = getNetMs(a);
    const netB = getNetMs(b);
    if (netA !== netB) return netA - netB;
    return (getFinEpoch(a) || 0) - (getFinEpoch(b) || 0);
  });

  let overallRank = '—';
  const overallIdx = finishedInDist.findIndex(r => String(r.bib || '').trim() === targetBib);
  if (overallIdx !== -1) {
    overallRank = overallIdx + 1;
  } else if (targetBib) {
    const withTarget = [...finishedInDist, targetRunner].sort((a, b) => {
      const netA = getNetMs(a);
      const netB = getNetMs(b);
      if (netA !== netB) return netA - netB;
      return (getFinEpoch(a) || 0) - (getFinEpoch(b) || 0);
    });
    const idx = withTarget.findIndex(r => String(r.bib || '').trim() === targetBib);
    if (idx !== -1) overallRank = idx + 1;
  }

  const getGenderKey = (g) => {
    if (!g) return '';
    const s = String(g).toLowerCase();
    if (s.includes('female') || s.includes('หญิง') || s === 'f') return 'F';
    if (s.includes('male') || s.includes('ชาย') || s === 'm') return 'M';
    return s;
  };

  const getAgeKey = (r) => {
    const raw = r.age_group || r.ageGroup || r.age || '';
    return formatEnglishLabel(raw).toLowerCase().trim();
  };

  const targetGender = getGenderKey(targetRunner.gender);
  const targetAge = getAgeKey(targetRunner);

  const finishedInCat = finishedInDist.filter(r => {
    if (targetGender && getGenderKey(r.gender) !== targetGender) return false;
    if (targetAge && getAgeKey(r) !== targetAge) return false;
    return true;
  });

  finishedInCat.sort((a, b) => {
    const netA = getNetMs(a);
    const netB = getNetMs(b);
    if (netA !== netB) return netA - netB;
    return (getFinEpoch(a) || 0) - (getFinEpoch(b) || 0);
  });

  let catRank = '—';
  const catIdx = finishedInCat.findIndex(r => String(r.bib || '').trim() === targetBib);
  if (catIdx !== -1) {
    catRank = catIdx + 1;
  } else if (targetBib) {
    const withTarget = [...finishedInCat, targetRunner].sort((a, b) => {
      const netA = getNetMs(a);
      const netB = getNetMs(b);
      if (netA !== netB) return netA - netB;
      return (getFinEpoch(a) || 0) - (getFinEpoch(b) || 0);
    });
    const idx = withTarget.findIndex(r => String(r.bib || '').trim() === targetBib);
    if (idx !== -1) catRank = idx + 1;
  }

  return {
    overallRank: overallRank != null && overallRank !== '—' ? String(overallRank) : '—',
    catRank: catRank != null && catRank !== '—' ? String(catRank) : '—'
  };
}

export default function ESlip({ runner, overallRank, catRank, stations = [], runners: propRunners }) {
  if (!runner) return null;

  const fmtTime = (ts) => {
    if (!ts) return '—';
    try {
      if (typeof ts === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(ts.trim())) {
        return ts.trim().length === 5 ? `${ts.trim()}:00` : ts.trim();
      }
      const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
      return isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('th-TH', {
        timeZone: 'Asia/Bangkok',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
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

  // Resolve distance-specific stations
  // Priority: runner.categoryStations -> stations matching category -> filtered stations prop -> cps entries
  let distanceStations = [];
  if (Array.isArray(runner.categoryStations) && runner.categoryStations.length > 0) {
    distanceStations = runner.categoryStations;
  } else if (Array.isArray(stations) && stations.length > 0) {
    const matched = stations.filter(s => s.category_id && (s.category_id === runner.category_id || s.category_id === runner.cat || s.category_id === runner.distance));
    if (matched.length > 0) {
      distanceStations = matched;
    } else {
      distanceStations = stations.filter(s => s.type !== 'START' && s.type !== 'FINISH' && !/start|ปล่อยตัว|finish|เส้นชัย/i.test(s.name || ''));
    }
  }

  // Calculate sorted checkpoints excluding checkin, start, and finish
  const cpEntries = Object.entries(runner.cps || {})
    .filter(([k]) => !['checkin', 'finish'].includes(String(k).toLowerCase()) && !/start|ปล่อยตัว|finish|เส้นชัย/i.test(String(k)))
    .sort((a, b) => Number(a[1]) - Number(b[1]));

  // Extra scanned CPs not in distanceStations
  const renderedStationIds = new Set(distanceStations.map(s => String(s.id)));
  const extraCpEntries = Object.entries(runner.cps || {}).filter(([k]) => {
    if (renderedStationIds.has(String(k))) return false;
    if (['checkin', 'finish'].includes(String(k).toLowerCase())) return false;
    if (/start|ปล่อยตัว|finish|เส้นชัย/i.test(String(k))) return false;
    return true;
  }).sort((a, b) => Number(a[1]) - Number(b[1]));

  const { netTimeMs } = getRunnerNetTime(runner);

  // Get all runners from context or prop for rank resolution
  let runnerContextRunners = [];
  try {
    const runnerCtx = useRunner();
    runnerContextRunners = runnerCtx?.runners || [];
  } catch (e) { }
  const allRunners = propRunners && propRunners.length > 0 ? propRunners : runnerContextRunners;

  let cleanOverall = (overallRank != null && overallRank !== '' && overallRank !== '-' && overallRank !== '—')
    ? String(overallRank).replace(/^#\s*/, '')
    : null;
  let cleanCat = (catRank != null && catRank !== '' && catRank !== '-' && catRank !== '—')
    ? String(catRank).replace(/^#\s*/, '')
    : null;

  // If ranks were not provided or were '-', but runner has finish time, compute dynamically!
  if ((!cleanOverall || !cleanCat) && runner?.finish) {
    const autoRanks = computeRunnerRanks(runner, allRunners);
    if (!cleanOverall) cleanOverall = autoRanks.overallRank;
    if (!cleanCat) cleanCat = autoRanks.catRank;
  }

  cleanOverall = cleanOverall || '—';
  cleanCat = cleanCat || '—';

  const cleanGender = formatEnglishLabel(runner.gender);
  const cleanAgeGroup = formatEnglishLabel(runner.age_group || runner.ageGroup || runner.age);
  const eslipUrl = runner?.bib
    ? `https://rohn-runner.vercel.app/eslip/${encodeURIComponent(runner.bib)}`
    : 'https://rohn-runner.vercel.app/eslip';

  return (
    <div className="eslip">
      <div className="head" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img
          src={logoBaanPong}
          alt="Baan Pong Trail Logo"
          className="eslip-head-logo"
          style={{ height: '75px', maxWidth: '180px', width: 'auto', objectFit: 'contain', marginBottom: '8px' }}
        />
        <span style={{ fontSize: '13px', fontWeight: 600 }}>Official e-Slip</span>
      </div>

      <div className="eslip-body">
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
          <b>{formatCategoryDisplay(runner)}</b>
        </div>
        <div className="row">
          <span>Gender</span>
          <b>{cleanGender}</b>
        </div>
        <div className="row">
          <span>Age Group</span>
          <b>{cleanAgeGroup}</b>
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

        {/* Distance-specific Checkpoint Stations */}
        {distanceStations.length > 0 ? (
          <>
            {distanceStations.map((st, idx) => {
              const ts = runner.cps?.[st.id] ?? runner.cps?.[st.name] ?? runner.cps?.[`st_${st.id}`];
              return (
                <div className="row" key={st.id || `st_${idx}`}>
                  <span>{st.name || `Checkpoint ${idx + 1}`}</span>
                  <span style={{ fontFamily: 'monospace' }}>{fmtTime(ts)}</span>
                </div>
              );
            })}
            {extraCpEntries.map(([cp, ts], idx) => {
              const sId = String(cp).toLowerCase();
              const stationName = stations?.find(s => String(s.id).toLowerCase() === sId)?.name
                || KNOWN_STATION_MAP[sId]
                || (sId.length < 10 ? cp : null)
                || `Checkpoint ${distanceStations.length + idx + 1}`;
              return (
                <div className="row" key={cp}>
                  <span>{stationName}</span>
                  <span style={{ fontFamily: 'monospace' }}>{fmtTime(ts)}</span>
                </div>
              );
            })}
          </>
        ) : (
          cpEntries.map(([cp, ts], idx) => {
            const sId = String(cp).toLowerCase();
            const stationName = stations?.find(s => String(s.id).toLowerCase() === sId)?.name
              || KNOWN_STATION_MAP[sId]
              || (sId.length < 10 ? cp : null)
              || `Checkpoint ${idx + 1}`;
            return (
              <div className="row" key={cp}>
                <span>{stationName}</span>
                <span style={{ fontFamily: 'monospace' }}>{fmtTime(ts)}</span>
              </div>
            );
          })
        )}

        <div className="row">
          <span>Finish</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{fmtTime(runner.finish)}</span>
        </div>

        <div className="hr"></div>

        <div className="eslip-stat-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '14px 0' }}>
          <div className="eslip-stat-box" style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <div className="eslip-stat-label" style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>Start date</div>
            <div className="eslip-stat-val" style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'monospace' }}>
              {runner.gun_start_time
                ? fmtDate(runner.gun_start_time)
                : (runner.start_date
                  ? fmtDate(runner.start_date)
                  : (cpEntries.length > 0
                    ? fmtDate(cpEntries[0][1])
                    : (runner.checked_in_at ? fmtDate(runner.checked_in_at) : fmtDate(Date.now()))))}
            </div>
          </div>
          <div className="eslip-stat-box" style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <div className="eslip-stat-label" style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>Net Time (Start-Finish)</div>
            <div className="eslip-stat-val eslip-net-val" style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'monospace', color: '#3b82f6' }}>
              {fmtDur(netTimeMs)}
            </div>
          </div>
        </div>

        <div className="eslip-stat-grid" style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          <div className="eslip-stat-box" style={{ flex: 1, background: '#f8fafc', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <div className="eslip-stat-label" style={{ fontSize: '11px', color: '#64748b' }}>Overall Rank</div>
            <div className="eslip-stat-val eslip-rank-val" style={{ fontSize: '18px', fontWeight: 600 }}>{cleanOverall}</div>
          </div>
          <div className="eslip-stat-box" style={{ flex: 1, background: '#f8fafc', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <div className="eslip-stat-label" style={{ fontSize: '11px', color: '#64748b' }}>Age Group / กลุ่มอายุ</div>
            <div className="eslip-stat-val eslip-rank-val" style={{ fontSize: '18px', fontWeight: 600 }}>{cleanCat}</div>
          </div>
        </div>
      </div>

      <div className="hr" style={{ marginTop: '14px', marginBottom: '12px' }}></div>

      <div className="foot" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div className="eslip-foot-logos" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <img
            src={logoMaekhaning}
            alt="Mae Khaning Logo"
            className="eslip-foot-logo-mk"
            style={{ height: '52px', maxWidth: '120px', width: 'auto', objectFit: 'contain', borderRadius: '4px' }}
          />
          <img
            src={logoRohn}
            alt="ROHN Logo"
            className="eslip-foot-logo-rohn"
            style={{ height: '75px', maxWidth: '200px', width: 'auto', objectFit: 'contain' }}
          />
        </div>
        <div className="eslip-foot-timing" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
          <span>Timing System by ROHN</span>

        </div>
        <span className="eslip-foot-note" style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>* Provisional Result ( Subject to change)</span>
      </div>
    </div>
  );
}
