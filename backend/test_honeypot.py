import os
import time
import sys

target_dir = sys.argv[1] if len(sys.argv) > 1 else "D:\\test_ransomware\\demo_files"

print("\n" + "="*60)
print("🍯 HONEYPOT TRAP TEST - RANSOMWARE DETECTION")
print("="*60)
print(f"\n📂 Target Directory: {target_dir}\n")

# List of dangerous extensions that ransomware uses
honeypot_extensions = ['.encrypted', '.locked', '.crypto', '.wannacry', '.cerber', '.ryuk', '.egregor']

print("Creating honeypot files with dangerous extensions...")
print("(These will trigger INSTANT process termination)\n")

try:
    files_created = 0
    
    for ext in honeypot_extensions:
        try:
            file_path = os.path.join(target_dir, f"honeypot_trap{ext}")
            
            # Create the honeypot file
            with open(file_path, 'w') as f:
                f.write("This is a honeypot file - system trap!")
            
            print(f"   🍯 Created: honeypot_trap{ext}")
            files_created += 1
            time.sleep(0.5)
            
        except Exception as e:
            print(f"   ❌ Failed to create honeypot{ext}: {str(e)}")
    
    print(f"\n✅ {files_created} honeypot files created!")
    print("\n🛑 If system is running, process should be KILLED now...")
    print("   Waiting for system to detect and terminate...\n")
    
    # Keep running to show system detection
    print("Honeypot test active. Waiting to be killed by RansomShield...")
    while True:
        time.sleep(1)

except KeyboardInterrupt:
    print("\n\n⏹️  Honeypot test stopped by user")
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
