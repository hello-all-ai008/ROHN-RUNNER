import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { RunnerProvider, useRunner } from './context/RunnerContext';

import Home from './pages/Home';
import Scanner from './pages/Scanner';
import Monitor from './pages/Monitor';
import ESlip from './pages/ESlip';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';

function PageGuard({ pageId, children }) {
  const { pageConfig } = useRunner();
  const isEnabled = pageConfig?.[pageId] !== false;

  if (!isEnabled) {
    const notice = pageConfig?.notices?.[pageId] || 'หน้านี้ยังไม่เปิดให้บริการในขณะนี้ กรุณากลับสู่หน้าหลักหรือลองใหม่อีกครั้งในภายหลัง';
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        background: '#f8fafc'
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
          ปิดให้บริการชั่วคราว
        </h2>
        <p style={{ fontSize: '0.95rem', color: '#64748b', maxWidth: '420px', lineHeight: 1.5, margin: '0 0 24px 0' }}>
          {notice}
        </p>
        <Link
          to="/"
          style={{
            padding: '10px 24px',
            borderRadius: '10px',
            background: '#2563eb',
            color: '#ffffff',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
          }}
        >
          กลับสู่หน้าหลัก
        </Link>
      </div>
    );
  }

  return children;
}

function App() {
  return (
    <RunnerProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scanner" element={<PageGuard pageId="scanner"><Scanner /></PageGuard>} />
          <Route path="/monitor/:id" element={<PageGuard pageId="monitor"><Monitor /></PageGuard>} />
          <Route path="/eslip" element={<PageGuard pageId="eslip"><ESlip /></PageGuard>} />
          <Route path="/eslip/:bib" element={<PageGuard pageId="eslip"><ESlip /></PageGuard>} />
          <Route path="/dashboard" element={<PageGuard pageId="dashboard"><Dashboard /></PageGuard>} />
          <Route path="/leaderboard" element={<PageGuard pageId="leaderboard"><Leaderboard /></PageGuard>} />
        </Routes>
      </Router>
    </RunnerProvider>
  );
}

export default App;
