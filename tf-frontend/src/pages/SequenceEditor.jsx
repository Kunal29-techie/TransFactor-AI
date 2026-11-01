import React, { useState, useCallback } from 'react';
import { Type, Eraser, ArrowRightLeft, RotateCcw, Hash, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Standard codon table
const CODON_TABLE = {
  'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
  'CTT': 'L', 'CTC': 'L', 'CTA': 'L', 'CTG': 'L',
  'ATT': 'I', 'ATC': 'I', 'ATA': 'I', 'ATG': 'M',
  'GTT': 'V', 'GTC': 'V', 'GTA': 'V', 'GTG': 'V',
  'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S',
  'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
  'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
  'GCT': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
  'TAT': 'Y', 'TAC': 'Y', 'TAA': '*', 'TAG': '*',
  'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
  'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
  'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
  'TGT': 'C', 'TGC': 'C', 'TGA': '*', 'TGG': 'W',
  'CGT': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
  'AGT': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
  'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G',
};

const RC_MAP = { 'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G', 'N': 'N' };

function translateDNA(dna) {
  const clean = dna.toUpperCase().replace(/[^ATGCN]/g, '');
  let protein = '';
  for (let i = 0; i + 2 < clean.length; i += 3) {
    const codon = clean.slice(i, i + 3);
    const aa = CODON_TABLE[codon] || '?';
    if (aa === '*') break;
    protein += aa;
  }
  return protein;
}

function reverseComplement(dna) {
  return dna.toUpperCase().split('').reverse().map(c => RC_MAP[c] || c).join('');
}

function parseSequences(text) {
  const seqs = [];
  let current = null;
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('>')) {
      if (current) seqs.push(current);
      current = { header: trimmed, seq: '' };
    } else if (current && trimmed) {
      current.seq += trimmed;
    }
  }
  if (current) seqs.push(current);
  return seqs;
}

function SequenceEditor() {
  const [text, setText] = useState('');
  const [info, setInfo] = useState(null);
  const navigate = useNavigate();

  const computeStats = useCallback((t) => {
    const seqs = parseSequences(t);
    if (seqs.length === 0) return null;
    const totalRes = seqs.reduce((s, x) => s + x.seq.length, 0);
    const gcContent = seqs.length > 0
      ? (() => { const s = seqs.map(x => x.seq).join('').toUpperCase(); const gc = (s.match(/[GC]/g) || []).length; return s.length > 0 ? ((gc / s.length) * 100).toFixed(1) : 'N/A'; })()
      : 'N/A';
    return { count: seqs.length, total: totalRes, avg: seqs.length ? Math.round(totalRes / seqs.length) : 0, gc: gcContent };
  }, []);

  const handleChange = (e) => {
    setText(e.target.value);
    setInfo(computeStats(e.target.value));
  };

  const doUppercase = () => {
    const updated = text.split('\n').map(l => l.startsWith('>') ? l : l.toUpperCase()).join('\n');
    setText(updated); setInfo(computeStats(updated));
  };

  const doClean = () => {
    const validAA = new Set('ACDEFGHIKLMNPQRSTVWY');
    const updated = text.split('\n').map(l => {
      if (l.startsWith('>')) return l;
      return l.toUpperCase().split('').filter(c => validAA.has(c)).join('');
    }).join('\n');
    setText(updated); setInfo(computeStats(updated));
  };

  const doTranslate = () => {
    const seqs = parseSequences(text);
    const updated = seqs.map(s => `${s.header}\n${translateDNA(s.seq)}`).join('\n\n');
    setText(updated); setInfo(computeStats(updated));
  };

  const doRevComp = () => {
    const seqs = parseSequences(text);
    const updated = seqs.map(s => `${s.header}_revcomp\n${reverseComplement(s.seq)}`).join('\n\n');
    setText(updated); setInfo(computeStats(updated));
  };

  const doCount = () => setInfo(computeStats(text));

  const doSend = () => navigate('/analysis', { state: { pastedSequence: text } });

  const toolbarBtns = [
    { label: 'Uppercase', icon: <Type size={15} />, fn: doUppercase },
    { label: 'Clean', icon: <Eraser size={15} />, fn: doClean },
    { label: 'DNA→Protein', icon: <ArrowRightLeft size={15} />, fn: doTranslate },
    { label: 'Rev. Complement', icon: <RotateCcw size={15} />, fn: doRevComp },
    { label: 'Count', icon: <Hash size={15} />, fn: doCount },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Sequence Editor</h1>
        <p>Inspect, clean, and transform FASTA sequences before sending them to the classifier.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '24px' }}>
        {/* Editor Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {/* Toolbar */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderBottom: 'none', borderRadius: '12px 12px 0 0', padding: '12px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {toolbarBtns.map(btn => (
              <button key={btn.label} onClick={btn.fn} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '7px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, color: '#0f4c81', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e0f2fe'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f8fafc'}>
                {btn.icon} {btn.label}
              </button>
            ))}
          </div>

          {/* Code Editor */}
          <textarea
            value={text}
            onChange={handleChange}
            placeholder={">Sequence_Name\nMETHIONINE_SEQUENCE_HERE...\n\n>Another_Sequence\nATGCGTACGTAGCTAGCT..."}
            spellCheck={false}
            style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontSize: '13px', lineHeight: '1.7', backgroundColor: '#1e293b', color: '#4ade80', border: '1px solid #334155', borderRadius: '0 0 12px 12px', padding: '20px', minHeight: '420px', resize: 'vertical', outline: 'none', width: '100%', boxSizing: 'border-box' }}
          />

          {/* Send to Analysis */}
          <button onClick={doSend} disabled={!text.trim()}
            style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', borderRadius: '10px', backgroundColor: text.trim() ? '#0f4c81' : '#cbd5e1', color: '#fff', border: 'none', cursor: text.trim() ? 'pointer' : 'not-allowed', fontSize: '0.95rem', fontWeight: 600, transition: 'background 0.2s' }}>
            <Send size={18} /> Send to Analysis Queue
          </button>
        </div>

        {/* Stats Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: '0.95rem' }}>Sequence Statistics</h3>
            {info ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Sequences', value: info.count },
                  { label: 'Total Residues', value: info.total.toLocaleString() },
                  { label: 'Avg. Length', value: `${info.avg} aa` },
                  { label: 'GC Content', value: `${info.gc}%` },
                ].map(stat => (
                  <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{stat.label}</span>
                    <span style={{ fontSize: '0.95rem', color: '#0f4c81', fontWeight: 700 }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>Paste a FASTA sequence to see stats.</p>
            )}
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '0.95rem' }}>Tips</h3>
            <ul style={{ margin: 0, paddingLeft: '16px', color: '#64748b', fontSize: '0.82rem', lineHeight: '1.8' }}>
              <li><b>Clean</b> strips invalid amino acid characters.</li>
              <li><b>DNA→Protein</b> translates nucleotide to protein.</li>
              <li><b>Rev. Complement</b> works on DNA strands.</li>
              <li>Multiple sequences are supported.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SequenceEditor;
