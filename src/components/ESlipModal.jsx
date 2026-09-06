import React, { useEffect } from 'react';
import ESlip from './ESlip';
import { X, Printer } from 'lucide-react';

export default function ESlipModal({ runner, overallRank, catRank, stations = [], onClose }) {
  if (!runner) return null;

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="modal-bg open" 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '16px', 
        overflowY: 'auto',
        boxSizing: 'border-box'
      }} 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px', 
        alignItems: 'center', 
        width: '100%', 
        maxWidth: '380px',
        margin: 'auto'
      }}>
        
        {/* Render the ESlip component */}
        <ESlip runner={runner} overallRank={overallRank} catRank={catRank} stations={stations} />
        
        {/* Actions - hidden when printing */}
        <div style={{ display: 'flex', gap: '10px', width: '100%' }} className="no-print">
          <button 
            type="button"
            style={{ 
              flex: 1, 
              padding: '12px', 
              borderRadius: '10px', 
              fontSize: '14px', 
              fontWeight: 600,
              backgroundColor: '#334155',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background-color 0.2s'
            }} 
            onClick={onClose}
          >
            <X size={18} /> ปิด (Close)
          </button>
          <button 
            type="button"
            style={{ 
              flex: 1, 
              padding: '12px', 
              borderRadius: '10px', 
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
              color: '#ffffff', 
              fontSize: '14px', 
              fontWeight: 600, 
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              transition: 'transform 0.2s'
            }} 
            onClick={() => window.print()}
          >
            <Printer size={18} /> พิมพ์ (Print)
          </button>
        </div>
      </div>
    </div>
  );
}
