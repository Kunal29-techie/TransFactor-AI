from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class BatchJob(Base):
    __tablename__ = 'batch_jobs'
    id = Column(String, primary_key=True, index=True)
    filename = Column(String)
    total_sequences = Column(Integer, default=0)
    processed_sequences = Column(Integer, default=0)
    status = Column(String, default='queued')
    created_at = Column(DateTime, default=datetime.utcnow)

    sequence_results = relationship('SequenceResult', back_populates='job', cascade='all, delete-orphan')

class SequenceResult(Base):
    __tablename__ = 'sequence_results'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    job_id = Column(String, ForeignKey('batch_jobs.id'))
    sequence_id = Column(String)
    sequence = Column(Text, nullable=True)
    is_tf = Column(Boolean)
    tf_confidence = Column(Float)
    family = Column(String)
    family_confidence = Column(Float)
    verdict = Column(String, nullable=True)
    was_translated = Column(Boolean, default=False)

    job = relationship('BatchJob', back_populates='sequence_results')
