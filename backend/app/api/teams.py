"""
Ravan AI — Teams API Router
Handles: Team CRUD, Invites, Member management, Dashboard, Activity Logs
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from .. import models, schemas
from ..database import get_db
from .auth import get_current_user

router = APIRouter()


def log_team_activity(db: Session, team_id: int, user_id: int, action: str, details: Optional[str] = None):
    log = models.TeamActivityLog(
        team_id=team_id,
        user_id=user_id,
        action=action,
        details=details
    )
    db.add(log)


def _team_to_response(team: models.Team) -> schemas.TeamResponse:
    members = []
    for m in team.members:
        if m.user:
            members.append(schemas.TeamMemberResponse(
                id=m.id,
                user_id=m.user_id,
                team_id=m.team_id,
                role=m.role,
                user_email=m.user.email,
                user_name=m.user.full_name or "Unknown",
            ))
    
    return schemas.TeamResponse(
        id=team.id,
        name=team.name,
        description=team.description,
        owner_id=team.owner_id,
        created_at=team.created_at,
        members=members,
    )


# ─── Teams CRUD ───────────────────────────────────────────────────────────────

@router.post("", response_model=schemas.TeamResponse)
def create_team(body: schemas.TeamCreate, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    
    team = models.Team(
        name=body.name,
        description=body.description,
        owner_id=user.id,
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    
    # Add owner as an admin member
    member = models.TeamMember(
        user_id=user.id,
        team_id=team.id,
        role="owner",
    )
    db.add(member)
    
    log_team_activity(db, team.id, user.id, "team_created", f"Team '{team.name}' created.")
    db.commit()
    db.refresh(team)
    
    return _team_to_response(team)


@router.get("", response_model=List[schemas.TeamResponse])
def list_teams(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    
    # User can see teams they own or are members of
    member_team_ids = [m.team_id for m in user.teams]
    teams = db.query(models.Team).filter(
        or_(models.Team.owner_id == user.id, models.Team.id.in_(member_team_ids))
    ).all()
    
    return [_team_to_response(t) for t in teams]


@router.get("/{team_id}", response_model=schemas.TeamResponse)
def get_team(team_id: int, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    # Check access
    is_member = any(m.user_id == user.id for m in team.members)
    if not is_member and team.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    return _team_to_response(team)


# ─── Team Members ────────────────────────────────────────────────────────────

@router.post("/{team_id}/members", response_model=schemas.TeamMemberResponse)
def invite_member(team_id: int, body: schemas.InviteMemberRequest, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    # Check admin/owner access
    user_role = next((m.role for m in team.members if m.user_id == user.id), None)
    if user_role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only admins can invite members")
        
    target_user = db.query(models.User).filter(models.User.email == body.email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User with this email not found")
        
    # Check if already a member
    existing = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.user_id == target_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a team member")
        
    member = models.TeamMember(
        user_id=target_user.id,
        team_id=team_id,
        role=body.role or "viewer"
    )
    db.add(member)
    
    log_team_activity(db, team.id, user.id, "member_invited", f"Invited {body.email} as {body.role}")
    db.commit()
    db.refresh(member)
    
    return schemas.TeamMemberResponse(
        id=member.id,
        user_id=member.user_id,
        team_id=member.team_id,
        role=member.role,
        user_email=target_user.email,
        user_name=target_user.full_name or "Unknown",
    )


@router.patch("/{team_id}/members/{user_id}")
def update_member_role(team_id: int, target_user_id: int, body: schemas.UpdateMemberRoleRequest, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    user_role = next((m.role for m in team.members if m.user_id == user.id), None)
    if user_role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only admins can update roles")
        
    target_member = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.user_id == target_user_id
    ).first()
    if not target_member:
        raise HTTPException(status_code=404, detail="Member not found in team")
        
    if target_member.role == "owner" and user_role != "owner":
        raise HTTPException(status_code=403, detail="Cannot change owner role")
        
    target_member.role = body.role
    log_team_activity(db, team.id, user.id, "role_updated", f"Updated user {target_user_id} role to {body.role}")
    db.commit()
    
    return {"message": "Role updated"}


# ─── Dashboard & Activity ────────────────────────────────────────────────────

@router.get("/{team_id}/dashboard", response_model=schemas.TeamDashboardResponse)
def get_dashboard(team_id: int, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    is_member = any(m.user_id == user.id for m in team.members)
    if not is_member and team.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    total_docs = db.query(models.Document).filter(models.Document.team_id == team_id).count()
    total_convs = db.query(models.Conversation).filter(models.Conversation.team_id == team_id).count()
    
    docs = db.query(models.Document).filter(models.Document.team_id == team_id).all()
    storage = sum(d.file_size for d in docs if d.file_size)
    
    return schemas.TeamDashboardResponse(
        total_members=len(team.members),
        total_documents=total_docs,
        total_conversations=total_convs,
        storage_used_bytes=storage,
    )


@router.get("/{team_id}/activity", response_model=List[schemas.TeamActivityLogResponse])
def get_activity(team_id: int, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    is_member = any(m.user_id == user.id for m in team.members)
    if not is_member and team.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    logs = db.query(models.TeamActivityLog).filter(
        models.TeamActivityLog.team_id == team_id
    ).order_by(models.TeamActivityLog.created_at.desc()).limit(50).all()
    
    res = []
    for log in logs:
        res.append(schemas.TeamActivityLogResponse(
            id=log.id,
            team_id=log.team_id,
            user_id=log.user_id,
            user_name=log.user.full_name or "Unknown",
            action=log.action,
            details=log.details,
            created_at=log.created_at,
        ))
    return res
