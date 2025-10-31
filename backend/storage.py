import json
from datetime import datetime
from pathlib import Path

class Storage:
    def __init__(self, db_file="threats.json"):
        self.db_file = Path(db_file)
        self.threats = self.load()
    
    def load(self):
        
        if self.db_file.exists():
            try:
                with open(self.db_file, 'r') as f:
                    self.threats = json.load(f)
            except:
                self.threats = []
        else:
            self.threats = []
        return self.threats
    
    def save(self):
       
        try:
            with open(self.db_file, 'w') as f:
                json.dump(self.threats, f, indent=2)
        except Exception as e:
            print(f"Storage save error: {e}")
    
    def add_threat(self, **threat_data):

        threat = {
            "id": len(self.threats) + 1,
            "time": datetime.now().isoformat(),
            **threat_data
        }
        self.threats.insert(0, threat)  # Add to beginning
        self.save()
        return threat
    
    def get_threats(self, limit=50):
        return self.threats[:limit]
    
    def get_stats(self):
        
        return {
            "total": len(self.threats),
            "critical": sum(1 for t in self.threats if t.get("risk") == "CRITICAL"),
            "high": sum(1 for t in self.threats if t.get("risk") == "HIGH")
        }
    
    def clear(self):
        """Clear all threats"""
        self.threats = []
        self.save()
