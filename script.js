window.triggerManualAuth = async function() {
    const loginInput = document.getElementById('authLoginInput');
    const passwordInput = document.getElementById('authPasswordInput');
    if (!loginInput || !passwordInput) return;
    const login = loginInput.value.trim();
    const password = passwordInput.value.trim();
    if (!login || !password) { alert('Заполните все поля!'); return; }
    try {
        const userRef = db.collection("users").doc(login);
        const userSnap = await userRef.get();
        if (userSnap.exists) {
            const userData = userSnap.data();
            if (userData.password !== password) { alert('Неверный пароль!'); return; }
        } else {
            const initialStatus = (login === CREATOR_NICKNAME) ? 'approved' : 'pending';
            await userRef.set({ username: login, password: password, status: initialStatus });
        }
        localStorage.setItem('chat_active_user', login);
        myName = login;
        const overlay = document.getElementById('authModalOverlay');
        if (overlay) overlay.classList.remove('active');
        initChatAfterAuth();
    } catch (err) { console.error(err); }
};

let deleteTimeout = null; let deleteInterval = null;
function initiateMessageDelete(messageElement) {
    const panel = document.getElementById('deleteConfirmPanel');
    const numberText = document.getElementById('countdownNumber');
    const circle = document.getElementById('countdownCircle');
    const cancelBtn = document.getElementById('cancelDeleteBtn');
    if (!panel || !numberText || !circle || !cancelBtn) return;
    clearTimeout(deleteTimeout); clearInterval(deleteInterval);
    panel.classList.add('active'); let timeLeft = 5; numberText.textContent = timeLeft;
    if (circle) circle.style.strokeDashoffset = "62.8";
    deleteInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft >= 0) {
            numberText.textContent = timeLeft;
            if (circle) circle.style.strokeDashoffset = (62.8 * (timeLeft / 5)) + 'px';
        }
    }, 1000);
    deleteTimeout = setTimeout(async () => {
        clearInterval(deleteInterval); panel.classList.remove('active');
        try {
            const textContent = messageElement.querySelector('.message-text')?.textContent || "";
            const authorContent = messageElement.querySelector('.message-author')?.textContent.replace(':', '').trim() || "";
            const snapshot = await db.collection("messages").where("server", "==", currentServerContext).where("channel", "==", currentChannelContext).where("author", "==", authorContent).where("text", "==", textContent).get();
            snapshot.forEach(async (doc) => { await db.collection("messages").doc(doc.id).delete(); });
            messageElement.remove();
        } catch (err) { console.error(err); }
    }, 5000);
    cancelBtn.onclick = () => { clearTimeout(deleteTimeout); clearInterval(deleteInterval); panel.classList.remove('active'); };
}

let messagesListener = null;
const firebaseConfig = {
  apiKey: "AIzaSyAY20LAIcPbkR6r4HUjCVctCWYfnDC4svw",
  authDomain: "://firebaseapp.com",
  projectId: "ds-chat78",
  storageBucket: "://appspot.com",
  messagingSenderId: "1071477755850",
  appId: "1:1071477755850:web:ee611a5113d09a8ec584b4"
};
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.firestore();
// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ДЛЯ WEBRTC ЗВОНКОВ И ДЕМКИ ===
let localStream = null;
let screenStream = null;
let peerConnection = null;
let currentRoomId = null;

const rtcServers = {
    iceServers: [
        { urls: ['stun:://google.com', 'stun:://google.com'] }
    ],
    iceCandidatePoolSize: 10,
};
const CREATOR_NICKNAME = 'dj1ka'; let myName = ''; let currentServerContext = 'public'; let currentChannelContext = 'general-chat';
let authModalOverlay, authLoginInput, authPasswordInput, authSubmitBtn, publicServerBtn, dmServerBtn, serverChannelsSection, dmChannelsSection, chatTitle, hashtag, messagesContainer, messageInput, sendBtn;

document.addEventListener('DOMContentLoaded', () => {
    authModalOverlay = document.getElementById('authModalOverlay'); authLoginInput = document.getElementById('authLoginInput'); authPasswordInput = document.getElementById('authPasswordInput'); authSubmitBtn = document.getElementById('authSubmitBtn'); publicServerBtn = document.getElementById('publicServerBtn'); dmServerBtn = document.getElementById('dmServerBtn'); serverChannelsSection = document.getElementById('serverChannelsSection'); dmChannelsSection = document.getElementById('dmChannelsSection'); chatTitle = document.getElementById('chatTitle'); hashtag = document.getElementById('hashtag'); messageInput = document.getElementById('messageInput'); sendBtn = document.getElementById('sendBtn'); messagesContainer = document.getElementById('messagesContainer') || document.getElementById('chatMessages');
    const openSettingsBtn = document.getElementById('openSettingsBtn'); const settingsSidebar = document.getElementById('settingsSidebar');
    if (openSettingsBtn && settingsSidebar) { openSettingsBtn.addEventListener('click', (e) => { e.stopPropagation(); settingsSidebar.classList.toggle('active'); }); }
    const goToZonesBtn = document.getElementById('goToZonesBtn'); const backToMenuBtn = document.getElementById('backToMenuBtn'); const mainSettingsScreen = document.getElementById('mainSettingsScreen'); const zoneSettingsScreen = document.getElementById('zoneSettingsScreen');
    if (goToZonesBtn && mainSettingsScreen && zoneSettingsScreen) { goToZonesBtn.addEventListener('click', (e) => { e.stopPropagation(); mainSettingsScreen.classList.remove('active-screen'); zoneSettingsScreen.classList.add('active-screen'); }); }
    if (backToMenuBtn && mainSettingsScreen && zoneSettingsScreen) { backToMenuBtn.addEventListener('click', (e) => { e.stopPropagation(); zoneSettingsScreen.classList.remove('active-screen'); mainSettingsScreen.classList.add('active-screen'); }); }
    const zoneSelectTrigger = document.getElementById('zoneSelectTrigger'); const zoneSelectOptions = document.getElementById('zoneSelectOptions'); let selectedZone = '';
    if (zoneSelectTrigger && zoneSelectOptions) { zoneSelectTrigger.addEventListener('click', (e) => { e.stopPropagation(); zoneSelectOptions.classList.toggle('active'); }); }
    document.querySelectorAll('.custom-option').forEach(option => {
        option.addEventListener('click', function(e) { e.stopPropagation(); selectedZone = this.getAttribute('data-value'); if (zoneSelectTrigger) zoneSelectTrigger.innerHTML = this.textContent + ' <span class="select-arrow">▼</span>'; if (zoneSelectOptions) zoneSelectOptions.classList.remove('active'); });
    });
    const applyColorBtn = document.getElementById('applyColorBtn'); const customColorInput = document.getElementById('customColorInput');
    if (applyColorBtn && customColorInput) { applyColorBtn.addEventListener('click', (e) => { e.stopPropagation(); if (!selectedZone) { alert('Сначала выберите зону!'); return; } const el = document.getElementById(selectedZone); if (el) { el.style.setProperty('background-color', customColorInput.value, 'important'); } }); }
    const bellDropdownPanel = document.getElementById('bellDropdownPanel'); const notificationBell = document.getElementById('notificationBell');
    if (notificationBell && bellDropdownPanel) { notificationBell.addEventListener('click', (e) => { e.stopPropagation(); bellDropdownPanel.classList.toggle('active'); if (settingsSidebar) settingsSidebar.classList.remove('active'); }); }
    document.addEventListener('click', (e) => {
        if (settingsSidebar && !settingsSidebar.contains(e.target) && e.target !== openSettingsBtn) { settingsSidebar.classList.remove('active'); }
        if (zoneSelectOptions && !zoneSelectOptions.contains(e.target) && e.target !== zoneSelectTrigger) { zoneSelectOptions.classList.remove('active'); }
        if (bellDropdownPanel && !bellDropdownPanel.contains(e.target) && e.target !== notificationBell) { bellDropdownPanel.classList.remove('active'); }
    });
    if (sendBtn) sendBtn.addEventListener('click', handleSendMessage);
    if (messageInput) { messageInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSendMessage(); }); }
    if (publicServerBtn) { publicServerBtn.addEventListener('click', () => { document.querySelectorAll('.guild-icon').forEach(g => g.classList.remove('active')); publicServerBtn.classList.add('active'); currentServerContext = 'public'; currentChannelContext = 'general-chat'; if (chatTitle) chatTitle.textContent = 'general-chat'; if (hashtag) hashtag.textContent = '#'; if (dmChannelsSection) dmChannelsSection.style.display = 'none'; if (serverChannelsSection) serverChannelsSection.style.display = 'block'; loadSavedMessages(); }); }
    checkUserSession();
});

function initChatAfterAuth() {
    const topName = document.getElementById('topUserName'); if (topName) topName.textContent = myName;
    const topAvatar = document.getElementById('userAvatarHeader'); if (topAvatar) topAvatar.textContent = myName.charAt(0).toUpperCase();
    if (publicServerBtn) publicServerBtn.click();
}

function loadSavedMessages() {
    const realContainer = document.getElementById('messagesContainer') || document.getElementById('chatMessages'); if (!realContainer) return;
    realContainer.innerHTML = ''; if (messagesListener) { messagesListener(); messagesListener = null; }
    messagesListener = db.collection("messages").where("server", "==", currentServerContext).where("channel", "==", currentChannelContext).orderBy("timestamp", "asc").onSnapshot((snapshot) => {
        realContainer.innerHTML = ''; snapshot.forEach((docSnap) => { const msg = docSnap.data(); if (msg.author && msg.text) { appendMessage(msg.author, msg.text); } });
    });
}

async function handleSendMessage() {
    if (!messageInput) return; const text = messageInput.value.trim(); if (text === '') return;
    try { await db.collection("messages").add({ server: currentServerContext, channel: currentChannelContext, author: myName, text: text, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); messageInput.value = ''; } catch (err) { console.error(err); }
}

function appendMessage(author, text) {
    const realMessagesArea = document.getElementById('messagesContainer') || document.getElementById('chatMessages'); if (!realMessagesArea) return;
    const messageElement = document.createElement('div'); messageElement.className = 'message-item message';
    
    // ВЕРСТКА: Вернули чистый знак &lt; (<)
    messageElement.innerHTML = `
        <div class="message-content"><span class="message-author">${author}:</span><span class="message-text">${text}</span></div>
        <div class="message-hover-actions">
            <button class="action-btn hover-edit-btn" title="Редактировать сообщение"><span>✏️</span></button>
            <button class="action-btn hover-delete-trigger-btn" title="Удалить"><span>🗑️</span></button>
            <div class="action-dropdown-wrapper">
                <button class="action-btn hover-more-btn" title="Ещё"><span>&lt;</span></button>
                <div class="hover-submenu"><button class="submenu-item-btn">Добавить в друзья</button></div>
            </div>
        </div>
    `;
    const timerDeleteBtn = messageElement.querySelector('.hover-delete-trigger-btn');
    if (timerDeleteBtn) { timerDeleteBtn.addEventListener('click', (e) => { e.stopPropagation(); initiateMessageDelete(messageElement); }); }
    const addFriendBtn = messageElement.querySelector('.submenu-item-btn');
    if (addFriendBtn) { addFriendBtn.addEventListener('click', (e) => { e.stopPropagation(); alert('Заявка отправлена!'); }); }
    
    const editBtn = messageElement.querySelector('.hover-edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation(); const textSpan = messageElement.querySelector('.message-text');
            if (!textSpan || messageElement.classList.contains('editing')) return;
            messageElement.classList.add('editing'); const originalText = textSpan.textContent;
            textSpan.innerHTML = '<div style="display:inline-flex; gap:8px; align-items:center; width:100%; margin-top:4px;"><input type="text" class="edit-input" value="' + originalText + '" style="flex:1; background-color:#383a40; border:none; outline:none; color:#fff; padding:6px; border-radius:4px;"><button class="s-btn" style="background-color:#23a55a; color:#fff; border:none; padding:6px; border-radius:4px; cursor:pointer;">Ок</button><button class="c-btn" style="background:transparent; color:#fff; border:none; cursor:pointer;">Х</button></div>';
            const sBtn = textSpan.querySelector('.s-btn'), cBtn = textSpan.querySelector('.c-btn'), inp = textSpan.querySelector('.edit-input');
            sBtn.addEventListener('click', async (evt) => {
                evt.stopPropagation(); const nt = inp.value.trim(); if (!nt) return;
                try {
                    const snap = await db.collection("messages").where("server","==",currentServerContext).where("channel","==",currentChannelContext).where("author","==",author).where("text","==",originalText).get();
                    snap.forEach(async(doc)=>{await db.collection("messages").doc(doc.id).update({text:nt});}); textSpan.textContent = nt; messageElement.classList.remove('editing');
                } catch(err){console.error(err);}
            });
            cBtn.addEventListener('click',(evt)=>{evt.stopPropagation(); textSpan.textContent=originalText; messageElement.classList.remove('editing');});
        });
    }

    const saveProfileChangesBtn = document.getElementById('saveProfileChangesBtn');
    const profileNicknameInput = document.getElementById('profileNicknameInput');
    const profileModalOverlay = document.getElementById('profileModalOverlay');
    if (saveProfileChangesBtn) {
        saveProfileChangesBtn.onclick = function() {
            const newNick = profileNicknameInput ? profileNicknameInput.value.trim() : '';
            if (newNick) { myName = newNick; localStorage.setItem('chat_active_user', myName); }
            const topName = document.getElementById('topUserName'); const topAvatar = document.getElementById('userAvatarHeader');
            if (topName) topName.textContent = myName;
            if (topAvatar) {
                topAvatar.style.backgroundColor = selectedAvatarColor;
                if (base64AvatarData) {
                    topAvatar.textContent = ''; topAvatar.style.backgroundImage = 'url(' + base64AvatarData + ')';
                    topAvatar.style.backgroundSize = 'cover'; topAvatar.style.backgroundPosition = 'center';
                } else {
                    topAvatar.style.backgroundImage = 'none'; topAvatar.textContent = myName.charAt(0).toUpperCase();
                }
            }
            if (profileModalOverlay) profileModalOverlay.classList.remove('active');
            alert('Профиль успешно обновлен!');
        };
    }
    realMessagesArea.appendChild(messageElement); realMessagesArea.scrollTop = realMessagesArea.scrollHeight;
}

function checkUserSession() {
    const savedUser = localStorage.getItem('chat_active_user');
    if (savedUser) { myName = savedUser; if (authModalOverlay) authModalOverlay.classList.remove('active'); initChatAfterAuth(); }
    else { if (authModalOverlay) authModalOverlay.classList.add('active'); }
}
    // === ОБНОВЛЕННАЯ ЛОГИКА КНОПОК ЗВОНКА И ДЕМКИ (ОБХОД БЛОКИРОВКИ) ===
    const startCallBtn = document.getElementById('startCallBtn');
    const startScreenBtn = document.getElementById('startScreenBtn');
    const endCallBtn = document.getElementById('endCallBtn');
    const videoCallZone = document.getElementById('videoCallZone');

    if (startCallBtn) {
        startCallBtn.onclick = async (e) => {
            e.stopPropagation();
            
            // Сначала принудительно переключаем иконки в шапке чата, чтобы интерфейс не зависал
            if (startCallBtn) startCallBtn.style.display = 'none';
            if (startScreenBtn) startScreenBtn.style.display = 'block';
            if (endCallBtn) endCallBtn.style.display = 'block';
            
            // Запускаем WebRTC звонок через Firebase сигналы
            await startVoiceCall();
        };
    }

    if (startScreenBtn) {
        startScreenBtn.onclick = async (e) => {
            e.stopPropagation();
            await startScreenShare();
        };
    }

    if (endCallBtn) {
        endCallBtn.onclick = async (e) => {
            e.stopPropagation();
            
            // Возвращаем иконки шапки в исходное состояние
            if (startCallBtn) startCallBtn.style.display = 'block';
            if (startScreenBtn) startScreenBtn.style.display = 'none';
            if (endCallBtn) endCallBtn.style.display = 'none';
            if (videoCallZone) videoCallZone.style.display = 'none';
            
            // Глушим потоки и чистим Firebase
            await hangUpCall();
        };
    }
async function startVoiceCall() {
    try {
        // Мягкий захват микрофона: если браузер блокирует http, скрипт продолжит работу без вылета ошибки
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                peerConnection = new RTCPeerConnection(rtcServers);
                localStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, localStream);
                });
            } catch (mediaErr) {
                console.warn('Микрофон заблокирован или отсутствует, работаем в режиме симуляции звонка:', mediaErr);
            }
        } else {
            console.warn('Браузер блокирует медиа-устройства на HTTP. Включаем симуляцию комнаты звонка.');
        }

        // Если peerConnection не создался из-за блокировки, создаем заглушку для сигналов Firebase
        if (!peerConnection) {
            peerConnection = new RTCPeerConnection(rtcServers);
        }

        peerConnection.ontrack = (event) => {
            const remoteVideo = document.getElementById('remoteVideo');
            const videoCallZone = document.getElementById('videoCallZone');
            if (remoteVideo && event.streams) {
                remoteVideo.srcObject = event.streams;
                if (videoCallZone) videoCallZone.style.display = 'flex';
            }
        };

        // Создаем и регистрируем сигнальную комнату в Firestore коллекции calls
        const roomRef = db.collection('calls').doc(currentServerContext + '_' + currentChannelContext);
        currentRoomId = roomRef.id;

        const callerCandidatesCollection = roomRef.collection('callerCandidates');
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                callerCandidatesCollection.add(event.candidate.toJSON());
            }
        };

// 2. Функция включения демонстрации экрана (демки)
async function startScreenShare() {
    try {
        if (!peerConnection) { alert('Сначала начните звонок!'); return; }

        // Захватываем экран компьютера пользователя
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        
        // Находим видео-трек нашего экрана
        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Заменяем текущий пустой трек на трансляцию экрана для собеседника
        const senders = peerConnection.getSenders();
        const sender = senders.find(s => s.track && s.track.kind === 'video');
        
        if (sender) {
            sender.replaceTrack(screenTrack);
        } else {
            peerConnection.addTrack(screenTrack, screenStream);
        }

        // Если стрим экрана закроется кнопкой в браузере — возвращаем звук назад
        screenTrack.onended = () => {
            if (localStream) {
                const audioTrack = localStream.getAudioTracks()[0];
                const vSender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
                if (vSender) peerConnection.removeTrack(vSender);
            }
        };

        alert('Демонстрация экрана запущена успешно!');
    } catch (err) {
        console.error('Ошибка захвата экрана:', err);
    }
}
// === WEBRTC ЧАСТЬ 3: ПОДКЛЮЧЕНИЕ СЛУШАТЕЛЯ И ЗАВЕРШЕНИЕ ЗВОНКА ===

// 3. Функция автоматического подключения второго участника к звонку
async function joinVoiceCall() {
    const roomRef = db.collection('calls').doc(currentServerContext + '_' + currentChannelContext);
    const roomSnapshot = await roomRef.get();
    
    if (!roomSnapshot.exists) return; // Если комнаты ещё нет, значит мы первые и просто ждём
    const data = roomSnapshot.data();
    if (!data || !data.offer || data.offer.host === myName) return; // Если мы сами хозяева звонка, выходим

    try {
        if (!peerConnection) {
            peerConnection = new RTCPeerConnection(rtcServers);
            
            if (localStream) {
                localStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, localStream);
                });
            }

            peerConnection.ontrack = (event) => {
                const remoteVideo = document.getElementById('remoteVideo');
                const videoCallZone = document.getElementById('videoCallZone');
                if (remoteVideo && event.streams && event.streams[0]) {
                    remoteVideo.srcObject = event.streams[0];
                    if (videoCallZone) videoCallZone.style.display = 'flex';
                }
            };
        }

        // Собираем ICE-кандидаты от второго участника
        const calleeCandidatesCollection = roomRef.collection('calleeCandidates');
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                calleeCandidatesCollection.add(event.candidate.toJSON());
            }
        };

        // Записываем оффер создателя звонка
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        
        // Создаем наш ответный SDP (Answer)
        const answerDescription = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answerDescription);

        const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp
        };
        
        // Отправляем ответ в Firebase
        await roomRef.update({ answer: answer });

        // Слушаем ICE-кандидаты от создателя звонка
        roomRef.collection('callerCandidates').onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidateData = change.doc.data();
                    peerConnection.addIceCandidate(new RTCIceCandidate(candidateData));
                }
            });
        });

        // Насильно переключаем кнопки звонка для второго участника чата
        const startCallBtn = document.getElementById('startCallBtn');
        const startScreenBtn = document.getElementById('startScreenBtn');
        const endCallBtn = document.getElementById('endCallBtn');
        if (startCallBtn) startCallBtn.style.display = 'none';
        if (startScreenBtn) startScreenBtn.style.display = 'block';
        if (endCallBtn) endCallBtn.style.display = 'block';

        alert('Вы успешно подключились к голосовому звонку!');
    } catch (err) {
        console.error('Ошибка подключения к звонку:', err);
    }
}

// 4. Функция сброса трубки и очистки данных звонка
async function hangUpCall() {
    // Выключаем камеру/микрофон/демку экрана, чтобы не горели индикаторы
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        screenStream = null;
    }
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    // Полностью сбрасываем плеер в HTML
    const remoteVideo = document.getElementById('remoteVideo');
    if (remoteVideo) remoteVideo.srcObject = null;

    // Стираем комнату звонка из Firebase, чтобы другие могли позвонить заново
    if (currentServerContext && currentChannelContext) {
        const roomRef = db.collection('calls').doc(currentServerContext + '_' + currentChannelContext);
        try {
            // Удаляем вложенные коллекции ICE-кандидатов
            const callers = await roomRef.collection('callerCandidates').get();
            callers.forEach(async (doc) => { await doc.ref.delete(); });
            
            const callees = await roomRef.collection('calleeCandidates').get();
            callees.forEach(async (doc) => { await doc.ref.delete(); });
            
            // Удаляем саму комнату
            await roomRef.delete();
        } catch (err) {
            console.error('Ошибка очистки звонка в Firebase:', err);
        }
    }
    currentRoomId = null;
    alert('Звонок завершён.');
}
