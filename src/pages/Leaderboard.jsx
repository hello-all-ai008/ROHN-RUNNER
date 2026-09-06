import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import logoFull from '../LOGO/logo-rohn-full.png';
import { ArrowLeft, Trophy, Medal } from 'lucide-react';
import { useRunner } from '../context/RunnerContext';
import { topNByGroup, getOverallLeaders, getRunnerDisplayTime } from '../lib/results';

function Leaderboard() {
  const { runners, loading } = useRunner();
  const [selectedDistance, setSelectedDistance] = useState('ALL');

  // Extract unique distances
  const distances = useMemo(() => {
    const set = new Set();
    (runners || []).forEach((r) => {
      if (r.distance) set.add(r.distance);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [runners]);

  // Overall Champions (อันดับ 1 ชาย / หญิง แต่ละระยะ ไม่สนรุ่นอายุ)
  const { overallLeaders, overallWinnerBibs } = useMemo(() => {
    return getOverallLeaders(runners);
  }, [runners]);

  const filteredOverall = useMemo(() => {
    if (selectedDistance === 'ALL') return overallLeaders;
    return overallLeaders.filter((item) => item.distance === selectedDistance);
  }, [overallLeaders, selectedDistance]);

  // จัดอันดับตามรุ่นอายุ (ตัดคนที่ได้ Overall ออก เพื่อให้ 1 คนรับได้ 1 รางวัล)
  const groups = useMemo(() => {
    return topNByGroup(runners, 5, overallWinnerBibs);
  }, [runners, overallWinnerBibs]);

  const filteredGroups = useMemo(() => {
    if (selectedDistance === 'ALL') return groups;
    return groups.filter((g) => g.distance === selectedDistance);
  }, [groups, selectedDistance]);

  return (
    <div style={{ backgroundColor: 'var(--bg-dark)', minHeight: '100vh', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2rem', borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link to="/" className="btn-back"><ArrowLeft size={18} /> กลับหน้าหลัก (Home)</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1rem' }}>
            <img src={logoFull} alt="ROHN Logo" style={{ height: '60px' }} />
            <div style={{ width: '2px', height: '60px', backgroundColor: 'var(--text-muted)', opacity: 0.3 }}></div>
            <div>
              <h1 style={{ margin: 0, fontSize: '2.4rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-main)', lineHeight: 1 }}>Live Leaderboard</h1>
              <p style={{ color: 'var(--text-muted)', margin: 0, marginTop: '6px', fontSize: '0.95rem' }}>Official Results & Overall Champions</p>
            </div>
          </div>
        </div>

        {/* Distance Filter */}
        {distances.length > 0 && (
          <div style={{ display: 'flex', background: '#ffffff', borderRadius: '30px', border: '1px solid var(--border-color)', padding: '4px', gap: '4px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedDistance('ALL')}
              style={{
                background: selectedDistance === 'ALL' ? 'var(--text-main)' : 'transparent',
                color: selectedDistance === 'ALL' ? '#ffffff' : 'var(--text-main)',
                border: 'none',
                borderRadius: '24px',
                padding: '8px 18px',
                fontSize: '13px',
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
                  padding: '8px 18px',
                  fontSize: '13px',
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
        <p style={{ color: 'var(--text-muted)', padding: '0 2rem' }}>Loading results...</p>
      )}

      {/* 🏆 ผู้นำ Overall (อันดับ 1 ชาย / หญิง แต่ละระยะ) */}
      <div style={{ padding: '0 2rem', marginBottom: '2.5rem' }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '1.75rem',
          border: '1px solid rgba(245, 182, 10, 0.4)',
          boxShadow: '0 8px 30px rgba(245, 182, 10, 0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trophy size={24} color="#d97706" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#92400e', letterSpacing: '0.5px' }}>
                  ทำเนียบผู้นำ Overall (อันดับ 1 ชาย / หญิง)
                </h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#b45309', fontWeight: 500, marginTop: '2px' }}>
                  ไม่จำกัดรุ่นอายุ · สนเฉพาะระยะทางและเพศ
                </p>
              </div>
            </div>

            <div style={{ fontSize: '12px', background: '#fffbeb', color: '#b45309', padding: '6px 14px', borderRadius: '99px', border: '1px solid #fde68a', fontWeight: 600 }}>
              ⭐ ผู้ได้รางวัล Overall จะไม่นำไปจัดอันดับในรุ่นอายุ (1 คนรับได้ 1 รางวัล)
            </div>
          </div>

          {filteredOverall.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              ยังไม่มีข้อมูลผู้เข้าเส้นชัยในขณะนี้
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {filteredOverall.map((item) => (
                <div key={item.distance} style={{ background: '#fafaf9', borderRadius: '16px', border: '1px solid #e7e5e4', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ background: '#0f172a', color: '#ffffff', padding: '4px 14px', borderRadius: '99px', fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.5px' }}>
                      {item.distance}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#78716c', fontWeight: 600 }}>
                      Overall Champion
                    </span>
                  </div>

                  {/* Male Champion */}
                  <div style={{ background: '#ffffff', borderRadius: '12px', padding: '12px 14px', border: '1px solid #e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
                        ชาย
                      </div>
                      <div>
                        {item.male ? (
                          <>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                              🥇 {item.male.name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, color: '#0284c7' }}>BIB: {item.male.bib}</span>
                              {item.male.age_group && <span>· รุ่น {item.male.age_group}</span>}
                            </div>
                          </>
                        ) : (
                          <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>— ยังไม่มีผู้เข้าเส้นชัย —</div>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: item.male ? '#16a34a' : '#94a3b8' }}>
                        {item.male ? getRunnerDisplayTime(item.male) : '--:--:--'}
                      </div>
                    </div>
                  </div>

                  {/* Female Champion */}
                  <div style={{ background: '#ffffff', borderRadius: '12px', padding: '12px 14px', border: '1px solid #fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fce7f3', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
                        หญิง
                      </div>
                      <div>
                        {item.female ? (
                          <>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                              🥇 {item.female.name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, color: '#db2777' }}>BIB: {item.female.bib}</span>
                              {item.female.age_group && <span>· รุ่น {item.female.age_group}</span>}
                            </div>
                          </>
                        ) : (
                          <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>— ยังไม่มีผู้เข้าเส้นชัย —</div>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: item.female ? '#16a34a' : '#94a3b8' }}>
                        {item.female ? getRunnerDisplayTime(item.female) : '--:--:--'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🏃 จัดอันดับตามรุ่นอายุ (Top 5) */}
      <div style={{ padding: '0 2rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Medal size={22} color="var(--accent-blue)" /> ตารางจัดอันดับตามรุ่นอายุ (Top 5)
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              * ผู้ที่ได้รับรางวัล Overall อันดับ 1 ชาย/หญิง ได้รับการตัดสิทธิ์ออกจากรุ่นอายุแล้ว เพื่อส่งต่อรางวัลให้ลำดับถัดไป (1 คนรับได้ 1 รางวัล)
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.75rem', padding: '0 2rem' }}>
        {filteredGroups.map((group, gIdx) => (
          <div key={`${group.distance}_${group.age_group}_${group.gender}_${gIdx}`} style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginBottom: '1rem', borderLeft: '4px solid var(--accent-blue)', paddingLeft: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--accent-blue)' }}>{group.distance}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>|</span>
              {group.age_group} <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '1.1rem' }}>({group.gender})</span>
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
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--success-green)', fontWeight: 'bold' }}>
                        {getRunnerDisplayTime(r)}
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

