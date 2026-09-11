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

function GlobalErrorBanner() {
  const { error, refetchRunners } = useRunner();
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    if (error) setDismissed(false);
  }, [error]);

  if (!error || dismissed) return null;

  return (
    <div
      role="alert"
      style={{
        backgroundColor: '#fef2f2',
        borderBottom: '1px solid #fecaca',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        color: '#991b1b',
        fontSize: '0.875rem',
        fontWeight: 500,
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          เกิดข้อผิดพลาดในการโหลดข้อมูล: {error}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {refetchRunners && (
          <button
            type="button"
            onClick={refetchRunners}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            ลองใหม่
          </button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#991b1b',
            cursor: 'pointer',
            fontSize: '1rem',
            lineHeight: 1,
            padding: '2px 6px',
            fontWeight: 700
          }}
          title="ปิดการแจ้งเตือน"
          aria-label="ปิดการแจ้งเตือน"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <RunnerProvider>
      <Router>
        <GlobalErrorBanner />
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
