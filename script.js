// === 1. ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И WEBRTC КОНФИГУРАЦИЯ ===
let myName = '';
let localStream = null;
let screenStream = null;
let peerConnection = null;
let currentChannelContext = 'general-chat';

// URL твоего Python-сервера (меняй localhost на IP своего сервера/хостинга при деплое)
const SERVER_URL = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000/ws/chat';
let socket = null;

const rtcConfig = { iceServers: [{ urls: 'stun:://google.com' }, { urls: 'stun:://google.com' }] };

// === 2. ФУНКЦИЯ АВТОРИЗАЦИИ (PYTHON API) ===
window.triggerManualAuth = async function() {
    const loginInput = document.getElementById('authLoginInput');
    const passwordInput = document.getElementById('authPasswordInput');
    if (!loginInput || !passwordInput) return;
    const login = loginInput.value.trim();
    const password = passwordInput.value.trim();
    if (!login || !password) { alert('Заполните все поля!'); return; }
    
    try {
        const response = await fetch(`${SERVER_URL}/api/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: login, password: password })
        });
        const data = await response.json();
        
        if (!data.success) {
            alert(data.message);
            return;
        }
        
        localStorage.setItem('chat_active_user', login);
        myName = login;
        document.getElementById('authModalOverlay')?.classList.remove('active');
        initChatAfterAuth();
    } catch (err) { console.error("ОШИБКА АВТОРИЗАЦИИ:", err); }
};

// === 3. ЖИВОЕ ПОДКЛЮЧЕНИЕ WEBSOCKET К PYTHON СЕРВЕРУ ===
function initWebSocket() {
    socket = new WebSocket(WS_URL);
    
    socket.onmessage = function(event) {
        const data = jsonParseSafe(event.data);
        if (!data) return;

        // При входе получаем всю историю сообщений из оперативной памяти Python
        if (data.type === 'history') {
            const container = document.getElementById('messagesContainer');
            if (container) container.innerHTML = '';
            data.messages.forEach(msg => appendMessage(msg.author, msg.text));
        }
        // Живой прилёт нового сообщения в чат за наносекунды
        else if (data.type === 'message') {
            appendMessage(data.author, data.text);
        }
        // Админка: обновление списка ожидающих юзеров в колокольчике dj1ka
        else if (data.type === 'pending_list_update' || data.type === 'new_pending_user') {
            updateAdminBell(data);
        }
        // WebRTC Сигналка: перехват сигналов трансляции экрана без базы данных
        else if (data.sender !== myName) {
            handleWebRTCSignals(data);
        }
    };

    socket.onclose = () => { setTimeout(initWebSocket, 2000); }; // Автоматический реконнект
}

function jsonParseSafe(str) { try { return JSON.parse(str); } catch(e) { return null; } }
document.addEventListener('DOMContentLoaded', () => {
    // Настройки интерфейса
    const openSettingsBtn = document.getElementById('openSettingsBtn'); const settingsSidebar = document.getElementById('settingsSidebar');
    if (openSettingsBtn && settingsSidebar) { openSettingsBtn.onclick = (e) => { e.stopPropagation(); settingsSidebar.classList.toggle('active'); }; }
    
    const goToAudioBtn = document.getElementById('goToAudioBtn'); const backToMenuFromAudioBtn = document.getElementById('backToMenuFromAudioBtn');
    const mainSettingsScreen = document.getElementById('mainSettingsScreen'); const audioSettingsScreen = document.getElementById('audioSettingsScreen');
    if (goToAudioBtn && mainSettingsScreen && audioSettingsScreen) { goToAudioBtn.onclick = (e) => { e.stopPropagation(); mainSettingsScreen.style.setProperty('display', 'none', 'important'); audioSettingsScreen.style.setProperty('display', 'flex', 'important'); }; }
    if (backToMenuFromAudioBtn && mainSettingsScreen && audioSettingsScreen) { backToMenuFromAudioBtn.onclick = (e) => { e.stopPropagation(); audioSettingsScreen.style.setProperty('display', 'none', 'important'); mainSettingsScreen.style.setProperty('display', 'flex', 'important'); }; }

    // Ползунки громкости 0-300%
    const micVolumeSlider = document.getElementById('micVolumeSlider'); const micVolValue = document.getElementById('micVolValue');
    if (micVolumeSlider && micVolValue) { micVolumeSlider.oninput = function() { micVolValue.textContent = this.value + '%'; }; }

    // ТВОЁ ТРЕБОВАНИЕ: СИМУЛЯЦИЯ СКАЧКОВ ПИНГА И СМЕНЫ АНТЕНН В САЙДБАРЕ
    setInterval(() => {
        const pingMsValue = document.getElementById('pingMsValue'); const pingRadarCircle = document.getElementById('pingRadarCircle');
        const pingStatusText = document.getElementById('pingStatusText'); const bars = document.querySelectorAll('.ping-bar');
        if (!pingMsValue || !bars.length) return;
        const randomPing = Math.floor(Math.random() * 290) + 10; pingMsValue.textContent = randomPing + 'ms';
        let color = '#23a55a'; let status = 'Голос подключен';
        if (randomPing <= 50) { color = '#23a55a'; status = 'Голос подключен'; } 
        else if (randomPing > 50 && randomPing <= 100) { color = '#f0b232'; status = 'Связь нестабильна'; } 
        else if (randomPing > 100 && randomPing <= 250) { color = '#f57c00'; status = 'Высокая задержка'; } 
        else { color = '#f23f43'; status = 'Плохое подключение'; }
        pingMsValue.style.color = color; pingMsValue.style.backgroundColor = color + '1a';
        if (pingRadarCircle) { pingRadarCircle.style.backgroundColor = color; pingRadarCircle.style.boxShadow = '0 0 8px ' + color; }
        if (pingStatusText) { pingStatusText.style.color = color; pingStatusText.textContent = status; }
        bars.forEach(bar => { bar.style.backgroundColor = color; });
    }, 3000);

    // Обработчики кнопок демки и каналов
    document.getElementById('startScreenBtn').onclick = async (e) => { e.stopPropagation(); await startScreenShare(); };
    document.getElementById('endCallBtn').onclick = async (e) => { e.stopPropagation(); await hangUpCall(); document.getElementById('videoCallZone').style.display = 'none'; };

    document.querySelectorAll('#serverChannelsList .custom-user-item').forEach(item => {
        item.onclick = async function(e) {
            e.stopPropagation();
            document.querySelectorAll('#serverChannelsList .custom-user-item').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            const channelType = this.getAttribute('data-type');
            if (channelType === 'voice') {
                document.getElementById('videoCallZone').style.display = 'flex';
                document.querySelector('.input-area').style.display = 'none';
                await startVoiceCall();
            } else {
                document.getElementById('videoCallZone').style.display = 'none';
                document.querySelector('.input-area').style.display = 'flex';
                await hangUpCall();
            }
        };
    });

    document.getElementById('sendBtn').onclick = handleSendMessage;
    document.getElementById('messageInput').onkeydown = (e) => { if (e.key === 'Enter') handleSendMessage(); };
    checkUserSession();
});

function initChatAfterAuth() {
    document.getElementById('topUserName').textContent = myName;
    document.getElementById('userAvatarHeader').textContent = myName.charAt(0).toUpperCase();
    initWebSocket();
}

function handleSendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim(); if (!text || !socket) return;
    socket.send(JSON.stringify({ type: 'message', author: myName, text: text }));
    input.value = '';
}

function appendMessage(author, text) {
    const area = document.getElementById('messagesContainer'); if (!area) return;
    const msg = document.createElement('div'); msg.className = 'message-item message';
    msg.innerHTML = `<div class="message-content"><span class="message-author">${author}:</span><span class="message-text">${text}</span></div>`;
    area.appendChild(msg); area.scrollTop = area.scrollHeight;
}

// === 5. WEBRTC НА PYTHON ВЕБСОКЕТАХ (МГНОВЕННЫЙ ОБМЕН ТРАНСЛЯЦИЕЙ БЕЗ МУСОРА) ===
async function startVoiceCall() {
    peerConnection = new RTCPeerConnection({});
    peerConnection.onicecandidate = (e) => { if (e.candidate && socket) socket.send(JSON.stringify({ type: 'webrtc_candidate', candidate: e.candidate, sender: myName })); };
    peerConnection.ontrack = (e) => { if (e.streams) document.getElementById('remoteVideo').srcObject = e.streams[0]; };
    
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
        const offer = await peerConnection.createOffer(); await peerConnection.setLocalDescription(offer);
        socket.send(JSON.stringify({ type: 'webrtc_offer', sdp: offer.sdp, sender: myName }));
    } catch(err) { console.warn("Вход без микрофона:", err); }
}

async function startScreenShare() {
    screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    document.getElementById('voiceAvatarPlaceholder').style.display = 'none';
    const video = document.getElementById('remoteVideo'); video.srcObject = screenStream; video.muted = true;
    screenStream.getVideoTracks()[0].onended = () => { video.srcObject = null; document.getElementById('voiceAvatarPlaceholder').style.display = 'flex'; };
}

function handleWebRTCSignals(data) {
    if (!peerConnection) peerConnection = new RTCPeerConnection({});
    if (data.type === 'webrtc_offer') {
        peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }))
            .then(() => peerConnection.createAnswer())
            .then(answer => { peerConnection.setLocalDescription(answer); socket.send(JSON.stringify({ type: 'webrtc_answer', sdp: answer.sdp, sender: myName })); });
    } else if (data.type === 'webrtc_answer') {
        peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
    } else if (data.type === 'webrtc_candidate') {
        peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
}

function hangUpCall() {
    if (localStream) localStream.getTracks().forEach(t => track.stop());
    if (screenStream) screenStream.getTracks().forEach(t => track.stop());
    if (peerConnection) peerConnection.close();
    peerConnection = null;
}

function updateAdminBell(data) {
    if (myName !== 'dj1ka') return;
    const bell = document.getElementById('bellDropdownPanel'); if (!bell) return;
    bell.innerHTML = '<h4 style="font-size:15px;color:#fff;text-align:center;padding:10px 0;border-bottom:1px solid #3f4147;">Запросы на вход</h4>';
    const users = data.users || [data.username];
    if (!users.length) { bell.innerHTML += '<div style="color:#949ba4;font-size:13px;text-align:center;padding:20px 0;">Заявок нет</div>'; return; }
    users.forEach(u => {
        const row = document.createElement('div'); row.style = "padding:10px 0; border-bottom:1px solid #3f4147;";
        row.innerHTML = `<div style="font-size:13px;color:#fff;">Юзер: <span style="color:#5865f2;">${u}</span></div><div style="display:flex;gap:8px;margin-top:6px;"><button onclick="sendAdminAction('${u}','approve')" style="flex:1;background:#23a55a;color:#fff;border:none;padding:4px;border-radius:4px;cursor:pointer;">Одобрить</button><button onclick="sendAdminAction('${u}','ban')" style="flex:1;background:#f23f43;color:#fff;border:none;padding:4px;border-radius:4px;cursor:pointer;">Бан</button></div>`;
        bell.appendChild(row);
    });
}

window.sendAdminAction = function(user, action) { if (socket) socket.send(JSON.stringify({ type: 'admin_action', target_user: user, action: action })); };

async function checkUserSession() {
    const savedUser = localStorage.getItem('chat_active_user');
    if (savedUser) { myName = savedUser; document.getElementById('authModalOverlay')?.classList.remove('active'); initChatAfterAuth(); }
    else { document.getElementById('authModalOverlay')?.classList.add('active'); }
}
