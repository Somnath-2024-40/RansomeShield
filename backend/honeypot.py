from pathlib import Path


class HoneypotManager:
    def __init__(self):
        self.honeypot_files = set()
        self.honeypot_dirs = {}

        self.decoy_names = [
            'passwords.txt',
            'credit_cards.csv',
            'bitcoin_wallet.dat',
            'confidential_2025.docx',
            'financial_data.xlsx',
            'employee_ssn.csv',
            'database_backup.sql',
            'private_keys.pem',
            'company_secrets.pdf',
            'admin_credentials.txt'
        ]

    def deploy(self, directory, count=10):

        directory = directory.strip()  # REMOVE LEADING/TRAILING SPACES
        """Deploy honeypot files"""
        honeypot_dir = Path(directory) / '.ransomshield_honeypots'
        honeypot_dir.mkdir(exist_ok=True)

        deployed = 0

        for name in self.decoy_names[:count]:
            file_path = honeypot_dir / name

            try:
                # Create decoy file with enticing content
                with open(file_path, 'w') as f:
                    f.write(f"HONEYPOT DECOY FILE - DO NOT MODIFY\n")
                    f.write(f"This is a trap file for ransomware detection.\n")
                    f.write(f"File: {name}\n")
                    f.write(("X" * 50 + "\n") * 20)  # Padding

                # Track honeypot
                self.honeypot_files.add(str(file_path))
                deployed += 1

            except Exception as e:
                print(f"Failed to create honeypot {name}: {e}")

        self.honeypot_dirs[directory] = str(honeypot_dir)

        return {
            'success': True,
            'count': deployed,
            'directory': str(honeypot_dir)
        }

    def is_honeypot(self, file_path):
        """Check if file is a honeypot"""
        return str(file_path) in self.honeypot_files

    def cleanup(self, directory):
        """Remove honeypots for directory"""
        if directory in self.honeypot_dirs:
            honeypot_dir = Path(self.honeypot_dirs[directory])
            if honeypot_dir.exists():
                import shutil
                shutil.rmtree(honeypot_dir, ignore_errors=True)
            del self.honeypot_dirs[directory]

    def get_count(self):
        """Get total honeypot count"""
        return len(self.honeypot_files)
