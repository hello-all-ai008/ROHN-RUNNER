import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useRunner } from '../context/RunnerContext';
import { ArrowLeft, Search, Medal, Timer, Map, User } from 'lucide-react';
import logoFull from '../LOGO/logo-rohn-full.png';
import { computeRank, formatTime, checkpointTimeline } from '../lib/results';

function ESlip() {
  const { bib } = useParams();
  const navigate = useNavigate();
  const { runners, getRunnerByBib, loading } = useRunner();

  const [searchInput, setSearchInput] = useState(bib || '');

  useEffect(() => {
    setSearchInput(bib || '');
  }, [bib]);

  const runner = bib ? getRunnerByBib(bib) : null;
  const rank = runner ? computeRank(runner, runners) : null;
  const officialTime = runner ? formatTime(runner.finish) : null;
  const timeline = runner ? checkpointTimeline(runner.cps, runner.finish, runner.checked_in_at, runner.gun_start_time) : [];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/eslip/${searchInput.trim()}`);
    } else {
      navigate('/eslip');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #020228 0%, #1a0e5b 40%, #591b98 80%, #9d33d6 100%)',
      padding: '2rem',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ width: '100%', maxWidth: '900px', position: 'relative' }}>
        <Link to="/" style={{ 
          position: 'absolute', top: '0', left: '0', 
          display: 'flex', alignItems: 'center', gap: '0.5rem', 
          color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
          transition: 'color 0.2s',
          fontWeight: 600
        }}>
          <ArrowLeft size={20} /> กลับหน้าหลัก
        </Link>
        
        <div style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '3rem' }}>
          <img 
            src={logoFull} 
            alt="ROHN Logo" 
            style={{ 
              height: '180px', 
              maxWidth: '560px',
              width: 'auto',
              marginBottom: '1.5rem', 
              filter: 'brightness(0) invert(1) drop-shadow(0 0 20px rgba(255,255,255,0.45))' 
            }} 
          />
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '2px', margin: 0, textTransform: 'uppercase' }}>Finisher Portal</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>Enter your BIB number to view your official results</p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} style={{ 
          display: 'flex', maxWidth: '500px', margin: '0 auto 3rem auto',
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
              flex: 1, background: 'transparent', border: 'none', 
              padding: '1rem 1.5rem', fontSize: '1.2rem', color: '#fff', 
              outline: 'none', fontWeight: 'bold' 
            }}
          />
          <button type="submit" style={{ 
            background: 'linear-gradient(to right, #591b98, #9d33d6)', 
            border: 'none', borderRadius: '50px', padding: '0 2rem', 
            color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'transform 0.2s'
          }}>
            <Search size={20} /> Search
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
            borderRadius: '24px', border: '1px solid rgba(255,255,255,0.15)',
            padding: '3rem', position: 'relative', overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            animation: 'slideUpMap 0.8s cubic-bezier(0.23, 1, 0.32, 1)'
          }}>
            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(157,51,214,0.4) 0%, rgba(0,0,0,0) 70%)', zIndex: 0 }}></div>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2rem', marginBottom: '2rem' }}>
                <div>
                  <h2 style={{ fontSize: '1rem', color: '#d8b4fe', textTransform: 'uppercase', letterSpacing: '3px', margin: '0 0 0.5rem 0' }}>Official Finisher</h2>
                  <h1 style={{ fontSize: '3.5rem', margin: 0, fontWeight: 800, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{runner.name}</h1>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '2px' }}>BIB No.</div>
                  <div style={{ fontSize: '4rem', fontWeight: 900, color: '#fff', lineHeight: 1, textShadow: '0 0 20px rgba(157,51,214,0.8)' }}>{runner.bib}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'rgba(157,51,214,0.2)', padding: '1rem', borderRadius: '12px' }}><Map size={24} color="#d8b4fe" /></div>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Distance</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{runner.distance}</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'rgba(157,51,214,0.2)', padding: '1rem', borderRadius: '12px' }}><User size={24} color="#d8b4fe" /></div>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Age Group</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{runner.ageGroup}</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'rgba(157,51,214,0.2)', padding: '1rem', borderRadius: '12px' }}><Timer size={24} color="#d8b4fe" /></div>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Official Time</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{officialTime || 'ยังไม่เข้าเส้นชัย / Not finished yet'}</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'rgba(157,51,214,0.2)', padding: '1rem', borderRadius: '12px' }}><Medal size={24} color="#d8b4fe" /></div>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Group Rank</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{rank ? `#${rank}` : '-'}</div>
                  </div>
                </div>
              </div>

              {/* Timeline Alternative */}
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', padding: '2rem' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', color: 'rgba(255,255,255,0.8)', fontSize: '1.2rem' }}>Race Splits</h3>
                {timeline.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>No checkpoint data yet</p>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', marginTop: '2rem' }}>
                    <div style={{ position: 'absolute', top: '8px', left: '10%', right: '10%', height: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }}></div>
                    <div style={{ position: 'absolute', top: '8px', left: '10%', width: '80%', height: '2px', background: 'linear-gradient(to right, #591b98, #9d33d6)', zIndex: 0 }}></div>

                    {timeline.map((split, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#d8b4fe', border: '4px solid #1a0e5b', marginBottom: '1rem', boxShadow: '0 0 15px #d8b4fe' }}></div>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{split.label}</div>
                        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>{split.time}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ESlip;
