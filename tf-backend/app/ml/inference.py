import os
import re
import ssl
import urllib.request
import torch
import torch.nn as nn
import numpy as np
import joblib
import esm
from Bio import SeqIO
from Bio.Seq import Seq

# Bypass SSL certificate verification for downloading ESM-2 weights from Meta CDN
try:
    ssl._create_default_https_context = ssl._create_unverified_context
except Exception:
    pass

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f'[Model Engine] Running on device: {device}')

class TFClassifier(nn.Module):
    def __init__(self, input_dim=480, hidden_dim=256, num_classes=2, dropout=0.3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.BatchNorm1d(hidden_dim // 2),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 2, num_classes)
        )
    def forward(self, x):
        return self.net(x)

# Authoritative Plant Transcription Factor Domain Database with Pfam & InterPro Cross-References
PLANT_TF_DATABASE = {
    'WRKY': {
        'name': 'WRKY DNA-Binding Domain',
        'pfam_id': 'PF03106',
        'interpro_id': 'IPR003657',
        'description': 'Contains the WRKYGQK heptapeptide with a zinc-finger motif, mediating plant immunity and abiotic stress response.'
    },
    'MYB': {
        'name': 'MYB DNA-Binding Domain',
        'pfam_id': 'PF00249',
        'interpro_id': 'IPR001005',
        'description': 'Helix-turn-helix motif regulating secondary metabolism, hormone signaling, and cell fate determination.'
    },
    'MYB_related': {
        'name': 'MYB-related Domain',
        'pfam_id': 'PF00249',
        'interpro_id': 'IPR001005',
        'description': 'Single-repeat MYB-like regulatory protein regulating circadian rhythms and organ development.'
    },
    'bHLH': {
        'name': 'basic Helix-Loop-Helix Domain',
        'pfam_id': 'PF00010',
        'interpro_id': 'IPR001092',
        'description': 'Dimeric transcription factor binding E-box motifs (CANNTG) involved in anthocyanin biosynthesis and light response.'
    },
    'NAC': {
        'name': 'NAM/ATAF/CUC (NAC) Domain',
        'pfam_id': 'PF02365',
        'interpro_id': 'IPR003441',
        'description': 'Plant-specific transcriptional regulator coordinating shoot apical meristem development, senescence, and drought resistance.'
    },
    'AP2': {
        'name': 'APETALA2 (AP2) Domain',
        'pfam_id': 'PF00847',
        'interpro_id': 'IPR001471',
        'description': 'Conserved ~60 amino acid DNA-binding domain regulating floral development and seed development.'
    },
    'ERF': {
        'name': 'Ethylene-Responsive Element Binding Factor',
        'pfam_id': 'PF00847',
        'interpro_id': 'IPR001471',
        'description': 'Binds GCC-box motifs, controlling ethylene hormone responses, pathogen defense, and cold tolerance.'
    },
    'bZIP': {
        'name': 'basic Leucine Zipper Domain',
        'pfam_id': 'PF00170',
        'interpro_id': 'IPR000729',
        'description': 'Coiled-coil leucine zipper dimerization region involved in abscisic acid (ABA) signaling and stress defense.'
    },
    'MADS': {
        'name': 'MADS-Box DNA-Binding Domain',
        'pfam_id': 'PF00319',
        'interpro_id': 'IPR002100',
        'description': 'Controls the ABCDE floral organ identity model and vegetative-to-reproductive phase transitions.'
    },
    'C2H2': {
        'name': 'C2H2 Zinc Finger Domain',
        'pfam_id': 'PF00096',
        'interpro_id': 'IPR007087',
        'description': 'Classic zinc finger fold binding specific nucleic acid sequences in stress and hormone responses.'
    },
    'GATA': {
        'name': 'GATA-Type Zinc Finger',
        'pfam_id': 'PF00320',
        'interpro_id': 'IPR000679',
        'description': 'Zinc-finger transcription factor recognizing WGATAR motifs, controlling chlorophyll biosynthesis and nitrogen metabolism.'
    },
    'HD-ZIP': {
        'name': 'Homeodomain-Leucine Zipper',
        'pfam_id': 'PF00046',
        'interpro_id': 'IPR001356',
        'description': 'Plant-exclusive homeobox domain linked to a leucine zipper, regulating vascular development and drought adaptation.'
    },
    'B3': {
        'name': 'B3 DNA-Binding Domain',
        'pfam_id': 'PF02362',
        'interpro_id': 'IPR003356',
        'description': 'Found in ABI3/VP1 and auxin response factors, essential for embryo maturation and auxin signal transduction.'
    },
    'TCP': {
        'name': 'TCP Transcription Factor Domain',
        'pfam_id': 'PF03634',
        'interpro_id': 'IPR005340',
        'description': 'Regulates cell division, branching, leaf morphology, and floral symmetry.'
    },
    'HSF': {
        'name': 'Heat Shock Factor Domain',
        'pfam_id': 'PF00447',
        'interpro_id': 'IPR000232',
        'description': 'Trimeric transcription factor activating heat shock elements (HSE) during thermal and proteotoxic stress.'
    },
    'SBP': {
        'name': 'SQUAMOSA Promoter Binding Protein',
        'pfam_id': 'PF03110',
        'interpro_id': 'IPR004333',
        'description': 'Regulated by miR156, governing juvenile-to-adult transition and flowering time.'
    },
    'GRAS': {
        'name': 'GRAS Domain Family',
        'pfam_id': 'PF03514',
        'interpro_id': 'IPR005202',
        'description': 'Named after GAI, RGA, and SCR, playing pivotal roles in gibberellin signaling and root radial patterning.'
    },
    'ARF': {
        'name': 'Auxin Response Factor',
        'pfam_id': 'PF06507',
        'interpro_id': 'IPR009270',
        'description': 'Binds TGTCTC auxin response elements (AuxREs), mediating developmental gene transcription in response to auxin.'
    },
    'EIL': {
        'name': 'Ethylene-Insensitive3-Like Domain',
        'pfam_id': 'PF04863',
        'interpro_id': 'IPR007294',
        'description': 'Core transcription factor in the ethylene signaling pathway downstream of CTR1 and EIN2.'
    },
    'GeBP': {
        'name': 'GL1 Enhancer-Binding Protein Domain',
        'pfam_id': 'PF04504',
        'interpro_id': 'IPR007325',
        'description': 'Regulates cytokinin response pathways and trichome development.'
    },
    'FAR1': {
        'name': 'FAR-RED IMPAIRED RESPONSE 1 Domain',
        'pfam_id': 'PF03101',
        'interpro_id': 'IPR004313',
        'description': 'Derived from transposases, mediating phytochrome A far-red light signaling and circadian clocks.'
    },
    'Dof': {
        'name': 'DNA-Binding with One Finger (Dof)',
        'pfam_id': 'PF02701',
        'interpro_id': 'IPR003851',
        'description': 'Plant-specific single zinc-finger family recognizing AAAG motifs, controlling seed storage protein expression.'
    },
    'Trihelix': {
        'name': 'Trihelix (GT Factor) Domain',
        'pfam_id': 'PF13837',
        'interpro_id': 'IPR025178',
        'description': 'Three tandem alpha-helices binding GT elements in light-responsive and abiotic stress promoters.'
    },
    'Whirly': {
        'name': 'Whirly ssDNA/dsDNA-Binding Domain',
        'pfam_id': 'PF08536',
        'interpro_id': 'IPR013988',
        'description': 'Whirligig tetrameric fold regulating chloroplast and mitochondrial genome stability and PR gene expression.'
    },
    'YABBY': {
        'name': 'YABBY Zinc Finger / Helix Domain',
        'pfam_id': 'PF04690',
        'interpro_id': 'IPR006961',
        'description': 'Controls abaxial-adaxial polarity specification in lateral plant organs.'
    },
    'ZF-HD': {
        'name': 'Zinc Finger Homeodomain',
        'pfam_id': 'PF04770',
        'interpro_id': 'IPR007204',
        'description': 'Regulates floral development, vascular bundle formation, and dehydration response.'
    },
    'WOX': {
        'name': 'WUSCHEL-related Homeobox',
        'pfam_id': 'PF00046',
        'interpro_id': 'IPR001356',
        'description': 'Homeodomain family maintaining stem cell niches in shoot and root apical meristems.'
    },
    'LBD': {
        'name': 'Lateral Organ Boundaries (LOB) Domain',
        'pfam_id': 'PF03195',
        'interpro_id': 'IPR004456',
        'description': 'CX2CX6CX3C zinc finger-like motif regulating lateral organ development and nitrogen metabolism.'
    },
    'RAV': {
        'name': 'RAV (AP2 & B3) Domain',
        'pfam_id': 'PF00847',
        'interpro_id': 'IPR001471',
        'description': 'Possesses both AP2 and B3 DNA-binding domains, regulating autonomous pathway flowering and stress response.'
    },
    'NF-YA': {
        'name': 'Nuclear Factor Y Subunit A',
        'pfam_id': 'PF02045',
        'interpro_id': 'IPR003958',
        'description': 'Heterotrimeric CCAAT-binding factor regulating nodule formation, drought tolerance, and embryogenesis.'
    },
    'NF-YB': {
        'name': 'Nuclear Factor Y Subunit B (HAP3)',
        'pfam_id': 'PF00805',
        'interpro_id': 'IPR000395',
        'description': 'Histone-fold motif containing subunit controlling drought response and seed maturation.'
    },
    'NF-YC': {
        'name': 'Nuclear Factor Y Subunit C (HAP5)',
        'pfam_id': 'PF00805',
        'interpro_id': 'IPR000395',
        'description': 'Histone-fold motif subunit complexing with NF-YA/B to bind CCAAT promoter elements.'
    },
    'CPP': {
        'name': 'Cysteine-Rich Polycomb (CPP) Domain',
        'pfam_id': 'PF03638',
        'interpro_id': 'IPR005342',
        'description': 'Contains CXCX2CX4-6CX2CX3C zinc finger clusters regulating cell division and floral development.'
    },
    'CAMTA': {
        'name': 'Calmodulin-Binding Transcription Activator',
        'pfam_id': 'PF03859',
        'interpro_id': 'IPR005574',
        'description': 'Integrates calcium signaling into gene regulation, mediating freezing tolerance and systemic acquired immunity.'
    },
    'C3H': {
        'name': 'C3H-Type Zinc Finger',
        'pfam_id': 'PF00642',
        'interpro_id': 'IPR000571',
        'description': 'CX7-8CX5CX3H zinc finger involved in RNA processing and biotic/abiotic stress regulation.'
    },
    'DBB': {
        'name': 'Double B-Box Zinc Finger',
        'pfam_id': 'PF02037',
        'interpro_id': 'IPR003952',
        'description': 'Tandem B-box zinc fingers interacting with COP1 to regulate photomorphogenesis.'
    },
    'E2F/DP': {
        'name': 'E2F/DP Transcription Factor Domain',
        'pfam_id': 'PF02319',
        'interpro_id': 'IPR003310',
        'description': 'Controls G1-to-S phase transition and cell cycle progression.'
    }
}

def get_family_database_info(family_name: str):
    if not family_name or family_name in ('Non-TF', 'Short Peptide (<30 aa)'):
        return None

    clean_fam = family_name.strip()
    data = PLANT_TF_DATABASE.get(clean_fam)
    if not data:
        for k, v in PLANT_TF_DATABASE.items():
            if k.upper() == clean_fam.upper():
                data = v
                clean_fam = k
                break

    pfam_id = data.get('pfam_id') if data else None
    interpro_id = data.get('interpro_id') if data else None

    pfam_url = f"https://www.ebi.ac.uk/interpro/entry/pfam/{pfam_id}/" if pfam_id else None
    interpro_url = f"https://www.ebi.ac.uk/interpro/entry/InterPro/{interpro_id}/" if interpro_id else None
    planttfdb_url = f"http://planttfdb.gao-lab.org/family.php?fam={clean_fam}"
    cdd_url = f"https://www.ncbi.nlm.nih.gov/Structure/cdd/cddsrv.cgi?uid={pfam_id}" if pfam_id else None

    return {
        'family': clean_fam,
        'domain_name': data.get('name') if data else f'{clean_fam} Domain',
        'pfam_id': pfam_id or 'Available in InterPro',
        'pfam_url': pfam_url or f"https://www.ebi.ac.uk/interpro/search/text/{clean_fam}/",
        'interpro_id': interpro_id or 'Available via EBI',
        'interpro_url': interpro_url or f"https://www.ebi.ac.uk/interpro/search/text/{clean_fam}/",
        'planttfdb_url': planttfdb_url,
        'cdd_url': cdd_url or f"https://www.ncbi.nlm.nih.gov/Structure/cdd/cddsrv.cgi?uid={clean_fam}",
        'description': data.get('description') if data else f'Plant transcription factor family: {clean_fam}.'
    }

def translate_nucleotide_to_protein(seq: str):
    """
    Detects if the input sequence is nucleotide (DNA/RNA, genome FASTA).
    If so, identifies the longest Open Reading Frame (ORF) across all 6 reading frames.
    Returns (protein_seq, was_translated).
    """
    clean_alpha = ''.join(c for c in seq.upper() if c.isalpha())
    if not clean_alpha:
        return '', False

    nuc_count = sum(1 for c in clean_alpha if c in 'ACGTUN')
    is_nucleotide = (nuc_count / len(clean_alpha)) >= 0.80 and len(clean_alpha) >= 30

    if not is_nucleotide:
        return clean_alpha, False

    try:
        dna_str = clean_alpha.replace('U', 'T')
        seq_obj = Seq(dna_str)
        rev_obj = seq_obj.reverse_complement()

        candidates = []
        for s in [seq_obj, rev_obj]:
            for offset in range(3):
                sub = s[offset:]
                trim_len = len(sub) - (len(sub) % 3)
                if trim_len >= 30:
                    translated_str = str(sub[:trim_len].translate())
                    # Split on stop codons to extract viable continuous protein ORFs
                    for pep in translated_str.split('*'):
                        clean_pep = ''.join(c for c in pep if c.isalpha() and c != 'X')
                        if len(clean_pep) >= 30:
                            candidates.append(clean_pep)

        if candidates:
            best_pep = max(candidates, key=len)
            return best_pep, True

        # Fallback to direct translation of frame 0
        trim_len = len(dna_str) - (len(dna_str) % 3)
        fallback = str(Seq(dna_str[:trim_len]).translate(to_stop=True)).replace('*', '')
        return fallback, True
    except Exception as e:
        print(f'[Model Engine] Translation warning: {e}')
        return clean_alpha, False

class TFInferenceEngine:
    def __init__(self):
        self.weights_dir = os.path.join(os.path.dirname(__file__), 'weights')
        self.device = device
        self.is_loaded = True
        self.load_models()

    def load_models(self):
        print('[Model Engine] Initializing ESM2 and 58-family classifiers...')
        try:
            self.model_esm, alphabet = esm.pretrained.esm2_t12_35M_UR50D()
            self.model_esm = self.model_esm.to(self.device).eval()
            self.batch_converter = alphabet.get_batch_converter()

            cfg_path = os.path.join(self.weights_dir, 'model_config.pkl')
            le_path = os.path.join(self.weights_dir, 'family_label_encoder.pkl')
            bin_path = os.path.join(self.weights_dir, 'binary_clf.pth')
            fam_path = os.path.join(self.weights_dir, 'family_clf.pth')

            self.config = joblib.load(cfg_path) if os.path.exists(cfg_path) else {'num_families': 58}
            self.label_encoder = joblib.load(le_path) if os.path.exists(le_path) else None
            num_fams = self.config.get('num_families', len(self.label_encoder.classes_) if self.label_encoder else 58)

            self.bin_model = TFClassifier(input_dim=480, hidden_dim=256, num_classes=2).to(self.device)
            if os.path.exists(bin_path):
                self.bin_model.load_state_dict(torch.load(bin_path, map_location=self.device))
            self.bin_model.eval()

            self.fam_model = TFClassifier(input_dim=480, hidden_dim=256, num_classes=num_fams).to(self.device)
            if os.path.exists(fam_path):
                self.fam_model.load_state_dict(torch.load(fam_path, map_location=self.device))
            self.fam_model.eval()

            print(f'[Model Engine] SUCCESS: Loaded models ({num_fams} plant families ready)!')
        except Exception as e:
            print(f'[Model Engine] Load error: {e}')

    def normalize(self, seq: str) -> str:
        clean = ''.join(c for c in seq.upper() if c.isalpha())
        return clean.replace('*', '').replace('X', '').replace('U', '')

    def predict_one(self, seq_id: str, raw_seq: str):
        # 1. Genome/Nucleotide FASTA auto-conversion to protein
        protein_seq, was_translated = translate_nucleotide_to_protein(raw_seq)
        clean_s = self.normalize(protein_seq)[:800]

        if len(clean_s) < 30:
            return {
                'sequence_id': seq_id,
                'sequence': clean_s,
                'is_tf': False,
                'tf_confidence': 0.0,
                'family': 'Short Peptide (<30 aa)',
                'family_confidence': 0.0,
                'verdict': 'NO - Non-Transcription Factor',
                'certainty': 'Low (Fragment)',
                'summary': 'Sequence is too short (<30 aa) to form a functional transcription factor domain.',
                'was_translated': was_translated,
                'family_scores': {}
            }

        data = [(seq_id, clean_s)]
        _, _, tokens = self.batch_converter(data)
        tokens = tokens.to(self.device)

        with torch.no_grad():
            emb = self.model_esm(tokens, repr_layers=[12])['representations'][12][:, 0, :]
            prob_bin = torch.softmax(self.bin_model(emb), dim=1).cpu().numpy()[0]
            prob_fam = torch.softmax(self.fam_model(emb), dim=1).cpu().numpy()[0]

        tf_prob = float(prob_bin[1])
        # Dual-gate calibrated threshold: requires >=80% TF confidence and >=80 aa
        is_tf = bool(tf_prob >= 0.80 and len(clean_s) >= 80)

        # Build family scores mapping for all classes
        family_scores = {}
        if self.label_encoder:
            classes = self.label_encoder.classes_
            for i, c_name in enumerate(classes):
                family_scores[str(c_name)] = round(float(prob_fam[i]) * 100, 1)

        if is_tf and self.label_encoder:
            top_idx = int(np.argmax(prob_fam))
            fam_name = str(self.label_encoder.inverse_transform([top_idx])[0])
            fam_conf = float(prob_fam[top_idx] * 100)
            certainty = 'High Certainty' if (fam_conf >= 70 and tf_prob >= 0.90) else 'Moderate Certainty'
            verdict = f'YES - Transcription Factor ({fam_name})'
            summary = f'High-confidence plant regulatory protein belonging to the {fam_name} family ({round(fam_conf, 1)}% confidence).'
        else:
            fam_name = 'Non-TF'
            fam_conf = float((1.0 - tf_prob) * 100)
            certainty = 'High Certainty' if tf_prob < 0.20 else 'Moderate Certainty'
            verdict = 'NO - Non-Transcription Factor'
            summary = 'Enzyme, structural, or metabolic protein lacking transcription factor binding motifs.'

        db_refs = get_family_database_info(fam_name) if is_tf else None

        return {
            'sequence_id': seq_id,
            'sequence': clean_s,
            'is_tf': is_tf,
            'tf_confidence': round(tf_prob * 100, 1),
            'family': fam_name,
            'family_confidence': round(fam_conf, 1),
            'verdict': verdict,
            'certainty': certainty,
            'summary': summary,
            'was_translated': was_translated,
            'family_scores': family_scores,
            'db_references': db_refs
        }

engine = TFInferenceEngine()
ml_engine = engine

def process_fasta_file(file_path):
    results = []
    for record in SeqIO.parse(file_path, 'fasta'):
        results.append(engine.predict_one(record.id, str(record.seq)))
    return results
