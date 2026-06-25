import os
import subprocess
import shutil
from datetime import datetime
import asyncio

BACKUP_DIR = os.path.join(os.getcwd(), "backups")

def ensure_backup_dir():
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)

async def backup_postgres():
    """Run pg_dump via subprocess. Requires pg_dump to be in PATH."""
    ensure_backup_dir()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        print("DATABASE_URL not found, skipping PG backup.")
        return None

    filename = os.path.join(BACKUP_DIR, f"pg_backup_{timestamp}.sql")
    
    try:
        # Note: In production, never put credentials in raw subprocess without env masking,
        # but for this script we pass db_url directly to pg_dump.
        process = await asyncio.create_subprocess_exec(
            "pg_dump", db_url, "-f", filename,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        
        if process.returncode == 0:
            return filename
        else:
            print(f"Postgres backup failed: {stderr.decode()}")
            return None
    except Exception as e:
        print(f"Exception during pg backup: {e}")
        return None

async def backup_chromadb():
    """Zips the local chroma_db directory."""
    ensure_backup_dir()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    chroma_path = os.path.join(os.getcwd(), "chroma_db")
    
    if not os.path.exists(chroma_path):
        print("chroma_db folder not found, skipping backup.")
        return None

    archive_name = os.path.join(BACKUP_DIR, f"chromadb_backup_{timestamp}")
    
    try:
        # make_archive creates .zip automatically
        result_path = shutil.make_archive(archive_name, 'zip', chroma_path)
        return result_path
    except Exception as e:
        print(f"Exception during chroma backup: {e}")
        return None

async def run_full_backup():
    """Triggered by cron or manual hook"""
    pg_file = await backup_postgres()
    chroma_file = await backup_chromadb()
    return {"postgres": pg_file, "chromadb": chroma_file}
