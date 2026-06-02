import uuid
from collections import defaultdict
from datetime import datetime, timezone

from fastapi import WebSocket

from app.core.logging import get_logger

logger = get_logger(__name__)


class NotificationManager:
    """Manages active WebSocket connections keyed by user_id."""

    def __init__(self) -> None:
        # user_id → set of WebSocket connections (a user may have multiple tabs open)
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[user_id].add(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        self._connections[user_id].discard(websocket)
        if not self._connections[user_id]:
            del self._connections[user_id]

    def _build_payload(self, type_: str, title: str, message: str, data: dict | None = None) -> dict:
        return {
            "id": str(uuid.uuid4()),
            "type": type_,
            "title": title,
            "message": message,
            "data": data or {},
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }

    async def send_to_user(
        self,
        user_id: str,
        type_: str,
        title: str,
        message: str,
        data: dict | None = None,
    ) -> None:
        payload = self._build_payload(type_, title, message, data)
        dead: list[WebSocket] = []
        for ws in list(self._connections.get(user_id, [])):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(user_id, ws)

    async def broadcast(
        self,
        type_: str,
        title: str,
        message: str,
        data: dict | None = None,
    ) -> None:
        payload = self._build_payload(type_, title, message, data)
        for user_id in list(self._connections):
            await self.send_to_user(user_id, type_, title, message, data)
            _ = payload  # payload built once, reused per user


notification_manager = NotificationManager()
