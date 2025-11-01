import os
import time
import sys
import psutil


target_dir = sys.argv[1] if len(sys.argv) > 1 else "D:\\test_ransomware\\demo_files"

print("\n" + "="*60)
print("🍯 HONEYPOT TRAP TEST - RANSOMWARE DETECTION")
print("="*60)
print(f"\n📂 Target Directory: {target_dir}\n")

# Dangerous extensions
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
    
    print(f"\n {files_created} honeypot files created!")
    print("\n Waiting for RansomShield to detect and kill this process...\n")
    
    # Get current process
    current_process = psutil.Process()
    current_pid = current_process.pid
    
    print(f" Current Process:")
    print(f"   Name: {current_process.name()}")
    print(f"   PID: {current_pid}")
    print(f"   Status: RUNNING ✅\n")
    
    # Wait and check if process is still alive
    print(" Monitoring... (waiting for kill signal)\n")
    
    start_time = time.time()
    check_count = 0
    
    while True:
        check_count += 1
        elapsed = time.time() - start_time
        
        # Check every 1 second
        print(f"[{elapsed:.1f}s] Process still running... (Check #{check_count})")
        
        # If running for more than 10 seconds without kill, system might not be running
        if elapsed > 10:
            print("\n  WARNING: System did NOT kill process after 10 seconds!")
            print("   Possible reasons:")
            print("   1. RansomShield is NOT running")
            print("   2. RansomShield is not monitoring this directory")
            print("   3. Honeypot detection not configured")
            print("\n   ✅ TO FIX: Start your app.py in another terminal first!")
            break
        
        time.sleep(1)

except psutil.NoSuchProcess:
    print("\n SUCCESS! PROCESS WAS KILLED!")
    print("    RansomShield detected and terminated this process")
    print("    Honeypot trap worked!")

except KeyboardInterrupt:
    print("\n\n  Honeypot test stopped by user (not killed by system)")

except Exception as e:
    print(f"\n❌ Error: {str(e)}")

print("\n" + "="*60)
