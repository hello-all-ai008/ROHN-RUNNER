import React from 'react';
import { Link } from 'react-router-dom';
import logoFull from '../LOGO/logo-rohn-full.png';

function Home() {
  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <img src={logoFull} alt="ROHN Logo" style={{ width: '100%', maxWidth: '350px', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Runner Management System (React SPA)</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        
        <Link to="/scanner" className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textDecoration: 'none', color: 'var(--text-main)', transition: 'all 0.3s ease' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
          <h3>Check-in Scanner</h3>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>Scan BIB and Cast to Monitor</p>
        </Link>

        <Link to="/monitor/1" className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textDecoration: 'none', color: 'var(--text-main)', transition: 'all 0.3s ease' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🖥️</div>
          <h3>Monitor TV (ID: 1)</h3>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>Large screen for real-time check-in</p>
        </Link>

        <Link to="/eslip" className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textDecoration: 'none', color: 'var(--text-main)', transition: 'all 0.3s ease' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎟️</div>
          <h3>E-Slip Result</h3>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>Runner's electronic slip</p>
        </Link>

        <Link to="/dashboard" className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textDecoration: 'none', color: 'var(--text-main)', transition: 'all 0.3s ease' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <h3>Overall Dashboard</h3>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>Summary & Statistics</p>
        </Link>

        <Link to="/leaderboard" className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textDecoration: 'none', color: 'var(--text-main)', transition: 'all 0.3s ease' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
          <h3>Leaderboard</h3>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>Top 5 Monitor by Age Group</p>
        </Link>

      </div>
    </div>
  );
}

export default Home;
