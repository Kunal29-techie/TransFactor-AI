import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud, FileText, Play, CheckCircle2, XCircle, Search, Dna,
  Sparkles, Clock, ArrowRight, Tag, Filter, Copy, Check, X,
  AlertCircle, ChevronDown, ChevronUp, RefreshCw, ExternalLink, Database, BookOpen
} from 'lucide-react';

const POPULAR_FAMILIES = [
  'WRKY', 'MYB', 'bHLH', 'NAC', 'AP2/ERF', 'bZIP', 'MADS', 'C2H2', 'GATA', 'HD-ZIP'
];

// Comprehensive Plant Transcription Factor Database (Pfam, InterPro & PlantTFDB)
const PFAM_DATABASE = {
  'WRKY': { pfam: 'PF03106', interpro: 'IPR003657', desc: 'WRKY DNA-binding domain (WRKYGQK zinc-finger motif)' },
  'MYB': { pfam: 'PF00249', interpro: 'IPR001005', desc: 'MYB DNA-binding domain (Helix-turn-helix)' },
  'MYB_related': { pfam: 'PF00249', interpro: 'IPR001005', desc: 'Single-repeat MYB-like regulatory domain' },
  'bHLH': { pfam: 'PF00010', interpro: 'IPR001092', desc: 'basic Helix-Loop-Helix domain (E-box binding)' },
  'NAC': { pfam: 'PF02365', interpro: 'IPR003441', desc: 'NAM/ATAF/CUC (NAC) domain' },
  'AP2': { pfam: 'PF00847', interpro: 'IPR001471', desc: 'APETALA2 DNA-binding domain' },
  'ERF': { pfam: 'PF00847', interpro: 'IPR001471', desc: 'Ethylene-responsive element binding factor' },
  'bZIP': { pfam: 'PF00170', interpro: 'IPR000729', desc: 'basic Leucine Zipper dimerization domain' },
  'MADS': { pfam: 'PF00319', interpro: 'IPR002100', desc: 'MADS-box floral organ identity domain' },
  'C2H2': { pfam: 'PF00096', interpro: 'IPR007087', desc: 'C2H2-type zinc finger nucleic acid binding' },
  'GATA': { pfam: 'PF00320', interpro: 'IPR000679', desc: 'GATA-type zinc finger domain' },
  'HD-ZIP': { pfam: 'PF00046', interpro: 'IPR001356', desc: 'Homeodomain-leucine zipper' },
  'B3': { pfam: 'PF02362', interpro: 'IPR003356', desc: 'B3 DNA-binding domain (Auxin/ABA response)' },
  'TCP': { pfam: 'PF03634', interpro: 'IPR005340', desc: 'TCP transcription factor domain' },
  'HSF': { pfam: 'PF00447', interpro: 'IPR000232', desc: 'Heat shock factor DNA-binding domain' },
  'SBP': { pfam: 'PF03110', interpro: 'IPR004333', desc: 'SQUAMOSA promoter binding protein' },
  'GRAS': { pfam: 'PF03514', interpro: 'IPR005202', desc: 'GRAS domain family (Gibberellin signaling)' },
  'ARF': { pfam: 'PF06507', interpro: 'IPR009270', desc: 'Auxin response factor DNA-binding domain' },
  'EIL': { pfam: 'PF04863', interpro: 'IPR007294', desc: 'Ethylene-insensitive3-like regulatory domain' },
  'GeBP': { pfam: 'PF04504', interpro: 'IPR007325', desc: 'GL1 enhancer-binding protein' },
  'FAR1': { pfam: 'PF03101', interpro: 'IPR004313', desc: 'FAR-RED impaired response domain' },
  'Dof': { pfam: 'PF02701', interpro: 'IPR003851', desc: 'DNA-binding with one finger (single zinc-finger)' },
  'Trihelix': { pfam: 'PF13837', interpro: 'IPR025178', desc: 'Trihelix GT factor domain' },
  'Whirly': { pfam: 'PF08536', interpro: 'IPR013988', desc: 'Whirly ssDNA/dsDNA binding domain' },
  'YABBY': { pfam: 'PF04690', interpro: 'IPR006961', desc: 'YABBY zinc finger / helix domain' },
  'ZF-HD': { pfam: 'PF04770', interpro: 'IPR007204', desc: 'Zinc finger homeodomain' },
  'WOX': { pfam: 'PF00046', interpro: 'IPR001356', desc: 'WUSCHEL-related homeobox' },
  'LBD': { pfam: 'PF03195', interpro: 'IPR004456', desc: 'Lateral organ boundaries (LOB) domain' },
  'RAV': { pfam: 'PF00847', interpro: 'IPR001471', desc: 'RAV (AP2 & B3) regulatory domain' },
  'NF-YA': { pfam: 'PF02045', interpro: 'IPR003958', desc: 'Nuclear factor Y subunit A (CCAAT-binding)' },
  'NF-YB': { pfam: 'PF00805', interpro: 'IPR000395', desc: 'Nuclear factor Y subunit B (Histone-fold)' },
  'NF-YC': { pfam: 'PF00805', interpro: 'IPR000395', desc: 'Nuclear factor Y subunit C' },
  'CPP': { pfam: 'PF03638', interpro: 'IPR005342', desc: 'Cysteine-rich polycomb (CPP) domain' },
  'CAMTA': { pfam: 'PF03859', interpro: 'IPR005574', desc: 'Calmodulin-binding transcription activator' },
  'C3H': { pfam: 'PF00642', interpro: 'IPR000571', desc: 'C3H-type zinc finger' },
  'DBB': { pfam: 'PF02037', interpro: 'IPR003952', desc: 'Double B-box zinc finger' },
  'E2F/DP': { pfam: 'PF02319', interpro: 'IPR003310', desc: 'E2F/DP transcription factor domain' }
};

const getDbLinks = (family) => {
  if (!family || family === 'Non-TF' || family.includes('<30')) return null;
  const famClean = family.trim();
  const entry =
    PFAM_DATABASE[famClean] ||
    Object.entries(PFAM_DATABASE).find(([k]) => k.toUpperCase() === famClean.toUpperCase())?.[1];

  const pfamId = entry?.pfam;
  const interproId = entry?.interpro;

  return {
    family: famClean,
    pfam_id: pfamId || 'Pfam Link',
    pfam_url: pfamId
      ? `https://www.ebi.ac.uk/interpro/entry/pfam/${pfamId}/`
      : `https://www.ebi.ac.uk/interpro/search/text/${famClean}/`,
    interpro_id: interproId || 'InterPro Link',
    interpro_url: interproId
      ? `https://www.ebi.ac.uk/interpro/entry/InterPro/${interproId}/`
      : `https://www.ebi.ac.uk/interpro/search/text/${famClean}/`,
    planttfdb_url: `http://planttfdb.gao-lab.org/family.php?fam=${famClean}`,
    cdd_url: pfamId
      ? `https://www.ncbi.nlm.nih.gov/Structure/cdd/cddsrv.cgi?uid=${pfamId}`
      : `https://www.ncbi.nlm.nih.gov/Structure/cdd/cddsrv.cgi?uid=${famClean}`,
    description: entry?.desc || `Plant transcription factor family: ${famClean}`
  };
};

export default function Analysis() {
  const [inputMode, setInputMode] = useState('upload'); // 'upload' | 'text'
  const [file, setFile] = useState(null);
  const [sequenceText, setSequenceText] = useState('');
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, percent: 0, status: 'idle' });
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'TF' | 'NONTF'
  const [startTime, setStartTime] = useState(null);
  const [eta, setEta] = useState(null);
  const [copied, setCopied] = useState(false);

  // Family / sequence query states
  const [familyInput, setFamilyInput] = useState('');
  const [queriedFamilies, setQueriedFamilies] = useState(['WRKY', 'MYB']);
  const [queryResults, setQueryResults] = useState([]);
  const [isSectionHighlighted, setIsSectionHighlighted] = useState(false);

  const fileInputRef = useRef(null);
  const pollRef = useRef(null);
  const querySectionRef = useRef(null);
  const queryInputRef = useRef(null);

  // Smoothly scrolls to the name query section and focuses the search input
  const scrollToQuerySection = () => {
    setTimeout(() => {
      if (querySectionRef.current) {
        querySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setIsSectionHighlighted(true);
        setTimeout(() => {
          queryInputRef.current?.focus();
        }, 500);
        setTimeout(() => {
          setIsSectionHighlighted(false);
        }, 2500);
      }
    }, 150);
  };

  // Re-run family & sequence presence checks whenever results or queried families change
  useEffect(() => {
    if (results.length === 0 || queriedFamilies.length === 0) {
      setQueryResults([]);
      return;
    }

    const evaluation = queriedFamilies.map((rawFam) => {
      const q = rawFam.trim().toUpperCase();
      if (!q) return null;

      const matching = results
        .filter((r) => {
          const rFam = (r.family || '').toUpperCase();
          const rId = (r.sequence_id || '').toUpperCase();
          const isIdMatch = rId.includes(q);
          const isTop = r.is_tf && (rFam === q || rFam.includes(q) || q.includes(rFam));
          
          // Check scores dictionary for queried family
          let score = 0;
          if (r.family_scores) {
            for (const [fName, fVal] of Object.entries(r.family_scores)) {
              if (fName.toUpperCase() === q || fName.toUpperCase().includes(q)) {
                score = Math.max(score, fVal);
              }
            }
          }

          // Signature domain motif check (e.g. WRKYGQK motif for WRKY)
          const hasMotif = (q === 'WRKY' && r.sequence && r.sequence.includes('WRKYG'));
          
          return isTop || isIdMatch || score >= 10.0 || hasMotif;
        })
        .map((r) => {
          const rFam = (r.family || '').toUpperCase();
          const rId = (r.sequence_id || '').toUpperCase();
          const isIdMatch = rId.includes(q);
          let score = 0;
          if (r.family_scores) {
            for (const [fName, fVal] of Object.entries(r.family_scores)) {
              if (fName.toUpperCase() === q || fName.toUpperCase().includes(q)) {
                score = Math.max(score, fVal);
              }
            }
          }
          const isTop = rFam === q;
          const hasMotif = (q === 'WRKY' && r.sequence && r.sequence.includes('WRKYG'));
          let conf = isTop ? r.family_confidence : Math.max(score, hasMotif ? 88.5 : 0);
          if (isIdMatch && conf === 0) {
            conf = r.is_tf ? (r.family_confidence || r.tf_confidence) : 100.0;
          }
          return {
            ...r,
            detected_family_confidence: Math.round(conf * 10) / 10
          };
        });

      if (matching.length > 0) {
        const topConf = Math.max(...matching.map((m) => m.detected_family_confidence || m.family_confidence || 0));
        return {
          family: rawFam.trim(),
          present: true,
          verdictText: 'YES',
          confidence: Math.round(topConf * 10) / 10,
          count: matching.length,
          matchingSequences: matching
        };
      } else {
        return {
          family: rawFam.trim(),
          present: false,
          verdictText: 'NO',
          confidence: 0,
          count: 0,
          matchingSequences: []
        };
      }
    }).filter(Boolean);

    setQueryResults(evaluation);
  }, [results, queriedFamilies]);

  // Handle adding query family
  const handleAddFamilyQuery = (famName) => {
    const clean = famName.trim();
    if (!clean) return;
    if (!queriedFamilies.some((f) => f.toUpperCase() === clean.toUpperCase())) {
      setQueriedFamilies([...queriedFamilies, clean]);
    }
  };

  const handleRemoveFamilyQuery = (famToRemove) => {
    setQueriedFamilies(queriedFamilies.filter((f) => f !== famToRemove));
  };

  const handleAddCustomFamilyInput = (e) => {
    e.preventDefault();
    if (!familyInput.trim()) return;
    const split = familyInput.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
    const newFams = [...queriedFamilies];
    split.forEach((f) => {
      if (!newFams.some((existing) => existing.toUpperCase() === f.toUpperCase())) {
        newFams.push(f);
      }
    });
    setQueriedFamilies(newFams);
    setFamilyInput('');
  };

  // Start analysis
  const startAnalysis = async () => {
    if (inputMode === 'upload' && !file) {
      alert('Please select a FASTA/genome file first.');
      return;
    }
    if (inputMode === 'text' && !sequenceText.trim()) {
      alert('Please enter or paste sequence text first.');
      return;
    }

    setLoading(true);
    setResults([]);
    setStartTime(Date.now());
    setEta(null);

    if (inputMode === 'upload') {
      setProgress({ current: 0, total: 0, percent: 0, status: 'Uploading FASTA file...' });
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('http://localhost:8000/batch/upload', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('Failed to upload file');
        const data = await res.json();
        setJobId(data.id);
        setProgress({
          current: 0,
          total: data.total_sequences || 1,
          percent: 0,
          status: 'Initializing Meta ESM2 inference...'
        });
      } catch (err) {
        console.error(err);
        setLoading(false);
        alert('Could not connect to backend at http://localhost:8000. Please ensure backend is running.');
      }
    } else {
      // Direct text / pasted sequence prediction
      setProgress({ current: 1, total: 1, percent: 50, status: 'Predicting with ESM2 & checking reading frames...' });
      try {
        const res = await fetch('http://localhost:8000/batch/predict-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fasta_text: sequenceText }),
        });
        if (!res.ok) throw new Error('Prediction failed');
        const data = await res.json();
        setResults(data);
        setProgress({ current: data.length, total: data.length, percent: 100, status: 'Completed' });
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
        alert('Prediction error on provided sequence.');
      }
    }
  };

  // Poll background batch progress
  useEffect(() => {
    if (!jobId || progress.status === 'completed' || progress.status === 'failed') return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/batch/status/${jobId}`);
        const data = await res.json();

        const current = data.processed_sequences || 0;
        const total = data.total_sequences || 1;
        const percent = Math.min(100, Math.round((current / total) * 100));

        if (startTime && current > 0) {
          const elapsedSec = (Date.now() - startTime) / 1000;
          const rate = current / elapsedSec;
          const remainingSec = Math.max(0, Math.round((total - current) / rate));
          if (remainingSec > 60) {
            setEta(`~${Math.round(remainingSec / 60)} mins remaining`);
          } else {
            setEta(`~${remainingSec}s remaining`);
          }
        }

        setProgress({ current, total, percent, status: data.status });

        if (data.status === 'completed') {
          clearInterval(pollRef.current);
          fetchResults(jobId);
        } else if (data.status === 'failed') {
          clearInterval(pollRef.current);
          setLoading(false);
          alert('Batch processing failed on backend.');
        }
      } catch (e) {
        console.error(e);
      }
    }, 1000);

    return () => clearInterval(pollRef.current);
  }, [jobId, progress.status, startTime]);

  const fetchResults = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/batch/results/${id}`);
      const data = await res.json();
      setResults(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const loadSampleTF = () => {
    setInputMode('text');
    setSequenceText(
      `>Arabidopsis_WRKY33_Positive_Control
MASTSEVEILSLKSSPSLSLLDDGLDLSLNNDQETISPQKPPPSISSSLLVDNDNDNDNKK
RRLSDGGRWRKYGQKVIKGNPFPRNYYKCTHPNCPVKKKVERSHDGQITEIIYKGEHNHPK
PKRTRSGRIVVKEELEDEEEKEDVDVDGDEKKKRRWRKYGQKVIKGNPFPRSYYKCTNANC
GVKKKVERSHVGQITEIIYKGEHNHPKPKRARRAK`
    );
    scrollToQuerySection();
  };

  const loadSampleGenome = () => {
    setInputMode('text');
    setSequenceText(
      `>Sesame_Genomic_Contig_DNA_Sample
ATGGCTTCGACGTCCGAAGTAGAGATTCTTAGCTTGAAAAGTTCGCCATCTCTTAGTCTCC
TCGACGATGGCTTGGACCTCTCTCTTAACAACGATCAGGAAACTATTTCTCCTCAAAAACC
GCCACCGTCTATCTCTTCTTCTCTCCTCGTTGATAATGATAATGATAATGATAACAAGAAG
CGTCGTCTCTCTGATGGTGGTAGATGGCGAAAATACGGTCAGAAGGTGATCAAAGGAAATC
CGTTTCCTCGTAATTATTACAAGTGCACACATCCAAACTGCCCTGTGAAGAAGAAAGTCGA
GAGATCTCACGATGGTCAGATTACTGAAATTATTTATAAGGGTGAGCATAATCATCCAAAG
CCAAAGCGTACTAGATCCGGTCGTATTGTAGTTAAAGAGGAATTAGAAGACGAAGAAGAGA
AAGAAGATGTTGATGTTGACGGTGATGAGAAGAAGAAGAGACGATGGAGGAAGTACGGACA
GAAGGTGATCAAAGGAAATCCATTTCCTCGTTCTTATTACAAGTGCACAAACGCTAATTGC
GGAGTTAAGAAGAAGGTCGAGAGATCTCACGTTGGACAGATTACTGAGATCATTTATAAGG
GCGAGCATAACCATCCAAAGCCAAAGAGAGCTAGACGAGCTAAGTAA`
    );
    scrollToQuerySection();
  };

  const copySequence = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tfCount = results.filter((r) => r.is_tf).length;
  const nonTfCount = results.length - tfCount;
  const translatedCount = results.filter((r) => r.was_translated).length;

  const filteredResults = results.filter((r) => {
    if (filter === 'TF') return r.is_tf;
    if (filter === 'NONTF') return !r.is_tf;
    return true;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.9rem', color: '#0f4c81', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Sequence Analysis &amp; Family Query
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.5' }}>
          High-throughput Plant Transcription Factor Identification with automatic Genome DNA-to-Protein translation and interactive multi-family queries.
        </p>

        {/* Feature Highlights Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
            <Dna size={14} /> Genome FASTA Auto-Translation (6-Frame ORF)
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#dcfce7', color: '#166534', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
            <CheckCircle2 size={14} /> One Final Definitive Answer per Sequence
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#f3e8ff', color: '#7e22ce', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
            <Sparkles size={14} /> Multi-Family Presence Checker (0-100% Conf.)
          </div>
        </div>
      </div>

      {/* Main Analysis Input Card */}
      <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '28px', marginBottom: '30px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
        {/* Input Mode Tabs & Quick Loaders */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setInputMode('upload')}
              disabled={loading}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                backgroundColor: inputMode === 'upload' ? '#0f4c81' : '#f1f5f9',
                color: inputMode === 'upload' ? '#fff' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <UploadCloud size={16} /> Upload FASTA / Genome File
            </button>
            <button
              onClick={() => setInputMode('text')}
              disabled={loading}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                backgroundColor: inputMode === 'text' ? '#0f4c81' : '#f1f5f9',
                color: inputMode === 'text' ? '#fff' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <FileText size={16} /> Paste Sequence Text
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={loadSampleTF}
              disabled={loading}
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#0f4c81',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Load WRKY Example
            </button>
            <button
              type="button"
              onClick={loadSampleGenome}
              disabled={loading}
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#0369a1',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Load Genome DNA Example
            </button>
          </div>
        </div>

        {/* Upload Dropzone or Text Area */}
        {inputMode === 'upload' ? (
          <div>
            <div
              onClick={() => !loading && fileInputRef.current && fileInputRef.current.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!loading && e.dataTransfer.files && e.dataTransfer.files[0]) {
                  setFile(e.dataTransfer.files[0]);
                  scrollToQuerySection();
                }
              }}
              style={{
                border: '2px dashed #93c5fd',
                borderRadius: '12px',
                padding: '40px 20px',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'border 0.2s, background 0.2s'
              }}
            >
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#0284c7' }}>
                <UploadCloud size={28} />
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', color: '#0f172a', fontWeight: 600 }}>
                {file ? file.name : 'Select or Drop FASTA / Genome File'}
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#64748b' }}>
                Supports protein (.fasta, .faa) or genomic nucleotide (.fasta, .fa, .fna) with automatic ORF translation.
              </p>
              {file ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                  <FileText size={16} /> Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              ) : (
                <button
                  type="button"
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid #cbd5e1',
                    color: '#0f4c81',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Browse Computer
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                    scrollToQuerySection();
                  }
                }}
                disabled={loading}
              />
            </div>
          </div>
        ) : (
          <div>
            <textarea
              value={sequenceText}
              onChange={(e) => setSequenceText(e.target.value)}
              disabled={loading}
              placeholder=">Sequence_1&#10;ATGGCTTCGACGTCCGAAGTAGAGATTCTTAGCTTG...&#10;&#10;>Sequence_2&#10;MASTSEVEILSLKSSPSLSLLDDGLDLSLNNDQETISPQKPPPSISSSLLVDNDNDNDNKK..."
              style={{
                width: '100%',
                height: '160px',
                padding: '14px',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                outline: 'none',
                resize: 'vertical',
                backgroundColor: '#f8fafc',
                color: '#0f172a'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.78rem', color: '#64748b' }}>
              <span>Accepts raw sequences or FASTA blocks. Genome DNA is automatically detected &amp; translated.</span>
              <span>{sequenceText.length} characters</span>
            </div>
          </div>
        )}

        {/* Start Analysis Button */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              startAnalysis();
              scrollToQuerySection();
            }}
            disabled={loading || (inputMode === 'upload' && !file) || (inputMode === 'text' && !sequenceText.trim())}
            style={{
              backgroundColor: loading ? '#94a3b8' : '#0f4c81',
              color: '#fff',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(15,76,129,0.2)'
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Processing Model Inference...</span>
              </>
            ) : (
              <>
                <Play size={18} fill="currentColor" />
                <span>Start Sequence Analysis</span>
              </>
            )}
          </button>
        </div>

        {/* Real-Time Progress Tracker */}
        {loading && (
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                  {progress.status}
                </span>
                {progress.total > 0 && (
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    ({progress.current} of {progress.total} sequences)
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f4c81' }}>
                {progress.percent}% {eta && <span style={{ color: '#64748b', fontWeight: 500 }}>({eta})</span>}
              </div>
            </div>

            {/* Progress Bar Track */}
            <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progress.percent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #0f4c81 0%, #38bdf8 100%)',
                  borderRadius: '10px',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* FAMILY & SEQUENCE NAME QUERY SECTION */}
      <div
        ref={querySectionRef}
        style={{
          backgroundColor: '#fff',
          borderRadius: '14px',
          border: isSectionHighlighted ? '2px solid #0f4c81' : '1px solid #e2e8f0',
          boxShadow: isSectionHighlighted ? '0 0 0 4px rgba(15, 76, 129, 0.18)' : '0 2px 6px rgba(0,0,0,0.04)',
          transition: 'all 0.35s ease',
          padding: '24px',
          marginBottom: '30px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', color: '#0f4c81', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={20} color="#0f4c81" /> Transcription Factor Family &amp; Sequence Name Query
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Type the names of the TF families (e.g. WRKY, MYB, bHLH) or sequence IDs you want to find. Provides definitive YES/NO statements and confidence scores.
            </p>
          </div>
        </div>

        {/* Search Bar & Quick Add Chips */}
        <form onSubmit={handleAddCustomFamilyInput} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <input
            ref={queryInputRef}
            type="text"
            value={familyInput}
            onChange={(e) => setFamilyInput(e.target.value)}
            placeholder="Type TF family or sequence name to find (e.g. WRKY, MYB, Test_01, bHLH)..."
            style={{
              flex: 1,
              padding: '12px 18px',
              fontSize: '0.95rem',
              border: isSectionHighlighted ? '2px solid #0f4c81' : '1px solid #cbd5e1',
              borderRadius: '8px',
              outline: 'none',
              backgroundColor: '#f8fafc',
              transition: 'border 0.2s'
            }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: '#0f4c81',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Search size={16} /> Add Query
          </button>
        </form>

        {/* Quick Popular Family Chips */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Quick Add:</span>
          {POPULAR_FAMILIES.map((fam) => {
            const isAdded = queriedFamilies.some((q) => q.toUpperCase() === fam.toUpperCase());
            return (
              <button
                key={fam}
                type="button"
                onClick={() => (isAdded ? handleRemoveFamilyQuery(fam) : handleAddFamilyQuery(fam))}
                style={{
                  fontSize: '0.78rem',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  border: isAdded ? '1px solid #0f4c81' : '1px solid #e2e8f0',
                  backgroundColor: isAdded ? '#0f4c81' : '#f8fafc',
                  color: isAdded ? '#fff' : '#475569',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.15s'
                }}
              >
                {isAdded ? `✓ ${fam}` : `+ ${fam}`}
              </button>
            );
          })}
        </div>

        {/* Queried Families Active Badges */}
        {queriedFamilies.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Active Queries ({queriedFamilies.length}):</span>
            {queriedFamilies.map((fam) => (
              <span
                key={fam}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#fff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '14px',
                  padding: '3px 10px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#0f172a'
                }}
              >
                {fam}
                <X
                  size={12}
                  style={{ cursor: 'pointer', color: '#94a3b8' }}
                  onClick={() => handleRemoveFamilyQuery(fam)}
                />
              </span>
            ))}
          </div>
        )}

        {/* Query Results Display Cards */}
        {queryResults.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Family Presence Results
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {queryResults.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: item.present ? '#f0fdf4' : '#f8fafc',
                    border: item.present ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{item.family}</span>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {item.present ? `Identified in ${item.count} sequence(s)` : 'Not detected in sequence(s)'}
                      </div>
                    </div>

                    {/* YES / NO STATEMENT BADGE */}
                    <div
                      style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: item.present ? '#166534' : '#64748b',
                        color: '#fff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      {item.present ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {item.verdictText}
                    </div>
                  </div>

                  {/* Confidence Bar & Percentage */}
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, color: item.present ? '#15803d' : '#64748b', marginBottom: '4px' }}>
                      <span>Confidence Level:</span>
                      <span>{item.confidence}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${item.confidence}%`,
                          height: '100%',
                          backgroundColor: item.present ? '#22c55e' : '#cbd5e1',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </div>

                  {/* Direct Database Links for Queried Family */}
                  {item.present && (() => {
                    const db = getDbLinks(item.family);
                    if (!db) return null;
                    return (
                      <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {db.pfam_id && db.pfam_id !== 'Available in InterPro' && (
                          <a
                            href={db.pfam_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: '#ecfdf5',
                              color: '#047857',
                              border: '1px solid #a7f3d0',
                              textDecoration: 'none'
                            }}
                          >
                            Pfam: {db.pfam_id} <ExternalLink size={10} />
                          </a>
                        )}
                        <a
                          href={db.planttfdb_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            textDecoration: 'none'
                          }}
                        >
                          PlantTFDB ↗
                        </a>
                      </div>
                    );
                  })()}

                  {/* Matching Sequences List Preview */}
                  {item.present && item.matchingSequences.length > 0 && (
                    <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #dcfce7' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                        Matching Sequences:
                      </span>
                      <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                        {item.matchingSequences.map((seq, sIdx) => (
                          <div
                            key={sIdx}
                            onClick={() => setSelectedResult(seq)}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.78rem',
                              padding: '4px 8px',
                              backgroundColor: '#fff',
                              borderRadius: '6px',
                              border: '1px solid #bbf7d0',
                              cursor: 'pointer'
                            }}
                          >
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{seq.sequence_id}</span>
                            <span style={{ fontWeight: 600, color: '#16a34a' }}>{seq.detected_family_confidence || seq.family_confidence}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DEFINITIVE "ONE FINAL ANSWER" RESULTS SECTION */}
      {results.length > 0 && (
        <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
          {/* Results Summary Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', color: '#0f172a', fontWeight: 800 }}>
                Prediction Results ({results.length} Sequences)
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '0.88rem' }}>
                <span style={{ color: '#166534', fontWeight: 700 }}>
                  ✓ {tfCount} Transcription Factors Found
                </span>
                <span style={{ color: '#64748b' }}>
                  • {nonTfCount} Non-TFs
                </span>
                {translatedCount > 0 && (
                  <span style={{ color: '#0369a1', fontWeight: 600 }}>
                    🧬 {translatedCount} Genome DNA sequences auto-translated
                  </span>
                )}
              </div>
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setFilter('ALL')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: filter === 'ALL' ? '#0f4c81' : '#f1f5f9',
                  color: filter === 'ALL' ? '#fff' : '#475569'
                }}
              >
                All ({results.length})
              </button>
              <button
                onClick={() => setFilter('TF')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: filter === 'TF' ? '#166534' : '#dcfce7',
                  color: filter === 'TF' ? '#fff' : '#166534'
                }}
              >
                TFs Only ({tfCount})
              </button>
              <button
                onClick={() => setFilter('NONTF')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: filter === 'NONTF' ? '#475569' : '#f1f5f9',
                  color: filter === 'NONTF' ? '#fff' : '#475569'
                }}
              >
                Non-TFs ({nonTfCount})
              </button>
            </div>
          </div>

          {/* Sequence Result Cards with ONE CLEAR FINAL VERDICT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredResults.map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: item.is_tf ? '#f0fdf4' : '#f8fafc',
                  border: item.is_tf ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                      {item.sequence_id}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      ({item.sequence?.length || 0} aa)
                    </span>
                    {item.was_translated && (
                      <span style={{ fontSize: '0.72rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                        🧬 Translated from Genome DNA
                      </span>
                    )}
                  </div>

                  {/* ONE FINAL DEFINITIVE ANSWER BADGE */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        backgroundColor: item.is_tf ? '#166534' : '#e2e8f0',
                        color: item.is_tf ? '#fff' : '#334155',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        letterSpacing: '0.02em'
                      }}
                    >
                      {item.is_tf ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      {item.is_tf ? 'FINAL VERDICT: YES — TRANSCRIPTION FACTOR' : 'FINAL VERDICT: NO — NON-TF'}
                    </span>

                    {item.is_tf && (
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          backgroundColor: '#e0e7ff',
                          color: '#3730a3',
                          border: '1px solid #c7d2fe'
                        }}
                      >
                        🏷️ Family: {item.family} ({item.family_confidence}%)
                      </span>
                    )}

                    {/* DIRECT DATABASE PILLS */}
                    {item.is_tf && (() => {
                      const db = item.db_references || getDbLinks(item.family);
                      if (!db) return null;
                      return (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {db.pfam_id && db.pfam_id !== 'Available in InterPro' && (
                            <a
                              href={db.pfam_url}
                              target="_blank"
                              rel="noreferrer"
                              title="Pfam Domain HMM Profile & Alignments (EMBL-EBI)"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                backgroundColor: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                textDecoration: 'none'
                              }}
                            >
                              Pfam: {db.pfam_id} <ExternalLink size={10} />
                            </a>
                          )}
                          <a
                            href={db.planttfdb_url}
                            target="_blank"
                            rel="noreferrer"
                            title="Plant Transcription Factor Database (Peking Univ.)"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              backgroundColor: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              textDecoration: 'none'
                            }}
                          >
                            PlantTFDB ↗
                          </a>
                        </div>
                      );
                    })()}

                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                      TF Confidence: {item.tf_confidence}%
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedResult(item)}
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid #cbd5e1',
                    color: '#0f4c81',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Inspect Sequence &amp; Details <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEQUENCE DETAIL MODAL */}
      {selectedResult && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', color: '#0f172a', fontWeight: 800, fontFamily: 'monospace' }}>
                  {selectedResult.sequence_id}
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  Length: {selectedResult.sequence?.length || 0} amino acids{' '}
                  {selectedResult.was_translated && '• Converted from genome nucleotide reading frame'}
                </p>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Definitive Answer Card in Modal */}
            <div
              style={{
                backgroundColor: selectedResult.is_tf ? '#f0fdf4' : '#f8fafc',
                border: selectedResult.is_tf ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                Definitive Classification
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: selectedResult.is_tf ? '#166534' : '#334155', marginBottom: '4px' }}>
                {selectedResult.is_tf ? `YES — ${selectedResult.family} Transcription Factor` : 'NO — Non-Transcription Factor'}
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>
                {selectedResult.summary || (selectedResult.is_tf ? `Confirmed ${selectedResult.family} transcription factor with ${selectedResult.family_confidence}% family confidence.` : 'No transcription factor DNA-binding domains detected.')}
              </p>
            </div>

            {/* Biological Database Cross-References Section */}
            {selectedResult.is_tf && (() => {
              const db = selectedResult.db_references || getDbLinks(selectedResult.family);
              if (!db) return null;
              return (
                <div style={{ marginBottom: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 800, color: '#0f4c81', textTransform: 'uppercase', marginBottom: '8px' }}>
                    <Database size={16} /> Official Database Cross-References
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#64748b' }}>
                    Direct links to international curated repositories for structural domains, sequence alignments, and plant gene regulatory models:
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {/* Pfam Database */}
                    <a
                      href={db.pfam_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        backgroundColor: '#fff',
                        border: '1.5px solid #a7f3d0',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#047857' }}>Pfam Database (EBI)</span>
                        <ExternalLink size={13} color="#047857" />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 800, color: '#0f172a' }}>
                        Pfam ID: {db.pfam_id}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>HMM Domain Profile &amp; Seed Alignments ↗</span>
                    </a>

                    {/* PlantTFDB */}
                    <a
                      href={db.planttfdb_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        backgroundColor: '#fff',
                        border: '1.5px solid #bfdbfe',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1d4ed8' }}>PlantTFDB 5.0</span>
                        <ExternalLink size={13} color="#1d4ed8" />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                        Family: {selectedResult.family}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Curated Plant TFDB Catalog ↗</span>
                    </a>

                    {/* InterPro */}
                    <a
                      href={db.interpro_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        backgroundColor: '#fff',
                        border: '1.5px solid #ddd6fe',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#6d28d9' }}>InterPro (EMBL-EBI)</span>
                        <ExternalLink size={13} color="#6d28d9" />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 800, color: '#0f172a' }}>
                        ID: {db.interpro_id}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Functional Domain Architecture ↗</span>
                    </a>

                    {/* NCBI CDD */}
                    <a
                      href={db.cdd_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        backgroundColor: '#fff',
                        border: '1.5px solid #fed7aa',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#c2410c' }}>NCBI CDD</span>
                        <ExternalLink size={13} color="#c2410c" />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                        Conserved Domains
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>NIH/NCBI Domain Architecture ↗</span>
                    </a>
                  </div>
                </div>
              );
            })()}

            {/* Sequence Viewer with Copy */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                  Protein Sequence (FASTA)
                </span>
                <button
                  onClick={() => copySequence(selectedResult.sequence)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    color: '#0f4c81',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    cursor: 'pointer'
                  }}
                >
                  {copied ? <Check size={13} color="#166534" /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div
                style={{
                  backgroundColor: '#0f172a',
                  color: selectedResult.is_tf ? '#4ade80' : '#e2e8f0',
                  padding: '14px',
                  borderRadius: '10px',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  lineHeight: '1.6',
                  wordBreak: 'break-all',
                  maxHeight: '180px',
                  overflowY: 'auto'
                }}
              >
                {selectedResult.sequence || 'Sequence data not available.'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setSelectedResult(null)}
                style={{
                  backgroundColor: '#0f4c81',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
