import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useRunner } from '../context/RunnerContext';
import { ArrowLeft, Search, Medal, Timer, Map, User, Users, Printer, Trophy } from 'lucide-react';
import logoFull from '../LOGO/logo-rohn-full.png';
import { formatTime, checkpointTimeline } from '../lib/results';
import { normalizeScannedBib } from '../lib/bibUtils';
import ESlipModal from '../components/ESlipModal';
import { computeRunnerRanks, formatEnglishLabel } from '../components/ESlip';

function ESlip() {
  const { bib } = useParams();
  const navigate = useNavigate();
  const { runners, stations, getRunnerByBib, loading } = useRunner();

  const [searchInput, setSearchInput] = useState(bib || '');
  const [showSlipModal, setShowSlipModal] = useState(false);

  useEffect(() => {
    setSearchInput(bib || '');
  }, [bib]);

  const runner = bib ? getRunnerByBib(bib) : null;
  const { overallRank, catRank: rank } = useMemo(() => {
    return computeRunnerRanks(runner, runners);
  }, [runner, runners]);
  const officialTime = runner ? formatTime(runner.finish) : null;
  const timeline = useMemo(() => {
    return runner ? checkpointTimeline(runner.cps, runner.finish, runner.checked_in_at, runner.gun_start_time, stations) : [];
  }, [runner, stations]);

  const handleSearch = (e) => {
    e.preventDefault();
    const clean = normalizeScannedBib(searchInput);
    if (clean) {
      navigate(`/eslip/${clean}`);
    } else {
      navigate('/eslip');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%',
      overflowX: 'hidden',
      boxSizing: 'border-box',
      background: 'linear-gradient(135deg, #020228 0%, #1a0e5b 40%, #591b98 80%, #9d33d6 100%)',
      backgroundAttachment: 'fixed',
      padding: 'clamp(1rem, 3vw, 2rem)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ width: '100%', maxWidth: '900px', position: 'relative', boxSizing: 'border-box' }}>
        <Link to="/" style={{ 
          position: 'absolute', top: '0', left: '0', 
          display: 'flex', alignItems: 'center', gap: '0.5rem', 
          color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
          transition: 'color 0.2s',
          fontWeight: 600
        }}>
          <ArrowLeft size={20} /> กลับหน้าหลัก
        </Link>
        
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: '1.5rem' }}>
          <img 
            src={logoFull} 
            alt="ROHN Logo" 
            style={{ 
              height: 'auto',
              maxHeight: '120px', 
              maxWidth: '100%',
              display: 'block',
              margin: '0 auto',
              filter: 'brightness(0) invert(1) drop-shadow(0 0 25px rgba(255,255,255,0.5))' 
            }} 
          />
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '800', letterSpacing: '2px', margin: 0, marginTop: '-0.5rem', textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>Finisher Portal</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.2rem', fontSize: '0.9rem' }}>Enter your BIB number to view your official results</p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} style={{ 
          display: 'flex', maxWidth: '500px', margin: '0 auto 1.5rem auto',
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
          padding: '0.5rem', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <input 
            type="text" 
            placeholder="Enter BIB Number..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ 
              flex: 1, minWidth: 0, background: 'transparent', border: 'none', 
              padding: '1rem clamp(0.5rem, 3vw, 1.5rem)', fontSize: '1.2rem', color: '#fff', 
              outline: 'none', fontWeight: 'bold' 
            }}
          />
          <button type="submit" style={{ 
            background: 'linear-gradient(to right, #591b98, #9d33d6)', 
            border: 'none', borderRadius: '50px', padding: '0 clamp(1rem, 4vw, 2rem)', 
            color: '#fff', fontWeight: 'bold', fontSize: 'clamp(0.9rem, 3vw, 1.1rem)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'transform 0.2s',
            flexShrink: 0
          }}>
            <Search size={20} /> <span style={{ display: 'inline-block' }}>Search</span>
          </button>
        </form>

        {/* Result Area */}
        {bib && loading && (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(0,0,0,0.3)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Loading results...</p>
          </div>
        )}

        {bib && !loading && !runner && (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(0,0,0,0.3)', borderRadius: '20px', border: '1px solid rgba(255,0,0,0.3)' }}>
            <h2 style={{ color: '#ff6b6b' }}>Runner Not Found</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>No official record found for BIB "{bib}"</p>
          </div>
        )}

        {runner && (
          <div style={{ 
            background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', 
            borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)',
            padding: 'clamp(1rem, 4vw, 2rem)', position: 'relative', overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            animation: 'slideUpMap 0.8s cubic-bezier(0.23, 1, 0.32, 1)'
          }}>
            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(157,51,214,0.4) 0%, rgba(0,0,0,0) 70%)', zIndex: 0 }}></div>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: '1 1 0%', minWidth: '160px' }}>
                  <h2 style={{ fontSize: '0.8rem', color: '#d8b4fe', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 0.2rem 0' }}>Official Finisher</h2>
                  <h1 style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)', margin: 0, fontWeight: 800, textShadow: '0 2px 10px rgba(0,0,0,0.5)', overflowWrap: 'break-word', wordBreak: 'keep-all', lineHeight: 1.1 }}>{runner.name}</h1>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <button 
                    type="button"
                    onClick={() => setShowSlipModal(true)}
                    title="พิมพ์ e-Slip (Print Official Slip)"
                    style={{
                      background: 'rgba(255, 255, 255, 0.12)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      color: '#ffffff',
                      borderRadius: '12px',
                      padding: '0.6rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 6px 15px rgba(0, 0, 0, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 12px 25px rgba(157, 51, 214, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.2)';
                    }}
                  >
                    <Printer size={20} />
                  </button>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>BIB No.</div>
                    <div style={{ fontSize: 'clamp(1.8rem, 8vw, 3rem)', fontWeight: 900, color: '#fff', lineHeight: 1, textShadow: '0 0 15px rgba(157,51,214,0.8)' }}>{runner.bib}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(157,51,214,0.2)', padding: '0.5rem', borderRadius: '10px' }}><Map size={18} color="#d8b4fe" /></div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Distance</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{runner.distance}</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(157,51,214,0.2)', padding: '0.5rem', borderRadius: '10px' }}><User size={18} color="#d8b4fe" /></div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Gender</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{formatEnglishLabel(runner.gender)}</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(157,51,214,0.2)', padding: '0.5rem', borderRadius: '10px' }}><Users size={18} color="#d8b4fe" /></div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Age Group</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{formatEnglishLabel(runner.age_group || runner.ageGroup || runner.age)}</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(157,51,214,0.2)', padding: '0.5rem', borderRadius: '10px' }}><Timer size={18} color="#d8b4fe" /></div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Official Time</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{officialTime || 'ยังไม่เข้าเส้นชัย / Not finished yet'}</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(157,51,214,0.2)', padding: '0.5rem', borderRadius: '10px' }}><Trophy size={18} color="#d8b4fe" /></div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Overall Rank</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{overallRank && overallRank !== '—' ? `#${overallRank}` : '-'}</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(157,51,214,0.2)', padding: '0.5rem', borderRadius: '10px' }}><Medal size={18} color="#d8b4fe" /></div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Group Rank</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{rank && rank !== '—' ? `#${rank}` : '-'}</div>
                  </div>
                </div>
              </div>

              {/* Timeline Alternative */}
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: 'rgba(255,255,255,0.8)', fontSize: '1rem' }}>Race Splits</h3>
                {timeline.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>No checkpoint data yet</p>
                ) : (
                  <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', marginTop: '1rem', minWidth: 'max-content', gap: '1.5rem' }}>
                      <div style={{ position: 'absolute', top: '6px', left: '0', right: '0', height: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }}></div>
                      <div style={{ position: 'absolute', top: '6px', left: '0', width: '100%', height: '2px', background: 'linear-gradient(to right, #591b98, #9d33d6)', zIndex: 0 }}></div>

                      {timeline.map((split, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1, minWidth: '50px' }}>
                          <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#d8b4fe', border: '3px solid #1a0e5b', marginBottom: '0.5rem', boxShadow: '0 0 10px #d8b4fe' }}></div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{split.label}</div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>{split.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>

      {showSlipModal && runner && (
        <ESlipModal
          runner={runner}
          overallRank={overallRank}
          catRank={rank}
          stations={stations}
          runners={runners}
          onClose={() => setShowSlipModal(false)}
        />
      )}
    </div>
  );
}

export default ESlip;
