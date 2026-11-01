import React, { useState, useEffect } from 'react';
import { Clock, FileText, ChevronDown, ChevronUp, Download, Eye, AlertCircle } from 'lucide-react';

function ProjectHistory() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/batch/history')
      .then(r => r.json())
      .then(data => { setJobs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const downloadCSV = (job) => {
    if (!job.results || job.results.length === 0) return;
    const header = 'Sequence ID,Is TF,TF Confidence,Family,Family Confidence\n';
    const rows = job.results.map(r => `${r.sequence_id},${r.is_tf},${r.tf_confidence.toFixed(4)},${r.family},${r.family_confidence.toFixed(4)}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${job.filename}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>Project History</h1>
          <p>Loading past analyses...</p>
        </div>
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Project History</h1>
        <p>Review past batch prediction runs, download results, and inspect individual sequences.</p>
      </div>

      {jobs.length === 0 ? (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '60px', textAlign: 'center' }}>
          <AlertCircle size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: '#475569', marginBottom: '8px' }}>No History Yet</h3>
          <p style={{ color: '#94a3b8' }}>Run a batch prediction on the Analysis page to see results here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {jobs.map(job => {
            const isExpanded = expandedJob === job.id;
            const tfCount = job.results ? job.results.filter(r => r.is_tf).length : 0;

            return (
              <div key={job.id} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'box-shadow 0.2s' }}>
                {/* Job Header */}
                <div
                  onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                  style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: isExpanded ? '#f8fafc' : '#fff', transition: 'background 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#0f4c8115', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f4c81' }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem', marginBottom: '4px' }}>{job.filename}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} /> {formatDate(job.created_at)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right', marginRight: '8px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{job.total_sequences} sequences</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#059669' }}>{tfCount} TFs found</div>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: job.status === 'COMPLETED' ? '#dcfce7' : job.status === 'FAILED' ? '#fee2e2' : '#fef3c7', color: job.status === 'COMPLETED' ? '#166534' : job.status === 'FAILED' ? '#991b1b' : '#92400e' }}>
                      {job.status}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); downloadCSV(job); }} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#0f4c81', fontSize: '0.8rem', fontWeight: 500 }}>
                      <Download size={14} /> CSV
                    </button>
                    {isExpanded ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
                  </div>
                </div>

                {/* Expanded Results */}
                {isExpanded && job.results && (
                  <div style={{ borderTop: '1px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f1f5f9' }}>
                          <th style={{ padding: '10px 24px', textAlign: 'left', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sequence ID</th>
                          <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Classification</th>
                          <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TF Confidence</th>
                          <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Family</th>
                          <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Family Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {job.results.map((res, idx) => (
                          <tr key={idx} style={{ borderTop: '1px solid #f1f5f9', borderLeft: res.is_tf ? '4px solid #22c55e' : '4px solid transparent' }}>
                            <td style={{ padding: '12px 24px', fontSize: '0.85rem', color: '#0f172a', fontWeight: 500, fontFamily: 'monospace' }}>{res.sequence_id}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: res.is_tf ? '#dcfce7' : '#f1f5f9', color: res.is_tf ? '#166534' : '#475569' }}>
                                {res.is_tf ? 'TRANSCRIPTION FACTOR' : 'NOT TF'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#0f172a' }}>{(res.tf_confidence * 100).toFixed(1)}%</td>
                            <td style={{ padding: '12px 16px' }}>
                              {res.is_tf ? (
                                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#e0e7ff', color: '#3730a3' }}>{res.family}</span>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>—</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#0f172a' }}>
                              {res.is_tf ? `${(res.family_confidence * 100).toFixed(1)}%` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Sequence Viewer for TFs */}
                    {job.results.filter(r => r.is_tf && r.sequence).length > 0 && (
                      <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0' }}>
                        <h4 style={{ color: '#0f172a', fontSize: '0.85rem', marginBottom: '12px' }}>Identified TF Sequences</h4>
                        {job.results.filter(r => r.is_tf && r.sequence).map((res, idx) => (
                          <div key={idx} style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px' }}>
                              {res.sequence_id} — <span style={{ color: '#4ade80' }}>{res.family}</span>
                            </div>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', lineHeight: '1.6', wordBreak: 'break-all', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', padding: '10px', borderRadius: '6px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                              {res.sequence}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProjectHistory;
