import json
import logging
from typing import Dict, List, Set, Any
from fastapi import WebSocket

logger = logging.getLogger("neroute.ws")

class ConnectionManager:
    def __init__(self):
        # channel -> set of websockets
        self.active_connections: Dict[str, Set[WebSocket]] = {
            "vehicles": set(),
            "incidents": set(),
            "alerts": set(),
            "network": set(),
            "all": set()
        }

    async def connect(self, websocket: WebSocket, channel: str = "all"):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = set()
        self.active_connections[channel].add(websocket)
        self.active_connections["all"].add(websocket)
        logger.info(f"WebSocket client connected to channel: {channel}. Total in channel: {len(self.active_connections[channel])}")

    def disconnect(self, websocket: WebSocket, channel: str = "all"):
        if channel in self.active_connections and websocket in self.active_connections[channel]:
            self.active_connections[channel].remove(websocket)
        if websocket in self.active_connections["all"]:
            self.active_connections["all"].remove(websocket)
        logger.info(f"WebSocket client disconnected from channel: {channel}")

    async def broadcast(self, channel: str, message_type: str, data: Any):
        payload = json.dumps({
            "channel": channel,
            "type": message_type,
            "data": data
        }, default=str)

        targets = set()
        if channel in self.active_connections:
            targets.update(self.active_connections[channel])
        if channel != "all":
            targets.update(self.active_connections["all"])

        disconnected = []
        for connection in targets:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"Error sending websocket message: {e}")
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn, channel)

ws_manager = ConnectionManager()
