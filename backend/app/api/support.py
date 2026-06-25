from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from .. import models, schemas
from ..database import get_db
from .auth import get_current_user

router = APIRouter()

# ─── Tickets ─────────────────────────────────────────────────────────────

@router.get("/tickets", response_model=List[schemas.SupportTicketResponse])
def get_tickets(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    tickets = db.query(models.SupportTicket).filter(models.SupportTicket.user_id == user.id).order_by(models.SupportTicket.created_at.desc()).all()
    return tickets

@router.post("/tickets", response_model=schemas.SupportTicketResponse)
def create_ticket(body: schemas.SupportTicketCreate, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    ticket = models.SupportTicket(
        user_id=user.id,
        subject=body.subject,
        description=body.description,
        priority=body.priority
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket

# ─── Feature Requests ────────────────────────────────────────────────────

@router.get("/features", response_model=List[schemas.FeatureRequestResponse])
def get_features(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    features = db.query(models.FeatureRequest).order_by(models.FeatureRequest.upvotes.desc()).all()
    # In a real app, track votes per user in a separate table.
    return features

@router.post("/features", response_model=schemas.FeatureRequestResponse)
def create_feature(body: schemas.FeatureRequestCreate, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    feature = models.FeatureRequest(
        user_id=user.id,
        title=body.title,
        description=body.description
    )
    db.add(feature)
    db.commit()
    db.refresh(feature)
    return feature

@router.post("/features/{feature_id}/upvote")
def upvote_feature(feature_id: int, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    feature = db.query(models.FeatureRequest).filter(models.FeatureRequest.id == feature_id).first()
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
    
    feature.upvotes += 1
    db.commit()
    return {"message": "Upvoted", "upvotes": feature.upvotes}

# ─── Usage & Billing History ─────────────────────────────────────────────

@router.get("/usage", response_model=schemas.UsageReportResponse)
def get_usage(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    
    tokens_in = db.query(func.sum(models.Conversation.total_tokens_in)).filter(models.Conversation.user_id == user.id).scalar() or 0
    tokens_out = db.query(func.sum(models.Conversation.total_tokens_out)).filter(models.Conversation.user_id == user.id).scalar() or 0
    
    docs_count = db.query(models.Document).filter(models.Document.user_id == user.id).count()
    storage = db.query(func.sum(models.Document.file_size)).filter(models.Document.user_id == user.id).scalar() or 0
    convs = db.query(models.Conversation).filter(models.Conversation.user_id == user.id).count()

    return schemas.UsageReportResponse(
        total_tokens=tokens_in + tokens_out,
        total_documents=docs_count,
        storage_bytes=int(storage),
        conversations=convs
    )

@router.get("/billing-history")
def get_billing_history(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user.subscription:
        return []
    
    invoices = db.query(models.Invoice).filter(models.Invoice.subscription_id == user.subscription.id).order_by(models.Invoice.issued_at.desc()).all()
    
    return [
        {
            "id": inv.id,
            "razorpay_invoice_id": inv.razorpay_invoice_id,
            "amount_paise": inv.amount,
            "status": inv.status,
            "issued_at": inv.issued_at
        } for inv in invoices
    ]
