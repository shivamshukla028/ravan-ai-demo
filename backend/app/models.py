from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base

class RoleEnum(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    OWNER = "owner"

class PlanEnum(str, enum.Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, default=RoleEnum.USER.value)
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    otp_code = Column(String, nullable=True)
    otp_expiry = Column(DateTime(timezone=True), nullable=True)
    otp_last_sent = Column(DateTime(timezone=True), nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    teams = relationship("TeamMember", back_populates="user")
    subscription = relationship("Subscription", back_populates="user", uselist=False)
    conversations = relationship("Conversation", back_populates="user")
    documents = relationship("Document", back_populates="user")
    api_keys = relationship("APIKey", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    usage = relationship("UserUsage", back_populates="user", uselist=False)

class UserUsage(Base):
    __tablename__ = "user_usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    daily_messages = Column(Integer, default=0)
    monthly_tokens = Column(Integer, default=0)
    last_reset_date = Column(DateTime(timezone=True), server_default=func.now())
    last_reset_month = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="usage")

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="team")
    categories = relationship("DocumentCategory", back_populates="team")
    conversations = relationship("Conversation", back_populates="team")
    activity_logs = relationship("TeamActivityLog", back_populates="team", cascade="all, delete-orphan")

class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"))
    role = Column(String, default=RoleEnum.USER.value) # admin, analyst, viewer

    user = relationship("User", back_populates="teams")
    team = relationship("Team", back_populates="members")

class TeamActivityLog(Base):
    __tablename__ = "team_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    team = relationship("Team", back_populates="activity_logs")
    user = relationship("User")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    razorpay_subscription_id = Column(String, unique=True, index=True, nullable=True)
    razorpay_customer_id = Column(String, nullable=True)
    plan = Column(String, default=PlanEnum.FREE.value)
    status = Column(String, default="active") # active, cancelled, past_due
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="subscription")
    invoices = relationship("Invoice", back_populates="subscription")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"))
    razorpay_invoice_id = Column(String, unique=True)
    amount = Column(Integer, nullable=False) # In paise (INR)
    currency = Column(String, default="INR")
    status = Column(String) # paid, open, void
    issued_at = Column(DateTime(timezone=True))
    
    subscription = relationship("Subscription", back_populates="invoices")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=True)
    title = Column(String, nullable=False, default="New Conversation")
    model = Column(String, nullable=True, default="gpt-4o")  # Selected AI model
    total_tokens_in = Column(Integer, default=0)             # Cumulative input tokens
    total_tokens_out = Column(Integer, default=0)            # Cumulative output tokens
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="conversations")
    team = relationship("Team", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"))
    role = Column(String, nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    model = Column(String, nullable=True)          # Which model generated this message
    tokens_in = Column(Integer, nullable=True)     # Input token count for this turn
    tokens_out = Column(Integer, nullable=True)    # Output token count for this turn
    meta = Column(JSON, nullable=True)             # Extra metadata (provider, finish_reason, etc.)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")


class DocumentCategory(Base):
    __tablename__ = "document_categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=True)
    name = Column(String, nullable=False)
    color = Column(String, default="#0ea5e9")  # Hex color
    icon = Column(String, default="folder")    # Icon name
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])
    team = relationship("Team", back_populates="categories")
    documents = relationship("Document", back_populates="category_rel")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=True)
    local_path = Column(String, nullable=True)         # Local disk path
    s3_url = Column(String, nullable=True)             # Future S3 URL
    file_size = Column(Integer, nullable=True)         # Bytes
    page_count = Column(Integer, nullable=True)        # PDF page count
    chunk_count = Column(Integer, default=0)           # Number of text chunks
    description = Column(Text, nullable=True)          # Auto-generated summary
    category_id = Column(Integer, ForeignKey("document_categories.id"), nullable=True)
    status = Column(String, default="processing")      # processing, ready, failed
    error_message = Column(Text, nullable=True)
    chroma_collection = Column(String, nullable=True)  # ChromaDB collection name
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="documents")
    team = relationship("Team", back_populates="documents")
    category_rel = relationship("DocumentCategory", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"))
    chunk_index = Column(Integer, nullable=False)      # Order within document
    content = Column(Text, nullable=False)             # Chunk text
    page_number = Column(Integer, nullable=True)       # Source page
    chroma_id = Column(String, nullable=True)          # ID in ChromaDB
    token_count = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates="chunks")



class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    report_type = Column(String, nullable=False) # ISO_27001, NIST, Executive
    content_url = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    key_hash = Column(String, nullable=False, unique=True)
    last_used = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="api_keys")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String, nullable=False) # e.g., login, document_upload, API_request
    ip_address = Column(String, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="audit_logs")

# ─── Customer Success Portal Models ──────────────────────────────────────────

class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    subject = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String, default="open") # open, in_progress, resolved
    priority = Column(String, default="normal") # low, normal, high, urgent
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User")

class FeatureRequest(Base):
    __tablename__ = "feature_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String, default="planned") # planned, active, completed
    upvotes = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
