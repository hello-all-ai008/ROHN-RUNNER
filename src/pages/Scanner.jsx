import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRunner } from '../context/RunnerContext';
import ScannerInput from '../components/ScannerInput';
import logoFull from '../LOGO/logo-rohn-full.png';
import { ArrowLeft } from 'lucide-react';

function Scanner() {
  const [bib, setBib] = useState('');
  const [monitorId, setMonitorId] = useState('1');
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const { checkInRunner, castToMonitor } = useRunner();

  const handleCheckIn = (scannedBib = null) => {
    const bibToUse = typeof scannedBib === 'string' ? scannedBib : bib;
    
    if (!bibToUse) {
      setMessage({ type: 'error', text: 'Please enter a BIB number.' });
      return;
    }

    const result = checkInRunner(bibToUse);
    if (result.success) {
      let startTimeStr = null;
      if (result.gunStartTime) {
        const d = new Date(result.gunStartTime);
        if (!isNaN(d.getTime())) {
          startTimeStr = d.toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        }
      }

      castToMonitor(monitorId, bibToUse, result.name, result.distance, result.ageGroup, {
        source: 'rohn_runner_scanner',
        gunStartTime: result.gunStartTime
      });

      setMessage({ 
        type: 'success', 
        bib: bibToUse, 
        name: result.name, 
        distance: result.distance, 
        ageGroup: result.ageGroup, 
        startTime: startTimeStr,
        monitorId: monitorId 
      });
      if (typeof scannedBib !== 'string') setBib('');
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px', paddingTop: '2rem' }}>
      <Link to="/" className="btn-back"><ArrowLeft size={18} /> กลับหน้าหลัก (Home)</Link>
      
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src={logoFull} alt="ROHN Logo" style={{ height: '50px', marginBottom: '0.5rem' }} />
          <h2 style={{ textAlign: 'center', margin: 0, fontSize: '1.2rem', color: 'var(--text-muted)' }}>Check-in Scanner</h2>
        </div>
        
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ScannerInput 
            onScan={handleCheckIn} 
            monitorId={monitorId} 
            setMonitorId={setMonitorId} 
          />

          {message.type === 'error' && (
            <div style={{ marginTop: '1.5rem', width: '100%', maxWidth: '600px', textAlign: 'center', fontWeight: 600, padding: '1rem', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#ef4444' }}>
              {message.text}
            </div>
          )}

          {message.type === 'success' && (
            <div style={{ marginTop: '1.5rem', width: '100%', maxWidth: '600px', padding: '1.5rem', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <div style={{ textAlign: 'center', color: 'var(--success-green)', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '1rem' }}>✅ สแกนสำเร็จ (ส่งขึ้นจอ {message.monitorId})</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>BIB</span>
                  <strong style={{ fontSize: '1.5rem', color: '#111827' }}>{message.bib}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Name</span>
                  <strong style={{ fontSize: '1.5rem', color: '#111827' }}>{message.name}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Distance</span>
                  <strong style={{ fontSize: '1.5rem', color: '#111827' }}>{message.distance}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Age Group</span>
                  <strong style={{ fontSize: '1.5rem', color: '#111827' }}>{message.ageGroup}</strong>
                </div>
                {message.startTime && (
                  <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1', borderTop: '1px dashed #bbf7d0', paddingTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Start Time</span>
                    <strong style={{ fontSize: '1.3rem', color: 'var(--success-green)' }}>⏱️ {message.startTime}</strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Scanner;
