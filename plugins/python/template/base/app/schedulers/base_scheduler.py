from abc import ABC, abstractmethod

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.logging import get_logger

logger = get_logger(__name__)
class BaseScheduler(ABC):
    """Base class for background schedulers"""

    def __init__(self):
        self.scheduler = AsyncIOScheduler()

    @abstractmethod
    async def execute(self):
        """Execute the scheduler"""
        pass

    def start(self):
        """Start the scheduler"""
        self.scheduler.start()
        logger.info(f"{self.__class__.__name__} started")

    def shutdown(self):
        """Shutdown the scheduler"""
        self.scheduler.shutdown()
        logger.info(f"{self.__class__.__name__} stopped")
