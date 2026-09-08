import React from 'react';
import { Link } from 'react-router-dom';
import logoFull from '../LOGO/logo-rohn-full.png';
import { useRunner, DEFAULT_PAGE_CONFIG } from '../context/RunnerContext';

function Home() {
  const { pageConfig = DEFAULT_PAGE_CONFIG } = useRunner();
  const displayMode = pageConfig?.displayMode || 'disabled_badge';

  const cards = [
    {
      id: 'scanner',
      to: '/scanner',
      emoji: '📱',
      title: 'Check-in Scanner',
      desc: 'Scan BIB to Monitor',
      fullWidth: false
    },
    {
      id: 'monitor',
      to: '/monitor/1',
      emoji: '🖥️',
      title: 'Monitor TV',
      desc: 'Large screen display',
      fullWidth: false
    },
    {
      id: 'eslip',
      to: '/eslip',
      emoji: '🎟️',
      title: 'E-Slip Result',
      desc: 'Electronic slip',
      fullWidth: false
    },
    {
      id: 'dashboard',
      to: '/dashboard',
      emoji: '📊',
      title: 'Dashboard',
      desc: 'Summary statistics',
      fullWidth: false
    },
    {
      id: 'leaderboard',
      to: '/leaderboard',
      emoji: '🏆',
      title: 'Leaderboard',
      desc: 'Top 5 by Age Group',
      fullWidth: true
    }
  ];

  const handleDisabledClick = (e, item) => {
    e.preventDefault();
    const notice = pageConfig?.notices?.[item.id] || 'หน้านี้ยังไม่เปิดให้บริการในขณะนี้';
    alert(`🔒 ${item.title}\n\n${notice}`);
  };

  // Filter out cards if displayMode is 'hidden'
  const visibleCards = cards.filter(c => {
    const isEnabled = pageConfig?.[c.id] !== false;
    if (!isEnabled && displayMode === 'hidden') return false;
    return true;
  });

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <img src={logoFull} alt="ROHN Logo" style={{ width: '100%', maxWidth: '180px', marginBottom: '0.5rem' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Runner Management System (React SPA)</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', flex: 1, alignContent: 'center' }}>
        {visibleCards.map((item) => {
          const isEnabled = pageConfig?.[item.id] !== false;

          const cardStyle = {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem 0.5rem',
            textDecoration: 'none',
            color: isEnabled ? 'var(--text-main)' : 'var(--text-muted)',
            transition: 'all 0.3s ease',
            textAlign: 'center',
            gridColumn: item.fullWidth ? '1 / -1' : 'auto',
            position: 'relative',
            opacity: isEnabled ? 1 : 0.65,
            cursor: isEnabled ? 'pointer' : 'not-allowed',
            filter: isEnabled ? 'none' : 'grayscale(35%)',
            background: isEnabled ? 'var(--bg-card)' : '#f8fafc',
            border: isEnabled ? '1px solid var(--border-color)' : '1px dashed #cbd5e1'
          };

          if (!isEnabled) {
            return (
              <div
                key={item.id}
                className="card"
                style={cardStyle}
                onClick={(e) => handleDisabledClick(e, item)}
                title={pageConfig?.notices?.[item.id] || 'หน้านี้ยังไม่เปิดให้บริการในขณะนี้'}
              >
                {/* Disabled Badge */}
                <span style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '6px',
                  border: '1px solid #fecdd3'
                }}>
                  🔒 ปิดปรับปรุง
                </span>

                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{item.emoji}</div>
                <h3 style={{ fontSize: '0.9rem', margin: 0, marginBottom: '0.2rem' }}>{item.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0, lineHeight: 1.2 }}>{item.desc}</p>
              </div>
            );
          }

          return (
            <Link
              key={item.id}
              to={item.to}
              className="card"
              style={cardStyle}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{item.emoji}</div>
              <h3 style={{ fontSize: '0.9rem', margin: 0, marginBottom: '0.2rem' }}>{item.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0, lineHeight: 1.2 }}>{item.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default Home;
