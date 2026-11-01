import React, { useState, useEffect } from 'react';
import { Activity, Database, Dna, Server, ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [stats, setStats] = useState({ totalJobs: 0, totalSeqs: 0, totalTFs: 0, modelOnline: false });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [healthRes, historyRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/').then(r => r.json()).catch(() => ({ status: 'offline', models_loaded: false })),
          fetch('http://127.0.0.1:8000/batch/history').then(r => r.json()).catch(() => [])
        ]);

        const totalTFs = historyRes.reduce((sum, job) => sum + (job.results ? job.results.filter(r => r.is_tf).length : 0), 0);
        const totalSeqs = historyRes.reduce((sum, job) => sum + (job.total_sequences || 0), 0);

        setStats({
          totalJobs: historyRes.length,
          totalSeqs,
          totalTFs,
          modelOnline: healthRes.status === 'online' && healthRes.models_loaded
        });
        setRecentJobs(historyRes.slice(0, 5));
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const statCards = [
    { icon: <Database size={24} />, label: 'Total Analyses', value: stats.totalJobs, color: '#0f4c81' },
    { icon: <Dna size={24} />, label: 'Sequences Processed', value: stats.totalSeqs, color: '#7c3aed' },
    { icon: <Activity size={24} />, label: 'TFs Discovered', value: stats.totalTFs, color: '#059669' },
    { icon: <Server size={24} />, label: 'Model Status', value: stats.modelOnline ? 'Online' : 'Offline', color: stats.modelOnline ? '#059669' : '#dc2626', dot: true }
  ];

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard Overview</h1>
        <p>System metrics and recent activity for TransFactor AI.</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        {statCards.map((card, i) => (
          <div key={i} style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                {card.icon}
              </div>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>{card.label}</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {card.dot && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: card.color, animation: stats.modelOnline ? 'pulse 2s infinite' : 'none' }} />}
              {loading ? '...' : card.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Recent Activity */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={18} /> Recent Activity</h3>
            <Link to="/history" style={{ color: '#0f4c81', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>View All <ArrowRight size={14} /></Link>
          </div>
          {recentJobs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No analyses yet. Start your first batch prediction!</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filename</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sequences</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map(job => (
                  <tr key={job.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 24px', fontSize: '0.9rem', color: '#0f172a', fontWeight: 500 }}>{job.filename}</td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#64748b' }}>{formatDate(job.created_at)}</td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#64748b' }}>{job.total_sequences}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: job.status === 'COMPLETED' ? '#dcfce7' : job.status === 'FAILED' ? '#fee2e2' : '#e0f2fe', color: job.status === 'COMPLETED' ? '#166534' : job.status === 'FAILED' ? '#991b1b' : '#0369a1' }}>
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick Start */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '28px' }}>
          <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '1.1rem' }}>Quick Start</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '24px' }}>
            TransFactor AI uses ESM2 protein embeddings and deep learning classifiers to identify transcription factors and predict their structural family from raw protein sequences.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link to="/analysis" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '8px', backgroundColor: '#0f4c81', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', transition: 'background 0.2s' }}>
              <Dna size={18} /> Start New Analysis <ArrowRight size={16} />
            </Link>
            <Link to="/editor" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#0f4c81', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', border: '1px solid #e2e8f0' }}>
              Open Sequence Editor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
