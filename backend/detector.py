import math
from collections import Counter
from pathlib import Path
import os


class ThreatDetector:
    def __init__(self):
        # Suspicious extensions
        self.bad_extensions = [
            '.encrypted', '.locked', '.crypto', '.wannacry', '.locky',
            '.cerber', '.ryuk', '.maze', '.egregor', '.darkside',
            '.revil', '.conti', '.lockbit', '.blackcat','.wannacry'
        ]
        # Safe extensions (whitelist)
        self.safe_extensions = [
            '.jpg', '.jpeg', '.png', '.gif', '.bmp',
            '.mp3', '.mp4', '.avi', '.mkv',
            '.zip', '.rar', '.7z', '.tar', '.gz',
            '.pdf', '.doc', '.docx'
        ]
        # DEBUG: Print on startup
        print(f"🔍 BAD EXTENSIONS: {self.bad_extensions}")
        print(f"✅ SAFE EXTENSIONS: {self.safe_extensions}")
        self.entropy_threshold = 7.5
        self.high_entropy_threshold = 7.8
    def calculate_entropy(self, data):
        """Calculate Shannon entropy"""
        if not data or len(data) < 100:
            return 0.0
        # Count byte frequencies
        byte_counts = Counter(data)
        entropy = 0.0
        data_len = len(data)
        for count in byte_counts.values():
            probability = count / data_len
            entropy -= probability * math.log2(probability)
        return round(entropy, 2)
    def scan_file(self, file_path):
        """Comprehensive file threat scan"""
        result = {
            'file': file_path,
            'threat': False,
            'reason': 'Clean',
            'risk': 'NONE',
            'score': 0.0,
            'details': {}
        }
        try:
            path = Path(file_path)
            # Skip if file doesn't exist
            if not path.exists():
                return result
            # Get file info
            file_size = path.stat().st_size
            ext = path.suffix.lower()
            print(f"   DEBUG: Extension = '{ext}'")
            print(f"   DEBUG: File size = {file_size} bytes")
            print(f"   DEBUG: In bad_extensions? {ext in self.bad_extensions}")
            # ✅ CHECK BAD EXTENSIONS FIRST (before any size checks!)
            if ext in self.bad_extensions:
                print(f"   ⚠️ CRITICAL THREAT: Ransomware extension!")
                result['threat'] = True
                result['reason'] = f'Ransomware extension: {ext}'
                result['risk'] = 'CRITICAL'
                result['score'] = 0.95
                result['details']['extension_match'] = ext
                return result
            # Double extension check
            if len(path.suffixes) > 1:
                last_ext = path.suffixes[-1].lower()
                if last_ext in self.bad_extensions:
                    result['threat'] = True
                    result['reason'] = f'Double extension: {"".join(path.suffixes)}'
                    result['risk'] = 'CRITICAL'
                    result['score'] = 0.90
                    result['details']['double_extension'] = path.suffixes
                    return result
            # NOW check file size
            if file_size > 100 * 1024 * 1024:
                result['details']['skipped'] = 'File too large'
                return result
            if file_size < 100:
                result['details']['skipped'] = 'File too small'
                return result
            # Whitelist check
            if ext in self.safe_extensions:
                result['details']['whitelisted'] = True
                return result
            # Read file for entropy analysis
            with open(file_path, 'rb') as f:
                data = f.read(8192)
            if not data:
                return result
            # Calculate entropy
            entropy = self.calculate_entropy(data)
            result['details']['entropy'] = entropy
            # Very high entropy - CRITICAL
            if entropy > self.high_entropy_threshold:
                result['threat'] = True
                result['reason'] = f'Very high entropy: {entropy}'
                result['risk'] = 'CRITICAL'
                result['score'] = min(entropy / 8.0, 1.0)
                return result
            # High entropy - HIGH risk
            if entropy > self.entropy_threshold:
                result['threat'] = True
                result['reason'] = f'High entropy: {entropy}'
                result['risk'] = 'HIGH'
                result['score'] = entropy / 8.0
                return result
            # Check null byte ratio
            null_ratio = data.count(b'\x00') / len(data)
            if null_ratio > 0.4:
                result['threat'] = True
                result['reason'] = f'Suspicious null byte ratio: {null_ratio:.2%}'
                result['risk'] = 'MEDIUM'
                result['score'] = null_ratio
                result['details']['null_ratio'] = null_ratio
                return result
            # Check byte diversity
            unique_bytes = len(set(data))
            diversity = unique_bytes / 256
            result['details']['byte_diversity'] = diversity
            if diversity > 0.8 and entropy > 7.0:
                result['threat'] = True
                result['reason'] = f'High byte diversity + elevated entropy'
                result['risk'] = 'MEDIUM'
                result['score'] = (diversity + entropy / 8.0) / 2
                return result
            return result
        except PermissionError:
            result['details']['error'] = 'Permission denied'
            return result
        except Exception as e:
            result['details']['error'] = str(e)
            return result

