"""
Ravan AI — Chat API Router
Handles: Conversation CRUD, Message history, SSE Streaming, Export
"""
import json
from datetime import datetime
from typing import Optional, List, AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import os

from .. import models, schemas
from ..database import get_db
from ..ai_router import stream_chat, estimate_tokens, get_models_grouped, RAVAN_SYSTEM_PROMPT

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey_for_ravan_ai")
ALGORITHM = "HS256"


# ─── Auth Helper ──────────────────────────────────────────────────────────────

def get_current_user(request: Request, db: Session) -> models.User:
    """Extract current user from JWT Bearer token in Authorization header."""
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


# ─── Models List ──────────────────────────────────────────────────────────────

@router.get("/models")
def list_models():
    """Return available AI models grouped by provider."""
    return {"models": get_models_grouped()}


# ─── Conversation CRUD ────────────────────────────────────────────────────────

@router.post("/conversations", response_model=schemas.ConversationResponse)
def create_conversation(
    body: schemas.ConversationCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    user = get_current_user(request, db)
    conv = models.Conversation(
        user_id=user.id,
        title=body.title or "New Conversation",
        model=body.model or "gpt-4o",
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.get("/conversations", response_model=List[schemas.ConversationListItem])
def list_conversations(
    request: Request,
    db: Session = Depends(get_db),
    search: Optional[str] = None,
):
    user = get_current_user(request, db)
    query = db.query(models.Conversation).filter(
        models.Conversation.user_id == user.id
    ).order_by(models.Conversation.updated_at.desc())
    
    if search:
        query = query.filter(models.Conversation.title.ilike(f"%{search}%"))
    
    return query.all()


@router.get("/conversations/{conv_id}", response_model=schemas.ConversationResponse)
def get_conversation(
    conv_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    user = get_current_user(request, db)
    conv = db.query(models.Conversation).filter(
        models.Conversation.id == conv_id,
        models.Conversation.user_id == user.id,
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.patch("/conversations/{conv_id}", response_model=schemas.ConversationResponse)
def update_conversation(
    conv_id: int,
    body: schemas.ConversationUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    user = get_current_user(request, db)
    conv = db.query(models.Conversation).filter(
        models.Conversation.id == conv_id,
        models.Conversation.user_id == user.id,
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if body.title is not None:
        conv.title = body.title
    if body.model is not None:
        conv.model = body.model
    
    db.commit()
    db.refresh(conv)
    return conv


@router.delete("/conversations/{conv_id}")
def delete_conversation(
    conv_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    user = get_current_user(request, db)
    conv = db.query(models.Conversation).filter(
        models.Conversation.id == conv_id,
        models.Conversation.user_id == user.id,
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    db.delete(conv)
    db.commit()
    return {"message": "Conversation deleted"}


# ─── Export ───────────────────────────────────────────────────────────────────

@router.get("/conversations/{conv_id}/export")
def export_conversation(
    conv_id: int,
    fmt: str = "json",  # "json" or "markdown"
    request: Request = None,
    db: Session = Depends(get_db),
):
    user = get_current_user(request, db)
    conv = db.query(models.Conversation).filter(
        models.Conversation.id == conv_id,
        models.Conversation.user_id == user.id,
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if fmt == "markdown":
        lines = [f"# {conv.title}\n", f"**Model:** {conv.model}\n\n---\n"]
        for msg in conv.messages:
            role_label = "🧑 **You**" if msg.role == "user" else "🤖 **Ravan AI**"
            lines.append(f"{role_label}\n\n{msg.content}\n\n---\n")
        
        content = "\n".join(lines)
        return StreamingResponse(
            iter([content]),
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="{conv.title}.md"'},
        )
    
    # JSON export
    data = {
        "id": conv.id,
        "title": conv.title,
        "model": conv.model,
        "created_at": conv.created_at.isoformat(),
        "messages": [
            {
                "role": msg.role,
                "content": msg.content,
                "model": msg.model,
                "tokens_in": msg.tokens_in,
                "tokens_out": msg.tokens_out,
                "created_at": msg.created_at.isoformat(),
            }
            for msg in conv.messages
        ],
    }
    return JSONResponse(content=data, headers={
        "Content-Disposition": f'attachment; filename="{conv.title}.json"'
    })


# ─── SSE Streaming Chat ───────────────────────────────────────────────────────

@router.post("/stream")
async def chat_stream(
    body: schemas.ChatStreamRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Stream AI responses using Server-Sent Events (SSE).
    Returns chunked text as `data: <chunk>\n\n` events.
    Ends with `data: [DONE]\n\n`.
    """
    user = get_current_user(request, db)
    
    # Get or create conversation
    if body.conversation_id:
        conv = db.query(models.Conversation).filter(
            models.Conversation.id == body.conversation_id,
            models.Conversation.user_id == user.id,
        ).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        # Auto-generate title from first message (first 60 chars)
        title = body.message[:60].strip()
        if len(body.message) > 60:
            title += "..."
        conv = models.Conversation(
            user_id=user.id,
            title=title,
            model=body.model or "gpt-4o",
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
    
    # Update model if changed
    if body.model and conv.model != body.model:
        conv.model = body.model
        db.commit()
    
    # Build message history for AI context
    history = [
        {"role": msg.role, "content": msg.content}
        for msg in conv.messages
    ]
    history.append({"role": "user", "content": body.message})
    
    # Count input tokens (estimate)
    tokens_in = sum(estimate_tokens(m["content"]) for m in history)
    
    # Usage Tracking & Limits Check
    now = datetime.utcnow()
    usage = db.query(models.UserUsage).filter(models.UserUsage.user_id == user.id).first()
    if not usage:
        usage = models.UserUsage(user_id=user.id)
        db.add(usage)
        db.commit()
        db.refresh(usage)
        
    # Reset logic
    if usage.last_reset_date.date() < now.date():
        usage.daily_messages = 0
        usage.last_reset_date = now
    if usage.last_reset_month.month != now.month or usage.last_reset_month.year != now.year:
        usage.monthly_tokens = 0
        usage.last_reset_month = now
        
    plan = user.subscription.plan if user.subscription else "free"
    
    if plan == "free":
        if usage.daily_messages >= 50:
            raise HTTPException(status_code=403, detail="Daily message limit reached (50/50) for Free tier. Please upgrade to Pro.")
        if usage.monthly_tokens + tokens_in > 100000:
            raise HTTPException(status_code=403, detail="Monthly token limit reached (100k) for Free tier. Please upgrade to Pro.")
    elif plan == "pro":
        # Fair usage check could go here
        pass
        
    usage.daily_messages += 1
    usage.monthly_tokens += tokens_in
    db.commit()
    
    # Count input tokens (estimate)
    tokens_in = sum(estimate_tokens(m["content"]) for m in history)
    
    # Save user message immediately
    user_msg = models.Message(
        conversation_id=conv.id,
        role="user",
        content=body.message,
        tokens_in=tokens_in,
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)
    
    async def event_generator() -> AsyncGenerator[str, None]:
        full_response = []
        
        # Send conversation_id first so frontend knows which conversation was created
        meta_event = json.dumps({
            "type": "meta",
            "conversation_id": conv.id,
            "title": conv.title,
        })
        yield f"data: {meta_event}\n\n"
        
        # Stream AI response
        async for chunk in stream_chat(
            messages=history,
            model=body.model or conv.model or "gpt-4o",
            system_prompt=body.system_prompt,
        ):
            full_response.append(chunk)
            payload = json.dumps({"type": "chunk", "content": chunk})
            yield f"data: {payload}\n\n"
        
        # Assemble final response and save to DB
        ai_content = "".join(full_response)
        tokens_out = estimate_tokens(ai_content)
        
        ai_msg = models.Message(
            conversation_id=conv.id,
            role="assistant",
            content=ai_content,
            model=body.model or conv.model,
            tokens_out=tokens_out,
        )
        db.add(ai_msg)
        
        # Update cumulative token counts
        conv.total_tokens_in = (conv.total_tokens_in or 0) + tokens_in
        conv.total_tokens_out = (conv.total_tokens_out or 0) + tokens_out
        
        # Update UserUsage monthly tokens out
        if usage:
            usage.monthly_tokens += tokens_out
            
        db.commit()
        
        # Send done event with token summary
        done_event = json.dumps({
            "type": "done",
            "tokens_in": tokens_in,
            "tokens_out": tokens_out,
            "total_tokens_in": conv.total_tokens_in,
            "total_tokens_out": conv.total_tokens_out,
        })
        yield f"data: {done_event}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ─── Non-Streaming Fallback ───────────────────────────────────────────────────

@router.post("/message", response_model=schemas.MessageResponse)
async def chat_message(
    body: schemas.ChatRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Non-streaming chat endpoint for simple integrations."""
    user = get_current_user(request, db)
    
    if body.conversation_id:
        conv = db.query(models.Conversation).filter(
            models.Conversation.id == body.conversation_id,
            models.Conversation.user_id == user.id,
        ).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conv = models.Conversation(
            user_id=user.id,
            title=body.message[:60],
            model=body.model or "gpt-4o",
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
    
    history = [
        {"role": msg.role, "content": msg.content}
        for msg in conv.messages
    ]
    history.append({"role": "user", "content": body.message})
    
    # Collect full response
    full_response = []
    async for chunk in stream_chat(messages=history, model=body.model or conv.model):
        full_response.append(chunk)
    
    ai_content = "".join(full_response)
    tokens_in = estimate_tokens(body.message)
    tokens_out = estimate_tokens(ai_content)
    
    user_msg = models.Message(
        conversation_id=conv.id, role="user", content=body.message, tokens_in=tokens_in,
    )
    ai_msg = models.Message(
        conversation_id=conv.id, role="assistant", content=ai_content,
        model=body.model, tokens_out=tokens_out,
    )
    db.add_all([user_msg, ai_msg])
    db.commit()
    db.refresh(ai_msg)
    return ai_msg
