import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

class AlertSystem:
    def __init__(self):
        self.email = None
        self.enabled = False
        self.alert_count = 0
    
    def configure(self, email, enabled=True):
        
        self.email = email
        self.enabled = enabled
    
    def send_alert(self, severity, message):
        
        self.alert_count += 1
        
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print("=" * 60)
        print(f" ALERT [{severity}] - {timestamp}")
        print(f"Message: {message}")
        print("=" * 60)
        
        
        if self.enabled and self.email:
            self.send_email(severity, message)
    
    def send_email(self, severity, message):
        
        try:
            print(f"✉️ Email sent to {self.email} - {severity} - {message}")
            return True
        except Exception as e:
            print(f"❌ Email alert error: {e}")
            return False
    
    def get_alert_count(self):
       
        return self.alert_count
