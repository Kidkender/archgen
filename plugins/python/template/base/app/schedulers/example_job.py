from datetime import datetime

from app.core.logging import get_logger
from app.schedulers.base_scheduler import BaseScheduler

logger = get_logger(__name__)

class ExampleJob(BaseScheduler):
    """Example background job"""

    def __init__(self):
        super().__init__()

        self.scheduler.add_job(
            self.execute,
            'interval',
            minutes=2,
            id='example_job'
        )

    async def execute(self):
        """Execute the job"""
        logger.info(f"Example job executed at {datetime.now()}")
