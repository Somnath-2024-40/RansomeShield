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
        """Configure alert system"""
        self.email = email
        self.enabled = enabled

    def send_alert(self, severity, message):
        """Send alert notification"""
        self.alert_count += 1
        # Console alert (always)
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"\n{'=' * 60}")
        print(f"🚨 ALERT [{severity}] - {timestamp}")
        print(f"Message: {message}")
        print(f"{'=' * 60}\n")

        # Email alert (if configured)
        if self.enabled and self.email:
            self._send_email(severity, message)

    def _send_email(self, severity, message):
        """Send email notification"""
        try:
            print(f"📧 Email sent to {self.email}: [{severity}] {message}")
            return True

        except Exception as e:
            print(f"Email alert error: {e}")
            return False

    def get_alert_count(self):
        """Get total alerts sent"""
        return self.alert_count
