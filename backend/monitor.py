from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from pathlib import Path

class FileMonitor:
    def __init__(self):
        self.observers = {}
    def start(self, directory, callback):
        """Start monitoring directory"""
        directory = directory.strip()
        if directory in self.observers:
            return False
        try:
            handler = FileEventHandler(callback)
            observer = Observer()
            observer.schedule(handler, directory, recursive=True)
            observer.start()
            self.observers[directory] = observer
            return True
        except Exception as e:
            print(f"Error starting monitor: {e}")
            return False
    def stop(self, directory):
        """Stop monitoring directory"""
        if directory in self.observers:
            self.observers[directory].stop()
            self.observers[directory].join()
            del self.observers[directory]
    def stop_all(self):
        """Stop all monitors"""
        for directory in list(self.observers.keys()):
            self.stop(directory)
    def is_active(self):
        """Check if any monitoring is active"""
        return len(self.observers) > 0
    def get_monitored(self):
        """Get list of monitored directories"""
        return list(self.observers.keys())
class FileEventHandler(FileSystemEventHandler):
    def __init__(self, callback):
        self.callback = callback
        self.processing = set()
        print("✅ File handler initialized!")
    def on_created(self, event):
        if not event.is_directory and event.src_path not in self.processing:
            print(f"📁 FILE CREATED: {event.src_path}")
            self.processing.add(event.src_path)
            try:
                self.callback(event.src_path)
            finally:
                self.processing.discard(event.src_path)
    def on_modified(self, event):
        if not event.is_directory and event.src_path not in self.processing:
            print(f"📝 FILE MODIFIED: {event.src_path}")
            self.processing.add(event.src_path)
            try:
                self.callback(event.src_path)
            finally:
                self.processing.discard(event.src_path)
