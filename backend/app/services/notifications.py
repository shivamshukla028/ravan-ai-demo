import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

def send_email_alert(subject: str, message: str, to_email: str = None):
    """
    Sends an email alert. 
    In development, this prints to the console if SMTP credentials are missing.
    """
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    from_email = os.getenv("SMTP_FROM_EMAIL", "alerts@ravan.ai")
    
    if not to_email:
        to_email = os.getenv("ADMIN_EMAIL", "admin@ravan.ai")

    if not smtp_server or not smtp_user:
        print(f"--- MOCK EMAIL ALERT ---")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Message: {message}")
        print(f"------------------------")
        return True

    try:
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(message, 'plain'))

        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email alert: {e}")
        return False

def trigger_system_alert(level: str, details: str):
    """Hooks for Slack/Discord/Email alerting"""
    subject = f"[{level.upper()}] Ravan AI System Alert"
    send_email_alert(subject, details)
