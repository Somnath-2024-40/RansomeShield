import shutil
from pathlib import Path
import time
from datetime import datetime

class BackupManager:
    def __init__(self, backup_dir="backups", max_size_mb=500):
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(exist_ok=True)
        self.max_size_mb = max_size_mb
    
    def get_size_mb(self):

        total = sum(f.stat().st_size for f in self.backup_dir.rglob('*') if f.is_file())

        return round(total / 1024 / 1024, 2)
    
    def create_backup(self, filepath):

        try:
            source = Path(filepath)
            if not source.exists():
                return None


        
            current_size = self.get_size_mb()
            if current_size > self.max_size_mb:
                self.cleanup_old_backups()
            
          
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_name = f"{source.stem}_{timestamp}{source.suffix}"
            backup_path = self.backup_dir / backup_name
            
            
            shutil.copy2(source, backup_path)
            return str(backup_path)
        
        except Exception as e:
            print(f"Backup error: {e}")
            return None
    
    def cleanup_old_backups(self, keep_count=50):
        backups = sorted(self.backup_dir.glob('*'), key=lambda f: f.stat().st_mtime)
        
        for backup in backups[:-keep_count]:
            try:
                backup.unlink()
            except:
                pass
    
    def get_stats(self):
        
        backups = list(self.backup_dir.glob('*'))
        return {
            'count': len(backups),
            'size_mb': self.get_size_mb(),
            'limit_mb': self.max_size_mb
        }
    
    def list_backups(self):
        
        backups = []
        for f in sorted(self.backup_dir.glob('*'), key=lambda x: x.stat().st_mtime, reverse=True):
            backups.append({
                'name': f.name,
                'size': f.stat().st_size,
                'created': datetime.fromtimestamp(f.stat().st_mtime).isoformat()
            })
        return backups

