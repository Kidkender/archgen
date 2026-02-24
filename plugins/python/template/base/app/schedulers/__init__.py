from app.schedulers.example_job import ExampleJob

# List all schedulers
schedulers = [
    ExampleJob(),
]

def start_schedulers():
    """Start all background schedulers"""
    for scheduler in schedulers:
        scheduler.start()

def stop_schedulers():
    """Stop all background schedulers"""
    for scheduler in schedulers:
        scheduler.shutdown()

__all__ = ["start_schedulers", "stop_schedulers"]
