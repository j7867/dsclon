import asyncio
import json
import random
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Разрешаем фронтенду подключаться к нашему Python-серверу
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ЛОКАЛЬНАЯ БАЗА ДАННЫХ (В ОПЕРАТИВНОЙ ПАМЯТИ) ---
CREATOR_NICKNAME = "dj1ka"
users_db = {
    "dj1ka": {"password": "123", "status": "approved"} # Твой аккаунт одобрен по умолчанию
}
messages_db = [] # Хранилище сообщений чата
active_calls = {} # Хранилище WebRTC комнат звонков

# Хранилище активных WebSocket соединений онлайн-пользователей
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

# --- АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ (ЖЕСТКАЯ ЗАЩИТА PYTHON) ---
class AuthModel(BaseModel):
    username: str
    password: str

@app.post("/api/auth")
async def authenticate_user(data: AuthModel):
    username = data.username.strip()
    password = data.password.strip()
    
    if username in users_db:
        user = users_db[username]
        if user["password"] != password:
            return {"success": False, "message": "Неверный пароль!"}
        if user["status"] == "pending" and username != CREATOR_NICKNAME:
            return {"success": False, "message": "Ваша учётная запись ожидает одобрения администратором dj1ka!"}
        return {"success": True, "username": username, "status": user["status"]}
    else:
        # Новый юзер улетает в pending, админ — сразу в approved
        status = "approved" if username == CREATOR_NICKNAME else "pending"
        users_db[username] = {"password": password, "status": status}
        
        # Мгновенно пинаем админа по вебсокету, что пришёл новый челик
        if status == "pending":
            await manager.broadcast({"type": "new_pending_user", "username": username})
            return {"success": False, "message": "Регистрация успешна! Ожидайте одобрения от dj1ka."}
        
        return {"success": True, "username": username, "status": status}

# --- ЖИВОЙ ВЕБСОКЕТ-КАНАЛ ЧАТА И СИГНАЛКИ WEBRTC ---
@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # При входе сразу выгружаем историю сообщений текущему юзеру
        await websocket.send_json({"type": "history", "messages": messages_db})
        
        while True:
            data = await websocket.receive_json()
            
            # 1. Обработка отправки нового сообщения
            if data["type"] == "message":
                new_msg = {"author": data["author"], "text": data["text"]}
                messages_db.append(new_msg)
                # Вещаем сообщение абсолютно всем онлайн-пользователям мгновенно
                await manager.broadcast({"type": "message", **new_msg})
                
            # 2. Обработка админки (Одобрение / Бан через колокольчик)
            elif data["type"] == "admin_action":
                target = data["target_user"]
                action = data["action"] # "approve" или "ban"
                if target in users_db:
                    if action == "approve":
                        users_db[target]["status"] = "approved"
                    elif action == "ban":
                        del users_db[target]
                # Рассылаем админское обновление списка заявок
                pending_list = [u for u, d in users_db.items() if d["status"] == "pending"]
                await manager.broadcast({"type": "pending_list_update", "users": pending_list})

            # 3. WebRTC Сигнальный сервер для звонков (Пересылка Offer/Answer в памяти)
            elif data["type"] in ["webrtc_offer", "webrtc_answer", "webrtc_candidate"]:
                # Python перекидывает медиа-сигналы между браузерами за наносекунды
                await manager.broadcast(data)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
