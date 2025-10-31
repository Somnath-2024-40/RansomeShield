import psutil
class ProcessKiller:
    def __init__(self):
        self.kill_count = 0
        self.killed_processes = []
    def kill_by_file(self, file_path):
        """Kill process that has file open"""
        killed = []
        try:
            for proc in psutil.process_iter(['pid', 'name', 'exe']):
                try:
                    # Check if process has file open
                    for f in proc.open_files():
                        if file_path in f.path:
                            proc_info = {
                                'pid': proc.pid,
                                'name': proc.name(),
                                'exe': proc.exe()
                            }
                            print(f"🔪 Killing malicious process: {proc.name()} (PID: {proc.pid})")
                            proc.kill()
                            killed.append(proc_info)
                            self.kill_count += 1
                            self.killed_processes.append(proc_info)
                            break
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    continue
        except Exception as e:
            print(f"Process killer error: {e}")
        return killed
    def get_kill_count(self):
        """Get total processes killed"""
        return self.kill_count
    def get_killed_processes(self):
        """Get list of killed processes"""
        return self.killed_processes
