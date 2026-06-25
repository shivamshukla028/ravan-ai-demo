import re
import os
import bcrypt
import random
from datetime import timedelta, datetime
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from .. import models, schemas
from ..database import get_db

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey_for_ravan_ai")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(request: Request, db: Session = Depends(get_db)):
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

def validate_password_complexity(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one digit")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character")

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    validate_password_complexity(user.password)
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password, full_name=user.full_name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Initialize Free Subscription
    new_sub = models.Subscription(user_id=new_user.id, plan=models.PlanEnum.FREE.value, status="active")
    db.add(new_sub)
    db.commit()
    
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(request: Request, user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    
    # Account Lockout Check
    if db_user and db_user.locked_until and db_user.locked_until > datetime.utcnow():
        remaining = int((db_user.locked_until - datetime.utcnow()).total_seconds() / 60)
        raise HTTPException(status_code=403, detail=f"Account locked. Try again in {remaining} minutes.")
        
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        if db_user:
            db_user.failed_login_attempts = (db_user.failed_login_attempts or 0) + 1
            if db_user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS:
                db_user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
            db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    # Reset lockout on success
    db_user.failed_login_attempts = 0
    db_user.locked_until = None
    db.commit()
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    
    ip = request.client.host if request.client else None
    audit = models.AuditLog(user_id=db_user.id, action="login", ip_address=ip, details="User logged in securely")
    db.add(audit)
    db.commit()
    
    return {"access_token": access_token, "token_type": "bearer"}

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.example.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "user@example.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "password")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@ravanai.com")

def send_email(to_email: str, subject: str, body: str):
    msg = MIMEMultipart()
    msg['From'] = FROM_EMAIL
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        if SMTP_SERVER != "smtp.example.com": # Only try if configured
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            text = msg.as_string()
            server.sendmail(FROM_EMAIL, to_email, text)
            server.quit()
            print(f"[SMTP] Successfully sent email to {to_email}")
        else:
            print(f"[SECURITY MOCK] -> Sending OTP to {to_email}:\n{body}\n")
    except Exception as e:
        print(f"[SMTP] Failed to send email to {to_email}: {e}")

@router.post("/request-otp")
def request_otp(body: schemas.OTPRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user:
        # Prevent email enumeration by returning generic success
        return {"message": "If the email is registered, an OTP has been sent."}
    
    # Rate limit OTP requests (1 per minute)
    if user.otp_last_sent and (datetime.utcnow() - user.otp_last_sent).total_seconds() < 60:
        raise HTTPException(status_code=429, detail="Please wait 60 seconds before requesting another OTP.")
    
    otp = str(random.randint(100000, 999999))
    user.otp_code = get_password_hash(otp) # Hash OTP for security
    user.otp_expiry = datetime.utcnow() + timedelta(minutes=10) # 10 mins expiry
    user.otp_last_sent = datetime.utcnow()
    db.commit()
    
    # Send actual email
    subject = "Ravan AI - Your Verification Code"
    body_text = f"Your Verification Code is: {otp}\n\nThis code will expire in 10 minutes."
    send_email(user.email, subject, body_text)
    
    return {"message": "If the email is registered, an OTP has been sent."}

@router.post("/resend-otp")
def resend_otp(body: schemas.OTPRequest, db: Session = Depends(get_db)):
    return request_otp(body, db)

@router.post("/verify-otp")
def verify_otp(body: schemas.OTPVerify, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user or not user.otp_code or not user.otp_expiry:
        raise HTTPException(status_code=400, detail="Invalid OTP or expired")
        
    if datetime.utcnow() > user.otp_expiry:
        raise HTTPException(status_code=400, detail="OTP has expired")
        
    if not verify_password(body.otp_code, user.otp_code):
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    user.email_verified = True
    user.otp_code = None
    user.otp_expiry = None
    db.commit()
    return {"message": "Email verified successfully"}

@router.post("/forgot-password")
def forgot_password(body: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    return request_otp(body, db)

@router.post("/reset-password")
def reset_password(body: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user or not user.otp_code or not user.otp_expiry:
        raise HTTPException(status_code=400, detail="Invalid request")
        
    if datetime.utcnow() > user.otp_expiry:
        raise HTTPException(status_code=400, detail="OTP has expired")
        
    if not verify_password(body.otp_code, user.otp_code):
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    validate_password_complexity(body.new_password)
    
    user.hashed_password = get_password_hash(body.new_password)
    user.otp_code = None
    user.otp_expiry = None
    # Reset lockouts on password reset
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    
    return {"message": "Password reset successfully"}
