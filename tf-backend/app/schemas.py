from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class SequenceResultOut(BaseModel):
    id: Optional[int] = None
    sequence_id: str
    sequence: Optional[str] = None
    is_tf: bool
    tf_confidence: float
    family: str
    family_confidence: float
    verdict: Optional[str] = None
    was_translated: Optional[bool] = False
    family_scores: Optional[Dict[str, float]] = None
    db_references: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

class BatchJobOut(BaseModel):
    id: str
    filename: str
    status: str
    total_sequences: int
    processed_sequences: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class BatchJobWithResultsOut(BatchJobOut):
    results: List[SequenceResultOut] = []

class FamilyQueryRequest(BaseModel):
    job_id: Optional[str] = None
    families: List[str]
    sequences: Optional[List[Dict[str, Any]]] = None

class FamilyQueryResultItem(BaseModel):
    family: str
    present: bool
    yes_or_no: str
    confidence: float
    matched_sequences_count: int
    matching_sequences: List[Dict[str, Any]]

class FamilyQueryResponse(BaseModel):
    total_sequences: int
    results: List[FamilyQueryResultItem]

class DirectPredictRequest(BaseModel):
    fasta_text: str
