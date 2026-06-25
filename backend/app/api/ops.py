import time
import psutil
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..database import get_db
from .auth import get_current_user
from .. import models

from ..services.backups import backup_postgres, backup_chromadb
from ..services.notifications import trigger_system_alert

router = APIRouter()

def require_owner(user: models.User):
    """Only owners should trigger ops endpoints"""
    if user.role != models.RoleEnum.OWNER.value:
        raise HTTPException(status_code=403, detail="Ops access requires owner role")

# Store app start time globally
APP_START_TIME = time.time()

@router.get("/health")
def get_system_health(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    require_owner(user)

    # CPU & Memory
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')

    # DB Ping
    try:
        db.execute("SELECT 1")
        db_status = "connected"
    except Exception as e:
        db_status = f"disconnected: {e}"

    uptime_seconds = time.time() - APP_START_TIME

    return {
        "status": "online",
        "uptime_seconds": uptime_seconds,
        "cpu_percent": cpu_percent,
        "memory_percent": memory.percent,
        "memory_used_gb": round(memory.used / (1024**3), 2),
        "memory_total_gb": round(memory.total / (1024**3), 2),
        "disk_percent": disk.percent,
        "database": db_status
    }

@router.post("/backups/trigger")
async def trigger_backup(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    require_owner(user)

    try:
        pg_file = await backup_postgres()
        chroma_file = await backup_chromadb()
        
        message = f"Backup completed.\nPG: {pg_file}\nChroma: {chroma_file}"
        trigger_system_alert("info", message)
        
        return {"message": "Backup triggered successfully", "details": message}
    except Exception as e:
        trigger_system_alert("critical", f"Backup failed! {e}")
        raise HTTPException(status_code=500, detail="Backup failed")

@router.post("/alerts/test")
def test_alert(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    require_owner(user)
    
    trigger_system_alert("warning", "This is a test alert triggered by the Ops Dashboard.")
    return {"message": "Test alert dispatched"}
