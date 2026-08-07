<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Discord Clone</title>
    <style>
        :root {
            --bg-main: #313338;
            --bg-sidebar: #2b2d31;
            --bg-channels: #1e1f22;
            --bg-input: #383a40;
            --text-color: #f2f3f5;
            --text-muted: #949ba4;
            --accent-color: #5865f2;
            --border-color: #1f2023; /* Цвет разделительных полос */
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            user-select: none;
        }
        body {
            display: flex;
            height: 100vh;
            background-color: var(--bg-main);
            color: var(--text-color);
            overflow: hidden;
        }
        /* Левая панель серверов */
        .guilds-sidebar {
            width: 72px;
            background-color: var(--bg-channels);
            display: flex;
            flex-direction: column;
            align-items: center;
            padding-top: 12px;
            gap: 8px;
            border-right: 1px solid var(--border-color); /* Полоска-граница */
        }
        .guild-icon {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background-color: var(--bg-main);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s ease;
            color: var(--text-color);
        }
        .guild-icon:hover, .guild-icon.active {
            border-radius: 16px;
            background-color: var(--accent-color);
        }
        /* Панель каналов */
        .channels-sidebar {
            width: 240px;
            background-color: var(--bg-sidebar);
            display: flex;
            flex-direction: column;
            padding: 12px;
            gap: 2px;
            border-right: 1px solid var(--border-color); /* Полоска-граница */
        }
        .sidebar-header {
            font-size: 12px;
            text-transform: uppercase;
            font-weight: bold;
            color: var(--text-muted);
            margin-bottom: 8px;
            padding-left: 8px;
        }
        .user-item {
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: background 0.1s;
        }
        .user-item:hover, .user-item.active {
            background-color: rgba(255, 255, 255, 0.06);
            color: var(--text-color);
        }
        .user-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: var(--accent-color);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
        }
        /* Центральный чат */
        .chat-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            background-color: var(--bg-main);
            position: relative;
        }
        .chat-header {
            height: 48px;
            border-bottom: 1px solid var(--border-color); /* Полоска-граница */
            display: flex;
            align-items: center;
            padding: 0 16px;
            font-weight: bold;
            font-size: 16px;
        }
        .messages-container {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        .message {
            display: flex;
            gap: 16px;
            animation: fadeIn 0.15s ease-out;
            position: relative;
            padding: 4px 8px;
            border-radius: 4px;
        }
        .message:hover {
            background-color: rgba(0, 0, 0, 0.08);
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .message-content {
            display: flex;
            flex-direction: column;
            gap: 4px;
            flex: 1;
        }
        .message-author {
            font-weight: 600;
            font-size: 14px;
        }
        .message-text {
            font-size: 15px;
            color: #dbdee1;
            word-break: break-word;
            user-select: text;
        }
        .message-actions {
            display: none;
            position: absolute;
            right: 16px;
            top: -12px;
            background-color: var(--bg-sidebar);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .message:hover .message-actions {
            display: flex;
        }
        .action-btn {
            background: none;
            border: none;
            padding: 6px 10px;
            cursor: pointer;
            color: var(--text-muted);
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .action-btn:hover {
            background-color: rgba(255,255,255,0.05);
            color: #fff;
        }
        .action-btn.delete:hover {
            color: #f23f43;
        }
        .input-area {
            padding: 0 16px 24px 16px;
            background-color: transparent;
        }
        .input-wrapper {
            background-color: var(--bg-input);
            border-radius: 8px;
            display: flex;
            align-items: center;
            padding: 10px 16px;
            gap: 12px;
        }
        .message-input {
            flex: 1;
            background: none;
            border: none;
            outline: none;
            color: var(--text-color);
            font-size: 15px;
        }
        .message-input::placeholder {
            color: var(--text-muted);
        }
        .send-btn {
            background: none;
            border: none;
            cursor: pointer;
            color: var(--text-muted);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.1s;
        }
        .send-btn:hover {
            color: #fff;
        }
        .send-btn svg {
            width: 24px;
            height: 24px;
            fill: currentColor;
        }
        /* Правая панель настроек */
        .settings-sidebar {
            width: 220px;
            background-color: var(--bg-sidebar);
            border-left: 1px solid var(--border-color); /* Полоска-граница */
            padding: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
        }
        .settings-title {
            font-size: 13px;
            font-weight: bold;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: center;
        }
        .zone-select {
            width: 100%;
            padding: 8px;
            background-color: var(--bg-input);
            color: var(--text-color);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            outline: none;
            cursor: pointer;
        }
        .color-picker-wrapper {
            position: relative;
            width: 70px;
            height: 70px;
            cursor: pointer;
        }
        .color-picker-input {
            position: absolute;
            opacity: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
            z-index: 2;
        }
        .color-picker-circle {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 3px solid #fff;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            background: linear-gradient(45deg, red, orange, yellow, green, blue, purple);
        }
        .apply-btn {
            width: 100%;
            padding: 10px;
            background-color: var(--accent-color);
            color: white;
            border: none;
            border-radius: 4px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .apply-btn:hover {
            background-color: #4752c4;
        }
    </style>
</head>
<body>
    <div class="guilds-sidebar" id="guildsSidebar">
        <div class="guild-icon active">DM</div>
    </div>
    <div class="channels-sidebar" id="channelsSidebar">
        <div class="sidebar-header">Каналы</div>
        <div class="user-item active">
            <div class="user-avatar" style="background-color: #5865f2;">#</div>
            <span>общий-чат</span>
        </div>
    </div>
    <div class="chat-area" id="chatArea">
        <div class="chat-header">
            <span># общий-чат</span>
        </div>
        <div class="messages-container" id="messagesContainer"></div>
        <div class="input-area">
            <div class="input-wrapper">
                <input type="text" class="message-input" id="messageInput" placeholder="Напишите в общий-чат..." autocomplete="off">
                <button class="send-btn" id="sendBtn" title="Отправить">
                    <svg viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                </button>
            </div>
        </div>
    </div>
    <div class="settings-sidebar" id="settingsSidebar">
