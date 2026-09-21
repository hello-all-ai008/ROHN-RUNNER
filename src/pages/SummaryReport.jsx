import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRunner } from '../context/RunnerContext';
import logoFull from '../LOGO/logo-rohn-full.png';
import { ArrowLeft, Printer, BarChart2 } from 'lucide-react';
import { getRunnerRaceStatus } from '../lib/results';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts';

const STATUS_COLOR = {
  Finished: '#10b981', // success-green
  'In Race': '#3b82f6', // accent-blue
  DNS: '#94a3b8', // text-muted
  DNF: '#f43f5e', // warn
  'Pre-registered': '#94a3b8',
  'Checked In': '#3b82f6',
};

function SummaryReport() {
  const [printOrientation, setPrintOrientation] = React.useState('portrait');
  const { runners, loading } = useRunner();
  const liveRunners = runners;

  // Race-progress status per runner (Finished / In Race / DNS / DNF)
  const runnersWithStatus = useMemo(
    () => liveRunners.map(r => ({ ...r, raceStatusCode: getRunnerRaceStatus(r) })),
    [liveRunners]
  );

  const totalCount = liveRunners.length;
  const checkedInCount = liveRunners.filter(r => r.registration_status === 'CHECKED_IN').length;
  const finishedCount = runnersWithStatus.filter(r => r.raceStatusCode === 'FINISHED').length;
  const inRaceCount = runnersWithStatus.filter(r => r.raceStatusCode === 'IN_RACE').length;
  const dnsCount = runnersWithStatus.filter(r => r.raceStatusCode === 'DNS').length;
  const dnfCount = runnersWithStatus.filter(r => r.raceStatusCode === 'DNF').length;
  const dnsDnfCount = dnsCount + dnfCount;

  const pieData = [
    { name: 'Finished', value: finishedCount, color: STATUS_COLOR.Finished },
    { name: 'In Race', value: inRaceCount, color: STATUS_COLOR['In Race'] },
    { name: 'DNS', value: dnsCount, color: STATUS_COLOR.DNS },
    { name: 'DNF', value: dnfCount, color: STATUS_COLOR.DNF },
  ].filter(d => d.value > 0);

  const distanceColorMap = useMemo(() => {
    const map = {};
    liveRunners.forEach(r => {
      if (r.distance && r.cat_color && !map[r.distance]) map[r.distance] = r.cat_color;
    });
    return map;
  }, [liveRunners]);

  const distances = useMemo(() => {
    const set = new Set();
    liveRunners.forEach(r => { if (r.distance) set.add(r.distance); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [liveRunners]);

  const barData = useMemo(() => {
    return distances.map(dist => {
      const inDist = runnersWithStatus.filter(r => r.distance === dist);
      const dnsDnf = inDist.filter(r => r.raceStatusCode === 'DNS' || r.raceStatusCode === 'DNF').length;
      return {
        name: dist,
        Total: inDist.length,
        DNS_DNF: dnsDnf,
        color: distanceColorMap[dist] || '#3b82f6',
      };
    });
  }, [distances, runnersWithStatus, distanceColorMap]);

  const handlePrint = (orientation) => {
    setPrintOrientation(orientation);
    setTimeout(() => {
      window.print();
    }, 100); // Wait for state to update and inject CSS
  };

  return (
    <div className="container" style={{ maxWidth: '1400px', backgroundColor: 'var(--bg)', minHeight: '100vh', padding: '2rem' }}>
      <style>
        {`
          @media print {
            @page {
              size: ${printOrientation};
              margin: 1cm;
            }
            .print-charts-row {
              display: ${printOrientation === 'portrait' ? 'block' : 'grid'} !important;
            }
            /* Override the global index.css block style if landscape */
          }
        `}
      </style>
      <div className="hide-on-print" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/dashboard" className="btn-back" style={{ marginBottom: 0 }}>
          <ArrowLeft size={18} /> กลับหน้า Dashboard
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => handlePrint('portrait')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '8px',
              backgroundColor: '#475569', color: '#fff',
              border: 'none', cursor: 'pointer', fontWeight: 600,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <Printer size={18} />
            Print (แนวตั้ง)
          </button>
          <button 
            onClick={() => handlePrint('landscape')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '8px',
              backgroundColor: '#2563eb', color: '#fff',
              border: 'none', cursor: 'pointer', fontWeight: 600,
              boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
            }}
          >
            <Printer size={18} />
            Print (แนวนอน)
          </button>
        </div>
      </div>

      <div className="print-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <img src={logoFull} alt="ROHN Logo" style={{ height: '50px' }} />
        <div style={{ width: '2px', height: '50px', backgroundColor: 'var(--text-muted)', opacity: 0.3 }}></div>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-main)', lineHeight: 1 }}>
            Summary Report
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, marginTop: '4px', fontSize: '1rem' }}>
            {new Date().toLocaleString('th-TH')}
          </p>
        </div>
      </div>

      {loading && totalCount === 0 && (
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Loading results...</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ink)' }}>{totalCount}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Total Runners</div>
        </div>
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: STATUS_COLOR['Checked In'] }}>{checkedInCount}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Checked In</div>
        </div>
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: STATUS_COLOR.Finished }}>{finishedCount}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Finished</div>
        </div>
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: STATUS_COLOR['In Race'] }}>{inRaceCount}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>In Race</div>
        </div>
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: STATUS_COLOR.DNS }}>{dnsDnfCount}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>DNS / DNF</div>
        </div>
      </div>

      <div className="print-charts-row" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--line)', pageBreakInside: 'avoid' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>Overall Status</h2>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--line)', pageBreakInside: 'avoid' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>Status by Distance</h2>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Total" name="Total Runners">
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList dataKey="Total" position="top" style={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                </Bar>
                <Bar dataKey="DNS_DNF" name="DNS / DNF" fill={STATUS_COLOR.DNS}>
                  <LabelList dataKey="DNS_DNF" position="top" style={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SummaryReport;
