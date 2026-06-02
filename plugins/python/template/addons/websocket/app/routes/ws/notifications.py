import jwt
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from fastapi.websockets import WebSocketState

from app.core.config import settings
from app.core.logging import get_logger
from app.services.notification_service import notification_manager

logger = get_logger(__name__)
router = APIRouter()


def _authenticate(token: str | None) -> dict | None:
    if not token:
        return None
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


@router.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket) -> None:
    token = websocket.query_params.get("token")
    payload = _authenticate(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = str(payload.get("sub", ""))
    await notification_manager.connect(user_id, websocket)
    logger.info(f"WebSocket connected: user_id={user_id}")

    try:
        while websocket.client_state == WebSocketState.CONNECTED:
            data = await websocket.receive_text()
            # Echo back as acknowledgement; extend here for command handling
            await websocket.send_json({"type": "ack", "data": data})
    except WebSocketDisconnect:
        pass
    finally:
        notification_manager.disconnect(user_id, websocket)
        logger.info(f"WebSocket disconnected: user_id={user_id}")
