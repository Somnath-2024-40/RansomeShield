



from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import time

from detector import ThreatDetector
from monitor import FileMonitor
from backup import BackupManager
from honeypot import HoneypotManager
from killer import ProcessKiller
from storage import Storage
from alerts import AlertSystem

app = FastAPI(title="RansomShield Pro", version="2.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
storage = Storage()
detector = ThreatDetector()
monitor = FileMonitor()
backup_manager = BackupManager()
honeypot_manager = HoneypotManager()
killer = ProcessKiller()
alerts = AlertSystem()

# Track recent changes for mass encryption detection
recent_changes = []


def threat_callback(file_path):
    """Handle file change events"""
    global recent_changes

    print(f"\n{'=' * 50}")
    print(f"📂 New File: {file_path}")
    print(f"{'=' * 50}")

    try:
        # Check if it's a honeypot
        if honeypot_manager.is_honeypot(file_path):
            print(f"🍯 HONEYPOT TRAP TRIGGERED!")
            print(f"⚡ Stopping attack...")

            storage.add_threat({
                'file': file_path,
                'reason': 'HONEYPOT_VIOLATION',
                'risk': 'CRITICAL',
                'score': 0.99,
                'action': 'Attack stopped'
            })

            killed = killer.kill_by_file(file_path)
            print(f"✅ Attack blocked! ({len(killed)} processes stopped)")
            alerts.send_alert('CRITICAL', f'Honeypot violated: {file_path}')
            print(f"{'=' * 50}\n")
            return

        # Scan the file
        print(f"🔍 Scanning file...")
        result = detector.scan_file(file_path)

        if result['threat']:
            print(f"⚠️  THREAT DETECTED!")
            print(f"   Type: {result['risk']}")
            print(f"   Reason: {result['reason']}")

            # Create backup
            backup_path = backup_manager.create_backup(file_path)
            print(f"💾 Backup saved")

            # Save to database
            storage.add_threat({
                'file': file_path,
                'reason': result['reason'],
                'risk': result['risk'],
                'score': result['score'],
                'backup': backup_path
            })

            # Stop the attack if critical
            if result['risk'] == 'CRITICAL':
                killed = killer.kill_by_file(file_path)
                print(f"🛑 Attacker stopped!")
                alerts.send_alert('CRITICAL', f'Critical threat: {file_path}')
        else:
            print(f"✅ Clean file")

        # Check for mass attack
        recent_changes.append({'file': file_path, 'time': time.time()})
        recent_changes = [c for c in recent_changes if time.time() - c['time'] < 60]

        if len(recent_changes) > 20:
            print(f"🚨 MASS ATTACK DETECTED! ({len(recent_changes)} files)")
            storage.add_threat({
                'file': 'MULTIPLE_FILES',
                'reason': 'MASS_ENCRYPTION_DETECTED',
                'risk': 'CRITICAL',
                'score': 0.98,
                'count': len(recent_changes)
            })
            alerts.send_alert('CRITICAL', f'Mass attack: {len(recent_changes)} files')

        print(f"{'=' * 50}\n")

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print(f"{'=' * 50}\n")




class MonitorRequest(BaseModel):
    directory: str


class ScanRequest(BaseModel):
    file_path: str


class AlertConfig(BaseModel):
    email: Optional[str] = None
    enabled: bool = True


@app.get("/")
async def serve_dashboard():
    """Serve the dashboard HTML"""
    return FileResponse("../frontend/index.html")


@app.get("/api/status")
async def api_status():
    """API status endpoint"""
    return {
        "name": "RansomShield ",
        "version": "1.0",
        "status": "running"
    }


@app.post("/api/monitor/start")
async def start_monitoring(req: MonitorRequest):
    directory = req.directory.strip()

    print(f"\n🚀 Protection started: {directory}")

    # Deploy honeypots
    honeypot_result = honeypot_manager.deploy(directory)
    print(f"🍯 {honeypot_result['count']} traps deployed")

    # Start monitoring
    success = monitor.start(directory, threat_callback)

    if success:
        print(f"✅ Monitoring active\n")
    else:
        print(f"❌ Failed to start\n")

    return {
        "success": success,
        "directory": directory,
        "honeypots": honeypot_result['count']
    }


@app.post("/api/monitor/stop")
async def stop_monitoring(req: MonitorRequest):
    print(f"\n⏹️  Protection stopped: {req.directory}\n")
    monitor.stop(req.directory)
    honeypot_manager.cleanup(req.directory)
    return {"success": True}


@app.get("/api/monitor/status")
async def monitor_status():
    return {
        "active": monitor.is_active(),
        "directories": monitor.get_monitored()
    }


@app.post("/api/scan")
async def scan_file(req: ScanRequest):
    result = detector.scan_file(req.file_path)

    return {
        "file": req.file_path,
        "entropy_scan": result,
        "verdict": "THREAT" if result['threat'] else "CLEAN"
    }


@app.get("/api/threats")
async def get_threats(limit: int = 50):
    return storage.get_threats(limit)


@app.get("/api/stats")
async def get_stats():
    threats = storage.get_threats(100)
    backup_stats = backup_manager.get_stats()

    return {
        "total_threats": len(threats),
        "critical": sum(1 for t in threats if t['risk'] == 'CRITICAL'),
        "high": sum(1 for t in threats if t['risk'] == 'HIGH'),
        "monitoring": monitor.is_active(),
        "directories_monitored": len(monitor.get_monitored()),
        "honeypots_active": honeypot_manager.get_count(),
        "backups_created": backup_stats['count'],
        "backup_size_mb": backup_stats['size_mb'],
        "processes_killed": killer.get_kill_count()
    }


@app.get("/api/report")
async def generate_report():
    threats = storage.get_threats(100)
    critical = [t for t in threats if t['risk'] == 'CRITICAL']

    return {
        "report_id": f"INC-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
        "generated": datetime.now().isoformat(),
        "summary": {
            "total_threats": len(threats),
            "critical_threats": len(critical),
            "files_protected": backup_manager.get_stats()['count'],
            "attack_vectors": list(set(t['reason'] for t in threats)),
            "first_detection": threats[-1]['time'] if threats else None,
            "latest_detection": threats[0]['time'] if threats else None
        },
        "threat_timeline": threats[:20],
        "critical_incidents": critical[:10],
        "recommendations": [
            "Immediately isolate affected systems from network",
            "Run full system antivirus scan",
            "Change all user passwords",
            "Contact IT security team or forensics expert",
            "Review and restore from backups if necessary",
            "File incident report with relevant authorities"
        ],
        "system_status": {
            "monitoring_active": monitor.is_active(),
            "honeypots_deployed": honeypot_manager.get_count(),
            "backup_capacity": backup_manager.get_stats()
        }
    }


@app.post("/api/alerts/config")
async def configure_alerts(config: AlertConfig):
    alerts.configure(config.email, config.enabled)
    return {"success": True}


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "components": {
            "detector": "ok",
            "monitor": "active" if monitor.is_active() else "inactive"
        }
    }


if __name__ == "__main__":
    import uvicorn

    print("\n" + "=" * 50)
    print("🛡️  RANSOMSHIELD - Ransomware Protection")
    print("=" * 50)
    print("📊 Dashboard: http://localhost:8000")
    print("=" * 50 + "\n")

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
