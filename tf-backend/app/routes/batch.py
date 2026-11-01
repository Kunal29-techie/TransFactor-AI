import os, shutil, uuid, io
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from Bio import SeqIO

from ..database import get_db, SessionLocal
from ..models import BatchJob, SequenceResult
from ..schemas import (
    BatchJobOut, SequenceResultOut,
    FamilyQueryRequest, FamilyQueryResponse, FamilyQueryResultItem,
    DirectPredictRequest
)
from ..ml.inference import engine, get_family_database_info

router = APIRouter()

def process_batch_background(job_id: str, file_path: str):
    db: Session = SessionLocal()
    job = None
    try:
        job = db.query(BatchJob).filter(BatchJob.id == job_id).first()
        if not job:
            return

        records = list(SeqIO.parse(file_path, 'fasta'))
        job.total_sequences = len(records)
        job.status = 'processing'
        db.commit()

        for idx, rec in enumerate(records, 1):
            pred = engine.predict_one(rec.id, str(rec.seq))
            result = SequenceResult(
                job_id=job_id,
                sequence_id=pred['sequence_id'],
                sequence=pred['sequence'],
                is_tf=pred['is_tf'],
                tf_confidence=pred['tf_confidence'],
                family=pred['family'],
                family_confidence=pred['family_confidence'],
                verdict=pred.get('verdict'),
                was_translated=pred.get('was_translated', False)
            )
            db.add(result)
            job.processed_sequences = idx
            if idx % 5 == 0 or idx == len(records):
                db.commit()

        job.status = 'completed'
        db.commit()
    except Exception as e:
        print(f'[Worker Error] {e}')
        if job:
            job.status = 'failed'
            db.commit()
    finally:
        db.close()
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass

@router.post('/upload', response_model=BatchJobOut)
async def upload_fasta(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    upload_dir = 'uploads'
    os.makedirs(upload_dir, exist_ok=True)
    temp_path = os.path.join(upload_dir, f'{uuid.uuid4()}_{file.filename}')

    with open(temp_path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        records_count = sum(1 for _ in SeqIO.parse(temp_path, 'fasta'))
    except:
        records_count = 0

    job = BatchJob(
        id=str(uuid.uuid4()),
        filename=file.filename,
        total_sequences=records_count,
        processed_sequences=0,
        status='queued'
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    background_tasks.add_task(process_batch_background, job.id, temp_path)
    return job

@router.post('/predict-text')
def predict_text(req: DirectPredictRequest):
    """
    Direct synchronous prediction for pasted FASTA or raw sequence text.
    Automatically handles genome/DNA sequences by converting to protein.
    """
    raw_text = req.fasta_text.strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="Empty sequence text provided.")

    records = []
    if raw_text.startswith('>'):
        string_io = io.StringIO(raw_text)
        records = list(SeqIO.parse(string_io, 'fasta'))
    else:
        # Single raw sequence without FASTA header
        records = [type('Record', (), {'id': 'User_Sequence_1', 'seq': raw_text})]

    results = []
    for r in records:
        pred = engine.predict_one(r.id, str(r.seq))
        results.append(pred)

    return results

@router.get('/status/{job_id}', response_model=BatchJobOut)
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(BatchJob).filter(BatchJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail='Batch job not found.')
    return job

@router.get('/results/{job_id}', response_model=List[SequenceResultOut])
def get_job_results(job_id: str, db: Session = Depends(get_db)):
    job = db.query(BatchJob).filter(BatchJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail='Batch job not found.')
    out = []
    for r in job.sequence_results:
        db_refs = get_family_database_info(r.family) if r.is_tf else None
        out.append({
            'id': r.id,
            'sequence_id': r.sequence_id,
            'sequence': r.sequence,
            'is_tf': r.is_tf,
            'tf_confidence': r.tf_confidence,
            'family': r.family,
            'family_confidence': r.family_confidence,
            'verdict': r.verdict,
            'was_translated': r.was_translated,
            'db_references': db_refs
        })
    return out

@router.post('/query-families', response_model=FamilyQueryResponse)
def query_families(req: FamilyQueryRequest, db: Session = Depends(get_db)):
    """
    Answers whether one or more TF families are present in a batch or given sequences.
    Returns:
    - Yes/No statement
    - Confidence percentage (0-100%)
    - List of sequences where the family is present
    """
    sequences = []
    if req.sequences:
        sequences = req.sequences
    elif req.job_id:
        job = db.query(BatchJob).filter(BatchJob.id == req.job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail='Batch job not found.')
        sequences = [
            {
                'sequence_id': r.sequence_id,
                'is_tf': r.is_tf,
                'tf_confidence': r.tf_confidence,
                'family': r.family,
                'family_confidence': r.family_confidence,
                'verdict': r.verdict,
                'length': len(r.sequence) if r.sequence else 0
            }
            for r in job.sequence_results
        ]
    else:
        # Fallback to the latest job
        latest_job = db.query(BatchJob).order_by(BatchJob.created_at.desc()).first()
        if latest_job:
            sequences = [
                {
                    'sequence_id': r.sequence_id,
                    'is_tf': r.is_tf,
                    'tf_confidence': r.tf_confidence,
                    'family': r.family,
                    'family_confidence': r.family_confidence,
                    'verdict': r.verdict,
                    'length': len(r.sequence) if r.sequence else 0
                }
                for r in latest_job.sequence_results
            ]

    results = []
    for raw_q in req.families:
        query_clean = raw_q.strip()
        if not query_clean:
            continue
        
        q_norm = query_clean.upper()
        matching = []

        for s in sequences:
            s_family = str(s.get('family', '')).upper()
            is_tf = s.get('is_tf', False)
            if is_tf and (q_norm == s_family or q_norm in s_family or s_family in q_norm):
                matching.append({
                    'sequence_id': s.get('sequence_id'),
                    'family': s.get('family'),
                    'family_confidence': round(float(s.get('family_confidence', 0.0)), 1),
                    'tf_confidence': round(float(s.get('tf_confidence', 0.0)), 1),
                    'length': s.get('length', len(s.get('sequence', '')) if s.get('sequence') else 0)
                })

        if matching:
            # Sort matching sequences by family confidence descending
            matching.sort(key=lambda x: x['family_confidence'], reverse=True)
            max_conf = matching[0]['family_confidence']
            results.append(FamilyQueryResultItem(
                family=query_clean,
                present=True,
                yes_or_no="YES",
                confidence=max_conf,
                matched_sequences_count=len(matching),
                matching_sequences=matching
            ))
        else:
            results.append(FamilyQueryResultItem(
                family=query_clean,
                present=False,
                yes_or_no="NO",
                confidence=0.0,
                matched_sequences_count=0,
                matching_sequences=[]
            ))

    return FamilyQueryResponse(
        total_sequences=len(sequences),
        results=results
    )

@router.get('/history')
def get_batch_history(db: Session = Depends(get_db)):
    jobs = db.query(BatchJob).order_by(BatchJob.created_at.desc()).all()
    out = []
    for j in jobs:
        out.append({
            'id': j.id,
            'filename': j.filename,
            'total_sequences': j.total_sequences,
            'processed_sequences': j.processed_sequences,
            'status': j.status,
            'created_at': j.created_at.isoformat() if j.created_at else None,
            'results': [
                {
                    'id': r.id,
                    'sequence_id': r.sequence_id,
                    'sequence': r.sequence,
                    'is_tf': r.is_tf,
                    'tf_confidence': r.tf_confidence,
                    'family': r.family,
                    'family_confidence': r.family_confidence,
                    'verdict': r.verdict,
                    'was_translated': r.was_translated
                } for r in j.sequence_results
            ]
        })
    return out
