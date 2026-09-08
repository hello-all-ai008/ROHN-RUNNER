import React from 'react';
import { Link } from 'react-router-dom';
import logoFull from '../LOGO/logo-rohn-full.png';

function Home() {
  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <img src={logoFull} alt="ROHN Logo" style={{ width: '100%', maxWidth: '180px', marginBottom: '0.5rem' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Runner Management System (React SPA)</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', flex: 1, alignContent: 'center' }}>
        
        <Link to="/scanner" className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem 0.5rem', textDecoration: 'none', color: 'var(--text-main)', transition: 'all 0.3s ease', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📱</div>
          <h3 style={{ fontSize: '0.9rem', margin: 0, marginBottom: '0.2rem' }}>Check-in Scanner</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0, lineHeight: 1.2 }}>Scan BIB to Monitor</p>
        </Link>

        <Link to="/monitor/1" className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem 0.5rem', textDecoration: 'none', color: 'var(--text-main)', transition: 'all 0.3s ease', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🖥️</div>
          <h3 style={{ fontSize: '0.9rem', margin: 0, marginBottom: '0.2rem' }}>Monitor TV</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0, lineHeight: 1.2 }}>Large screen display</p>
        </Link>

        <Link to="/eslip" className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem 0.5rem', textDecoration: 'none', color: 'var(--text-main)', transition: 'all 0.3s ease', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎟️</div>
          <h3 style={{ fontSize: '0.9rem', margin: 0, marginBottom: '0.2rem' }}>E-Slip Result</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0, lineHeight: 1.2 }}>Electronic slip</p>
        </Link>

        <Link to="/dashboard" className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem 0.5rem', textDecoration: 'none', color: 'var(--text-main)', transition: 'all 0.3s ease', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
          <h3 style={{ fontSize: '0.9rem', margin: 0, marginBottom: '0.2rem' }}>Dashboard</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0, lineHeight: 1.2 }}>Summary statistics</p>
        </Link>

        <Link to="/leaderboard" className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem 0.5rem', textDecoration: 'none', color: 'var(--text-main)', transition: 'all 0.3s ease', textAlign: 'center', gridColumn: '1 / -1' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏆</div>
          <h3 style={{ fontSize: '0.9rem', margin: 0, marginBottom: '0.2rem' }}>Leaderboard</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0, lineHeight: 1.2 }}>Top 5 by Age Group</p>
        </Link>

      </div>
    </div>
  );
}

export default Home;
