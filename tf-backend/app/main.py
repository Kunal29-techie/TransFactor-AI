import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from .models import BatchJob
from .routes import batch

# Recreate all tables cleanly
Base.metadata.create_all(bind=engine)

app = FastAPI(title='TransFactor AI API', version='2.0.0')

# Enable all origins, ports, and headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(batch.router, prefix='/batch', tags=['batch'])

@app.get('/')
def root():
    return {'status': 'online', 'message': 'TransFactor AI Engine Running', 'models_loaded': True}

@app.get('/health')
def health_check():
    return {'status': 'online', 'models_loaded': True}

@app.get('/history')
def get_history_direct(db: Session = Depends(get_db)):
    return batch.get_batch_history(db)
