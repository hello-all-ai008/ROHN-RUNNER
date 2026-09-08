import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import logoFull from '../LOGO/logo-rohn-full.png';
import { ArrowLeft, Trophy, Medal } from 'lucide-react';
import { useRunner } from '../context/RunnerContext';
import { topNByGroup, getOverallLeaders, getRunnerDisplayTime } from '../lib/results';
import { formatEnglishLabel } from '../components/ESlip';

function Leaderboard() {
  const { runners, loading } = useRunner();
  const [selectedDistance, setSelectedDistance] = useState('ALL');

  // Extract unique distances (excluding 5KM)
  const distances = useMemo(() => {
    const set = new Set();
    (runners || []).forEach((r) => {
      if (r.distance && r.distance !== '5KM' && r.distance !== '5km' && r.distance !== '5 KM') set.add(r.distance);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [runners]);

  // Overall Champions (อันดับ 1 ชาย / หญิง แต่ละระยะ ไม่สนรุ่นอายุ)
  const { overallLeaders, overallWinnerBibs } = useMemo(() => {
    return getOverallLeaders(runners);
  }, [runners]);

  const filteredOverall = useMemo(() => {
    const list = overallLeaders.filter(item => item.distance !== '5KM' && item.distance !== '5km' && item.distance !== '5 KM');
    if (selectedDistance === 'ALL') return list;
    return list.filter((item) => item.distance === selectedDistance);
  }, [overallLeaders, selectedDistance]);

  // จัดอันดับตามรุ่นอายุ (ตัดคนที่ได้ Overall ออก เพื่อให้ 1 คนรับได้ 1 รางวัล)
  const groups = useMemo(() => {
    return topNByGroup(runners, 5, overallWinnerBibs);
  }, [runners, overallWinnerBibs]);

  const filteredGroups = useMemo(() => {
    const list = groups.filter(g => g.distance !== '5KM' && g.distance !== '5km' && g.distance !== '5 KM');
    if (selectedDistance === 'ALL') return list;
    return list.filter((g) => g.distance === selectedDistance);
  }, [groups, selectedDistance]);

  return (
    <div className="lb-page-container">
      <style>{`
        .groups-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1rem;
          padding: 0 1.25rem;
        }
        .groups-grid > div {
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 12px;
          padding: 1rem;
          box-shadow: 0 4px 15px rgba(0,0,0,0.04);
        }
        @media (max-width: 768px) {
          .groups-grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 0.45rem !important;
            padding: 0 0.4rem !important;
          }
          .groups-grid > div {
            padding: 0.5rem 0.45rem !important;
            border-radius: 8px !important;
          }
          .leaderboard-row {
            padding: 0.15rem 0 !important;
            min-height: 0 !important;
            margin-bottom: 0.15rem !important;
            gap: 4px !important;
          }
          .leaderboard-row .rank {
            width: 16px !important;
            height: 16px !important;
            font-size: 0.6rem !important;
            min-width: 16px !important;
          }
          .leaderboard-row > div:nth-child(2) {
            gap: 4px !important;
            min-width: 0 !important;
          }
          .leaderboard-row > div:nth-child(2) > div:first-child {
            gap: 3px !important;
            min-width: 0 !important;
            flex: 1 !important;
          }
          .leaderboard-row > div:nth-child(2) > div:first-child > div:first-child {
            font-size: 0.68rem !important;
            line-height: 1.15 !important;
            max-width: 65px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .leaderboard-row > div:nth-child(2) > div:first-child > div:last-child {
            font-size: 0.52rem !important;
            padding: 1px 3px !important;
            white-space: nowrap;
          }
          .leaderboard-row > div:nth-child(2) > div:last-child {
            flex-shrink: 0 !important;
          }
          .leaderboard-row > div:nth-child(2) > div:last-child > div:first-child {
            font-size: 0.68rem !important;
          }
          .leaderboard-row > div:nth-child(2) > div:last-child > div:last-child {
            font-size: 0.46rem !important;
          }
          .groups-grid > div > div:first-child {
            font-size: 0.72rem !important;
            margin-bottom: 0.35rem !important;
            padding-left: 0.35rem !important;
            border-left-width: 3px !important;
            gap: 3px !important;
            line-height: 1.2 !important;
          }
          .groups-grid > div > div:first-child span {
             font-size: 0.72rem !important;
          }
          .overall-grid {
            grid-template-columns: 1fr !important;
            gap: 0.5rem !important;
          }
          .overall-item-card {
            padding: 0.6rem !important;
          }
          .overall-champ-row {
            padding: 0.4rem 0.5rem !important;
            gap: 0.4rem !important;
          }
          .overall-champ-row > div:first-child > div:first-child {
             width: 24px !important;
             height: 24px !important;
             font-size: 0.6rem !important;
          }
          .lb-header-section {
            padding: 0.75rem 0.5rem !important;
          }
          .lb-section-pad {
            padding: 0 0.4rem !important;
            margin-bottom: 0.75rem !important;
          }
          h2 {
            font-size: 0.95rem !important;
          }
        }
      `}</style>
      {/* Header */}
      <div className="lb-header-section">
        <div>
          <Link to="/" className="btn-back"><ArrowLeft size={18} /> กลับหน้าหลัก (Home)</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.75rem, 2.5vw, 1.5rem)', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <img src={logoFull} alt="ROHN Logo" style={{ height: 'clamp(44px, 8vw, 60px)' }} />
            <div style={{ width: '2px', height: 'clamp(44px, 8vw, 60px)', backgroundColor: 'var(--text-muted)', opacity: 0.3 }}></div>
            <div>
              <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem, 5vw, 2.4rem)', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-main)', lineHeight: 1.1 }}>Live Leaderboard</h1>
              <p style={{ color: 'var(--text-muted)', margin: 0, marginTop: '4px', fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)' }}>Official Results & Overall Champions</p>
            </div>
          </div>
        </div>

        {/* Distance Filter */}
        {distances.length > 0 && (
          <div style={{ display: 'flex', background: '#ffffff', borderRadius: '30px', border: '1px solid var(--border-color)', padding: '4px', gap: '4px', flexWrap: 'wrap', maxWidth: '100%' }}>
            <button
              onClick={() => setSelectedDistance('ALL')}
              style={{
                background: selectedDistance === 'ALL' ? 'var(--text-main)' : 'transparent',
                color: selectedDistance === 'ALL' ? '#ffffff' : 'var(--text-main)',
                border: 'none',
                borderRadius: '24px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ALL
            </button>
            {distances.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDistance(d)}
                style={{
                  background: selectedDistance === d ? 'var(--text-main)' : 'transparent',
                  color: selectedDistance === d ? '#ffffff' : 'var(--text-main)',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && groups.length === 0 && (
        <p className="lb-section-pad" style={{ color: 'var(--text-muted)' }}>Loading results...</p>
      )}

      {/* 🏆 ผู้นำ Overall (อันดับ 1 ชาย / หญิง แต่ละระยะ) */}
      <div className="lb-section-pad" style={{ marginBottom: '2.5rem' }}>
        <div className="overall-card">
          <div className="overall-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trophy size={24} color="#d97706" />
              </div>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ margin: 0, fontSize: 'clamp(1.1rem, 3.5vw, 1.4rem)', fontWeight: 800, color: '#92400e', letterSpacing: '0.5px' }}>
                  ทำเนียบผู้นำ Overall (อันดับ 1 ชาย / หญิง)
                </h2>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#b45309', fontWeight: 500, marginTop: '2px' }}>
                  ไม่จำกัดรุ่นอายุ · สนเฉพาะระยะทางและเพศ
                </p>
              </div>
            </div>

            <div className="overall-badge">
              ⭐ ผู้ได้รางวัล Overall จะไม่นำไปจัดอันดับในรุ่นอายุ (1 คนรับได้ 1 รางวัล)
            </div>
          </div>

          {filteredOverall.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              ยังไม่มีข้อมูลผู้เข้าเส้นชัยในขณะนี้
            </div>
          ) : (
            <div className="overall-grid">
              {filteredOverall.map((item) => (
                <div key={item.distance} className="overall-item-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ background: '#0f172a', color: '#ffffff', padding: '3px 12px', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.5px' }}>
                      {item.distance}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#78716c', fontWeight: 600 }}>
                      Overall Champion
                    </span>
                  </div>

                  {/* Male Champion */}
                  <div className="overall-champ-row male">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <div style={{ width: '36px', height: '30px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', flexShrink: 0 }}>
                        Male
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        {item.male ? (
                          <>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              🥇 {item.male.name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, color: '#0284c7' }}>BIB: {item.male.bib}</span>
                              {item.male.age_group && <span>· {formatEnglishLabel(item.male.age_group)}</span>}
                            </div>
                          </>
                        ) : (
                          <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.88rem' }}>— ยังไม่มีผู้เข้าเส้นชัย —</div>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '8px' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 800, color: item.male ? '#16a34a' : '#94a3b8', whiteSpace: 'nowrap' }}>
                        {item.male ? getRunnerDisplayTime(item.male) : '--:--:--'}
                      </div>
                      {item.male && <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Net Time</div>}
                    </div>
                  </div>

                  {/* Female Champion */}
                  <div className="overall-champ-row female">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <div style={{ width: '46px', height: '30px', borderRadius: '8px', background: '#fce7f3', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', flexShrink: 0 }}>
                        Female
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        {item.female ? (
                          <>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              🥇 {item.female.name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, color: '#db2777' }}>BIB: {item.female.bib}</span>
                              {item.female.age_group && <span>· {formatEnglishLabel(item.female.age_group)}</span>}
                            </div>
                          </>
                        ) : (
                          <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.88rem' }}>— ยังไม่มีผู้เข้าเส้นชัย —</div>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '8px' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 800, color: item.female ? '#16a34a' : '#94a3b8', whiteSpace: 'nowrap' }}>
                        {item.female ? getRunnerDisplayTime(item.female) : '--:--:--'}
                      </div>
                      {item.female && <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Net Time</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🏃 จัดอันดับตามรุ่นอายุ (Top 5) */}
      <div className="lb-section-pad" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Medal size={22} color="var(--accent-blue)" /> ตารางจัดอันดับตามรุ่นอายุ (Top 5)
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              * ผู้ที่ได้รับรางวัล Overall อันดับ 1 ชาย/หญิง ได้รับการตัดสิทธิ์ออกจากรุ่นอายุแล้ว เพื่อส่งต่อรางวัลให้ลำดับถัดไป (1 คนรับได้ 1 รางวัล)
            </p>
          </div>
        </div>
      </div>

      <div className="groups-grid">
        {filteredGroups.map((group, gIdx) => (
          <div key={`${group.distance}_${group.age_group}_${group.gender}_${gIdx}`}>
            <div style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.75rem', borderLeft: '4px solid var(--accent-blue)', paddingLeft: '0.6rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--accent-blue)' }}>{group.distance}</span>
              <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>|</span>
              <span>{formatEnglishLabel(group.age_group)}</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9em' }}>({formatEnglishLabel(group.gender)})</span>
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
                        <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--text-main)' }}>{r.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>BIB: {r.bib}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--success-green)', fontWeight: 'bold' }}>
                          {getRunnerDisplayTime(r)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Net Time</div>
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

        {filteredGroups.length === 0 && !loading && (
          <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
            ไม่มีข้อมูลการจัดอันดับในรุ่นนี้
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;

