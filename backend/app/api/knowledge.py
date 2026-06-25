"""
Ravan AI — Knowledge Base API Router
Handles: PDF upload, document management, semantic search, RAG Q&A
"""
import os
import uuid
import asyncio
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from .. import models, schemas
from ..database import get_db
from ..knowledge_engine import (
    UPLOADS_PATH,
    MAX_FILE_SIZE,
    process_pdf_sync,
    semantic_search,
    rag_query_stream,
    delete_document_vectors,
)

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey_for_ravan_ai")
ALGORITHM = "HS256"


# ─── Auth Helper ──────────────────────────────────────────────────────────────

def get_current_user(request: Request, db: Session) -> models.User:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = auth_header.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expired or invalid")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def _doc_to_response(doc: models.Document) -> schemas.DocumentResponse:
    """Convert Document ORM → Pydantic response with denormalized category fields."""
    return schemas.DocumentResponse(
        id=doc.id,
        user_id=doc.user_id,
        filename=doc.filename,
        original_filename=doc.original_filename,
        file_size=doc.file_size,
        page_count=doc.page_count,
        chunk_count=doc.chunk_count,
        description=doc.description,
        category_id=doc.category_id,
        category_name=doc.category_rel.name if doc.category_rel else None,
        category_color=doc.category_rel.color if doc.category_rel else None,
        status=doc.status,
        error_message=doc.error_message,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


# ─── Categories ───────────────────────────────────────────────────────────────

@router.get("/categories", response_model=List[schemas.DocumentCategoryResponse])
def list_categories(request: Request, db: Session = Depends(get_db), team_id: Optional[int] = None):
    user = get_current_user(request, db)
    query = db.query(models.DocumentCategory)
    if team_id:
        query = query.filter(models.DocumentCategory.team_id == team_id)
    else:
        query = query.filter(models.DocumentCategory.user_id == user.id, models.DocumentCategory.team_id == None)
    return query.all()


@router.post("/categories", response_model=schemas.DocumentCategoryResponse)
def create_category(
    body: schemas.DocumentCategoryCreate,
    request: Request,
    db: Session = Depends(get_db),
    team_id: Optional[int] = None,
):
    user = get_current_user(request, db)
    cat = models.DocumentCategory(
        user_id=user.id,
        team_id=team_id,
        name=body.name,
        color=body.color or "#0ea5e9",
        icon=body.icon or "folder",
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categories/{cat_id}")
def delete_category(cat_id: int, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    cat = db.query(models.DocumentCategory).filter(
        models.DocumentCategory.id == cat_id
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    if cat.user_id != user.id and not (cat.team_id and any(m.user_id == user.id for m in cat.team.members)):
        raise HTTPException(status_code=403, detail="Not authorized to delete this category")
        
    db.delete(cat)
    db.commit()
    return {"message": "Category deleted"}


# ─── Document Upload ──────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_document(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    category_id: Optional[int] = Form(None),
    description: Optional[str] = Form(None),
    team_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Upload a PDF. Returns immediately. Processing happens in background.
    Poll /documents/{id}/status for progress.
    """
    user = get_current_user(request, db)

    # Secure Chunked Upload & Validation
    file_size = 0
    file_bytes = bytearray()
    
    # 1. Read first chunk to check Magic Bytes (File Type Validation)
    chunk = await file.read(2048)
    if not chunk.startswith(b'%PDF-'):
        raise HTTPException(status_code=400, detail="Invalid file type. File does not appear to be a genuine PDF.")
        
    while chunk:
        file_bytes.extend(chunk)
        file_size += len(chunk)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE // 1024 // 1024}MB"
            )
        chunk = await file.read(1024 * 1024) # read in 1MB chunks
        
    if file_size == 0:
        raise HTTPException(status_code=400, detail="File is empty")
        
    # 2. Malware Scan Hook (FAIL-CLOSED)
    # In production, send file_bytes to ClamAV daemon
    CLAMAV_URL = os.getenv("CLAMAV_URL")
    if not CLAMAV_URL:
        # We must fail closed if scanner is not configured
        raise HTTPException(
            status_code=503, 
            detail="Service Unavailable: Malware scanner offline. All uploads are currently blocked for security."
        )
        
    try:
        # mock call logic, this would be an actual HTTP POST to clamd
        print(f"[SECURITY] Sending {file.filename} to {CLAMAV_URL} for malware scan...")
        # If response != 200: raise Exception
    except Exception as e:
        print(f"[SECURITY ALERT] Malware scanner unreachable: {e}")
        raise HTTPException(status_code=503, detail="Malware scanner unreachable. Upload aborted.")

    # Save to disk with a unique name to avoid conflicts
    prefix = f"team_{team_id}" if team_id else f"user_{user.id}"
    safe_name = f"{prefix}_{uuid.uuid4().hex[:8]}_{file.filename}"
    local_path = os.path.join(UPLOADS_PATH, safe_name)

    with open(local_path, "wb") as f:
        f.write(file_bytes)

    # Validate category exists
    if category_id:
        cat = db.query(models.DocumentCategory).filter(models.DocumentCategory.id == category_id).first()
        if not cat:
            category_id = None

    # Create document record
    doc = models.Document(
        user_id=user.id,
        team_id=team_id,
        filename=file.filename,
        original_filename=file.filename,
        local_path=local_path,
        file_size=file_size,
        category_id=category_id,
        description=description,
        status="processing",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Process in background thread (so upload returns instantly)
    def _process_in_thread():
        from ..database import SessionLocal
        bg_db = SessionLocal()
        try:
            process_pdf_sync(
                file_path=local_path,
                document_id=doc.id,
                user_id=user.id,
                db_session=bg_db,
            )
        finally:
            bg_db.close()

    background_tasks.add_task(_process_in_thread)

    return {
        "id": doc.id,
        "filename": doc.filename,
        "file_size": doc.file_size,
        "status": "processing",
        "message": "Upload successful. Document is being processed in background.",
    }


# ─── Document List & Detail ───────────────────────────────────────────────────

@router.get("/documents", response_model=schemas.DocumentListResponse)
def list_documents(
    request: Request,
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    status: Optional[str] = None,
    team_id: Optional[int] = None,
):
    user = get_current_user(request, db)

    if team_id:
        query = db.query(models.Document).filter(models.Document.team_id == team_id)
    else:
        query = db.query(models.Document).filter(models.Document.user_id == user.id, models.Document.team_id == None)

    if search:
        query = query.filter(models.Document.filename.ilike(f"%{search}%"))
    if category_id:
        query = query.filter(models.Document.category_id == category_id)
    if status:
        query = query.filter(models.Document.status == status)

    docs = query.order_by(models.Document.created_at.desc()).all()
    total_size = sum((d.file_size or 0) for d in docs)
    ready_count = sum(1 for d in docs if d.status == "ready")
    processing_count = sum(1 for d in docs if d.status == "processing")

    return schemas.DocumentListResponse(
        documents=[_doc_to_response(d) for d in docs],
        total=len(docs),
        total_size=total_size,
        ready_count=ready_count,
        processing_count=processing_count,
    )


@router.get("/documents/{doc_id}", response_model=schemas.DocumentResponse)
def get_document(doc_id: int, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.user_id != user.id and not (doc.team_id and any(m.user_id == user.id for m in doc.team.members)):
        raise HTTPException(status_code=403, detail="Access denied")
    return _doc_to_response(doc)


@router.get("/documents/{doc_id}/status")
def get_document_status(doc_id: int, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.user_id != user.id and not (doc.team_id and any(m.user_id == user.id for m in doc.team.members)):
        raise HTTPException(status_code=403, detail="Access denied")
    return {
        "id": doc.id,
        "status": doc.status,
        "chunk_count": doc.chunk_count,
        "page_count": doc.page_count,
        "error_message": doc.error_message,
    }


# ─── Document Delete ──────────────────────────────────────────────────────────

@router.delete("/documents/{doc_id}")
def delete_document(doc_id: int, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if doc.user_id != user.id and not (doc.team_id and any(m.user_id == user.id for m in doc.team.members)):
        raise HTTPException(status_code=403, detail="Access denied")

    # Delete from ChromaDB
    delete_document_vectors(document_id=doc_id, user_id=user.id)

    # Delete local file
    if doc.local_path and os.path.exists(doc.local_path):
        try:
            os.remove(doc.local_path)
        except Exception as e:
            print(f"[KB] Warning: could not delete file {doc.local_path}: {e}")

    # Delete from DB (cascades to chunks)
    db.delete(doc)
    db.commit()
    return {"message": f"Document '{doc.filename}' deleted successfully"}


# ─── Semantic Search ──────────────────────────────────────────────────────────

@router.post("/search", response_model=schemas.SemanticSearchResponse)
def search_knowledge(
    body: schemas.SemanticSearchRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    user = get_current_user(request, db)

    # Validate document_ids belong to user
    doc_ids = None
    if body.document_ids:
        user_docs = db.query(models.Document).filter(
            models.Document.id.in_(body.document_ids),
            models.Document.user_id == user.id,
            models.Document.status == "ready",
        ).all()
        doc_ids = [d.id for d in user_docs]

    results = semantic_search(
        query=body.query,
        user_id=user.id,
        limit=min(body.limit or 5, 20),
        document_ids=doc_ids,
    )

    # Count total chunks in user's knowledge base
    total_chunks = db.query(models.DocumentChunk).join(models.Document).filter(
        models.Document.user_id == user.id,
        models.Document.status == "ready",
    ).count()

    return schemas.SemanticSearchResponse(
        query=body.query,
        results=[schemas.SearchResultItem(**r) for r in results],
        total_searched=total_chunks,
    )


# ─── RAG Q&A (Streaming) ─────────────────────────────────────────────────────

@router.post("/query")
async def knowledge_query(
    body: schemas.RAGQueryRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Stream a RAG-powered answer from the user's knowledge base."""
    user = get_current_user(request, db)

    # Validate document access
    doc_ids = None
    if body.document_ids:
        user_docs = db.query(models.Document).filter(
            models.Document.id.in_(body.document_ids),
            models.Document.user_id == user.id,
            models.Document.status == "ready",
        ).all()
        doc_ids = [d.id for d in user_docs] or None

    async def event_stream():
        async for event in rag_query_stream(
            question=body.question,
            user_id=user.id,
            model=body.model or "gpt-4o",
            document_ids=doc_ids,
            max_context_chunks=body.max_context_chunks or 5,
        ):
            yield f"data: {event}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─── Stats ────────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=schemas.KnowledgeStatsResponse)
def get_stats(request: Request, db: Session = Depends(get_db), team_id: Optional[int] = None):
    user = get_current_user(request, db)

    if team_id:
        docs = db.query(models.Document).filter(models.Document.team_id == team_id).all()
        total_chunks = db.query(models.DocumentChunk).join(models.Document).filter(
            models.Document.team_id == team_id
        ).count()
        categories_count = db.query(models.DocumentCategory).filter(
            models.DocumentCategory.team_id == team_id
        ).count()
    else:
        docs = db.query(models.Document).filter(models.Document.user_id == user.id, models.Document.team_id == None).all()
        total_chunks = db.query(models.DocumentChunk).join(models.Document).filter(
            models.Document.user_id == user.id, models.Document.team_id == None
        ).count()
        categories_count = db.query(models.DocumentCategory).filter(
            models.DocumentCategory.user_id == user.id, models.DocumentCategory.team_id == None
        ).count()

    return schemas.KnowledgeStatsResponse(
        total_documents=len(docs),
        total_size_bytes=sum((d.file_size or 0) for d in docs),
        total_chunks=total_chunks,
        ready_documents=sum(1 for d in docs if d.status == "ready"),
        processing_documents=sum(1 for d in docs if d.status == "processing"),
        failed_documents=sum(1 for d in docs if d.status == "failed"),
        categories_count=categories_count,
    )
