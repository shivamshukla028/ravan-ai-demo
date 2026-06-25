"""
Ravan AI — Enterprise Admin API
Handles: Dashboard Analytics, User Management, Subscriptions, and Security Logs
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from .. import models, schemas
from ..database import get_db
from .auth import get_current_user

router = APIRouter()

def require_admin(user: models.User):
    """Dependency-like helper to ensure user is admin or owner."""
    if user.role not in [models.RoleEnum.ADMIN.value, models.RoleEnum.OWNER.value]:
        raise HTTPException(status_code=403, detail="Admin access required")


@router.get("/dashboard", response_model=schemas.AdminDashboardResponse)
def get_dashboard(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    require_admin(user)

    total_users = db.query(models.User).count()
    active_users = db.query(models.User).filter(models.User.is_active == True).count()
    
    # Revenue from paid invoices
    revenue = db.query(func.sum(models.Invoice.amount)).filter(models.Invoice.status == "paid").scalar() or 0
    
    # Tokens from all conversations
    tokens_in = db.query(func.sum(models.Conversation.total_tokens_in)).scalar() or 0
    tokens_out = db.query(func.sum(models.Conversation.total_tokens_out)).scalar() or 0
    total_tokens = tokens_in + tokens_out

    total_convs = db.query(models.Conversation).count()

    return schemas.AdminDashboardResponse(
        total_users=total_users,
        active_users=active_users,
        total_revenue_paise=int(revenue),
        total_tokens_used=int(total_tokens),
        total_conversations=total_convs,
        system_health="Healthy",
    )


@router.get("/users", response_model=List[schemas.UserAdminResponse])
def list_users(request: Request, db: Session = Depends(get_db), search: Optional[str] = None):
    user = get_current_user(request, db)
    require_admin(user)

    query = db.query(models.User)
    if search:
        query = query.filter(models.User.email.ilike(f"%{search}%"))

    users = query.order_by(models.User.created_at.desc()).limit(100).all()
    
    response = []
    for u in users:
        plan = "free"
        if u.subscription:
            plan = u.subscription.plan
        
        response.append(schemas.UserAdminResponse(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            email_verified=u.email_verified,
            created_at=u.created_at,
            plan=plan,
        ))
    return response


@router.patch("/users/{target_user_id}", response_model=schemas.UserAdminResponse)
def update_user(target_user_id: int, body: schemas.AdminUpdateUserRequest, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    require_admin(user)

    target_user = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from demoting owner
    if target_user.role == models.RoleEnum.OWNER.value and user.role != models.RoleEnum.OWNER.value:
        raise HTTPException(status_code=403, detail="Only owner can modify owner")

    if body.role is not None:
        if body.role == models.RoleEnum.OWNER.value and user.role != models.RoleEnum.OWNER.value:
            raise HTTPException(status_code=403, detail="Cannot promote to owner")
        target_user.role = body.role
        
    if body.is_active is not None:
        target_user.is_active = body.is_active

    db.commit()
    db.refresh(target_user)

    plan = target_user.subscription.plan if target_user.subscription else "free"
    return schemas.UserAdminResponse(
        id=target_user.id,
        email=target_user.email,
        full_name=target_user.full_name,
        role=target_user.role,
        is_active=target_user.is_active,
        email_verified=target_user.email_verified,
        created_at=target_user.created_at,
        plan=plan,
    )


@router.delete("/users/{target_user_id}")
def delete_user(target_user_id: int, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    require_admin(user)

    target_user = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.role == models.RoleEnum.OWNER.value:
        raise HTTPException(status_code=403, detail="Cannot delete owner account")

    # Cascade delete is mostly handled by DB foreign keys or SQLAlchemy cascade
    db.delete(target_user)
    db.commit()
    return {"message": "User deleted successfully"}


@router.get("/subscriptions", response_model=List[schemas.AdminSubscriptionResponse])
def list_subscriptions(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    require_admin(user)

    subs = db.query(models.Subscription).order_by(models.Subscription.created_at.desc()).limit(100).all()
    
    res = []
    for s in subs:
        res.append(schemas.AdminSubscriptionResponse(
            id=s.id,
            user_id=s.user_id,
            user_email=s.user.email if s.user else "Unknown",
            plan=s.plan,
            status=s.status,
            current_period_end=s.current_period_end,
            created_at=s.created_at,
        ))
    return res


@router.get("/logs", response_model=List[schemas.AdminAuditLogResponse])
def list_audit_logs(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    require_admin(user)

    logs = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(200).all()
    
    res = []
    for log in logs:
        res.append(schemas.AdminAuditLogResponse(
            id=log.id,
            user_id=log.user_id,
            user_email=log.user.email if log.user else None,
            action=log.action,
            ip_address=log.ip_address,
            details=log.details,
            created_at=log.created_at,
        ))
    return res
