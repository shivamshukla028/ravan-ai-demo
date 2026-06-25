from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Dict
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerify(BaseModel):
    email: EmailStr
    otp_code: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class SubscriptionCreate(BaseModel):
    plan: str

class SubscriptionResponse(BaseModel):
    plan: str
    status: str
    current_period_end: Optional[datetime]

    class Config:
        from_attributes = True

# ─── Chat / Conversation Schemas ─────────────────────────────────────────────

class ConversationCreate(BaseModel):
    title: Optional[str] = "New Conversation"
    model: Optional[str] = "gpt-4o"

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    model: Optional[str] = None

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    model: Optional[str] = None
    tokens_in: Optional[int] = None
    tokens_out: Optional[int] = None
    meta: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    model: Optional[str] = "gpt-4o"
    total_tokens_in: Optional[int] = 0
    total_tokens_out: Optional[int] = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    messages: Optional[List[MessageResponse]] = []

    class Config:
        from_attributes = True

class ConversationListItem(BaseModel):
    id: int
    title: str
    model: Optional[str] = "gpt-4o"
    total_tokens_in: Optional[int] = 0
    total_tokens_out: Optional[int] = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    conversation_id: Optional[int] = None
    message: str
    model: Optional[str] = "gpt-4o"
    system_prompt: Optional[str] = None

class ChatStreamRequest(BaseModel):
    conversation_id: Optional[int] = None
    message: str
    model: Optional[str] = "gpt-4o"
    system_prompt: Optional[str] = None


# ─── Knowledge Base Schemas ───────────────────────────────────────────────────

class DocumentCategoryCreate(BaseModel):
    name: str
    color: Optional[str] = "#0ea5e9"
    icon: Optional[str] = "folder"

class DocumentCategoryResponse(BaseModel):
    id: int
    name: str
    color: str
    icon: str
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentChunkResponse(BaseModel):
    id: int
    chunk_index: int
    content: str
    page_number: Optional[int] = None
    token_count: Optional[int] = None

    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    original_filename: Optional[str] = None
    file_size: Optional[int] = None
    page_count: Optional[int] = None
    chunk_count: Optional[int] = 0
    description: Optional[str] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    category_color: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int
    total_size: int
    ready_count: int
    processing_count: int

class SemanticSearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 5
    category_id: Optional[int] = None
    document_ids: Optional[List[int]] = None

class SearchResultItem(BaseModel):
    document_id: int
    filename: str
    chunk_content: str
    page_number: Optional[int] = None
    relevance_score: float
    chunk_index: int

class SemanticSearchResponse(BaseModel):
    query: str
    results: List[SearchResultItem]
    total_searched: int

class RAGQueryRequest(BaseModel):
    question: str
    model: Optional[str] = "gpt-4o"
    document_ids: Optional[List[int]] = None
    category_id: Optional[int] = None
    max_context_chunks: Optional[int] = 5

class KnowledgeStatsResponse(BaseModel):
    total_documents: int
    total_size_bytes: int
    total_chunks: int
    ready_documents: int
    processing_documents: int
    failed_documents: int
    categories_count: int

# ─── Team Workspace Schemas ──────────────────────────────────────────────────

class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None

class TeamMemberResponse(BaseModel):
    id: int
    user_id: int
    team_id: int
    role: str
    user_email: str
    user_name: str

    class Config:
        from_attributes = True

class TeamResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    owner_id: int
    created_at: datetime
    members: Optional[List[TeamMemberResponse]] = []

    class Config:
        from_attributes = True

class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: Optional[str] = "viewer"

class UpdateMemberRoleRequest(BaseModel):
    role: str

class TeamActivityLogResponse(BaseModel):
    id: int
    team_id: int
    user_id: int
    user_name: str
    action: str
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TeamDashboardResponse(BaseModel):
    total_members: int
    total_documents: int
    total_conversations: int
    storage_used_bytes: int

# ─── Enterprise Admin Schemas ────────────────────────────────────────────────

class AdminDashboardResponse(BaseModel):
    total_users: int
    active_users: int
    total_revenue_paise: int
    total_tokens_used: int
    total_conversations: int
    system_health: str

class UserAdminResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    email_verified: bool
    created_at: datetime
    plan: str

    class Config:
        from_attributes = True

class AdminUpdateUserRequest(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None

class AdminAuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    user_email: Optional[str]
    action: str
    ip_address: Optional[str]
    details: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class AdminSubscriptionResponse(BaseModel):
    id: int
    user_id: int
    user_email: str
    plan: str
    status: str
    current_period_end: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

# ─── Customer Success Portal Schemas ─────────────────────────────────────────

class SupportTicketCreate(BaseModel):
    subject: str
    description: str
    priority: Optional[str] = "normal"

class SupportTicketResponse(BaseModel):
    id: int
    subject: str
    description: str
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FeatureRequestCreate(BaseModel):
    title: str
    description: str

class FeatureRequestResponse(BaseModel):
    id: int
    title: str
    description: str
    status: str
    upvotes: int
    created_at: datetime
    has_voted: Optional[bool] = False # Virtual field

    class Config:
        from_attributes = True

class UsageReportResponse(BaseModel):
    total_tokens: int
    total_documents: int
    storage_bytes: int
    conversations: int
