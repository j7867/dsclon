let selectedAvatarColor = '#5865f2';
let base64AvatarData = '';
let localStream = null;
let screenStream = null;
let peerConnection = null;
let currentRoomId = null;
let voiceUsersListener = null;
let audioCtx = null;
let micGainNode = null;

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
const CREATOR_NICKNAME = 'dj1ka'; 
let myName = ''; 
let currentServerContext = 'public'; 
let currentChannelContext = 'general-chat';
let authModalOverlay, authLoginInput;
let authPasswordInput, authSubmitBtn;
let publicServerBtn, dmServerBtn;
let serverChannelsSection, dmChannelsSection;
let chatTitle, hashtag, messagesContainer;
let messageInput, sendBtn;

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
            if (userData.status === 'pending' && login !== CREATOR_NICKNAME) {
                alert('Ошибка доступа: профиль ожидает одобрения dj1ka!');
                return;
            }
        } else {
            const initialStatus = (login === CREATOR_NICKNAME) ? 'approved' : 'pending';
            await userRef.set({ username: login, password: password, status: initialStatus });
            if (initialStatus === 'pending') {
                alert('Регистрация успешна! Ожидайте одобрения от dj1ka.');
                return;
            }
        }
        localStorage.setItem('chat_active_user', login);
        myName = login;
        const overlay = document.getElementById('authModalOverlay');
        if (overlay) overlay.classList.remove('active');
        initChatAfterAuth();
    } catch (err) { console.error("ОШИБКА АВТОРИЗАЦИИ:", err); }
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

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const preloader = document.getElementById('sitePreloader');
        if (preloader) { preloader.style.opacity = '0'; preloader.style.visibility = 'hidden'; setTimeout(() => { preloader.remove(); }, 500); }
    }, 3000);

    authModalOverlay = document.getElementById('authModalOverlay');
    authLoginInput = document.getElementById('authLoginInput');
    authPasswordInput = document.getElementById('authPasswordInput');
    authSubmitBtn = document.getElementById('authSubmitBtn');
    publicServerBtn = document.getElementById('publicServerBtn');
    dmServerBtn = document.getElementById('dmServerBtn');
    serverChannelsSection = document.getElementById('serverChannelsSection');
    dmChannelsSection = document.getElementById('dmChannelsSection');
    chatTitle = document.getElementById('chatTitle');
    hashtag = document.getElementById('hashtag');
    messageInput = document.getElementById('messageInput');
    sendBtn = document.getElementById('sendBtn');
    messagesContainer = document.getElementById('messagesContainer') || document.getElementById('chatMessages');

    const openSettingsBtn = document.getElementById('openSettingsBtn'); 
    const settingsSidebar = document.getElementById('settingsSidebar');
    if (openSettingsBtn && settingsSidebar) { openSettingsBtn.addEventListener('click', (e) => { e.stopPropagation(); settingsSidebar.classList.toggle('active'); }); }
    
    const goToZonesBtn = document.getElementById('goToZonesBtn'); 
    const backToMenuBtn = document.getElementById('backToMenuBtn'); 
    const mainSettingsScreen = document.getElementById('mainSettingsScreen'); 
    const zoneSettingsScreen = document.getElementById('zoneSettingsScreen');
    const goToAudioBtn = document.getElementById('goToAudioBtn'); 
    const backToMenuFromAudioBtn = document.getElementById('backToMenuFromAudioBtn'); 
    const audioSettingsScreen = document.getElementById('audioSettingsScreen');

    if (goToZonesBtn && mainSettingsScreen && zoneSettingsScreen) { goToZonesBtn.addEventListener('click', (e) => { e.stopPropagation(); mainSettingsScreen.style.setProperty('display', 'none', 'important'); zoneSettingsScreen.style.setProperty('display', 'block', 'important'); }); }
    if (backToMenuBtn && mainSettingsScreen && zoneSettingsScreen) { backToMenuBtn.addEventListener('click', (e) => { e.stopPropagation(); zoneSettingsScreen.style.setProperty('display', 'none', 'important'); mainSettingsScreen.style.setProperty('display', 'flex', 'important'); }); }
    if (goToAudioBtn && mainSettingsScreen && audioSettingsScreen) { goToAudioBtn.addEventListener('click', (e) => { e.stopPropagation(); mainSettingsScreen.style.setProperty('display', 'none', 'important'); audioSettingsScreen.style.setProperty('display', 'flex', 'important'); }); }
    if (backToMenuFromAudioBtn && mainSettingsScreen && audioSettingsScreen) { backToMenuFromAudioBtn.addEventListener('click', (e) => { e.stopPropagation(); audioSettingsScreen.style.setProperty('display', 'none', 'important'); mainSettingsScreen.style.setProperty('display', 'flex', 'important'); }); }

    const zoneSelectTrigger = document.getElementById('zoneSelectTrigger'); 
    const zoneSelectOptions = document.getElementById('zoneSelectOptions'); 
    let selectedZone = '';
    if (zoneSelectTrigger && zoneSelectOptions) { zoneSelectTrigger.addEventListener('click', (e) => { e.stopPropagation(); zoneSelectOptions.classList.toggle('active'); }); }
    document.querySelectorAll('.custom-option').forEach(option => {
        option.addEventListener('click', function(e) { e.stopPropagation(); selectedZone = this.getAttribute('data-value'); if (zoneSelectTrigger) zoneSelectTrigger.innerHTML = this.textContent + ' <span class="select-arrow">▼</span>'; if (zoneSelectOptions) zoneSelectOptions.classList.remove('active'); });
    });
    const applyColorBtn = document.getElementById('applyColorBtn'); 
    const customColorInput = document.getElementById('customColorInput');
    if (applyColorBtn && customColorInput) { applyColorBtn.addEventListener('click', (e) => { e.stopPropagation(); if (!selectedZone) { alert('Сначала выберите зону!'); return; } const el = document.getElementById(selectedZone); if (el) { el.style.setProperty('background-color', customColorInput.value, 'important'); } }); }

    const bellDropdownPanel = document.getElementById('bellDropdownPanel'); 
    const notificationBell = document.getElementById('notificationBell');
    if (notificationBell && bellDropdownPanel) { notificationBell.addEventListener('click', (e) => { e.stopPropagation(); bellDropdownPanel.classList.toggle('active'); if (settingsSidebar) settingsSidebar.classList.remove('active'); }); }
    document.addEventListener('click', (e) => {
        if (settingsSidebar && !settingsSidebar.contains(e.target) && e.target !== openSettingsBtn) { settingsSidebar.classList.remove('active'); }
        if (zoneSelectOptions && !zoneSelectOptions.contains(e.target) && e.target !== zoneSelectTrigger) { zoneSelectOptions.classList.remove('active'); }
        if (bellDropdownPanel && !bellDropdownPanel.contains(e.target) && e.target !== notificationBell) { bellDropdownPanel.classList.remove('active'); }
    });

    const startScreenBtn = document.getElementById('startScreenBtn'); 
    const endCallBtn = document.getElementById('endCallBtn'); 
    const videoCallZone = document.getElementById('videoCallZone');
    if (startScreenBtn) { startScreenBtn.onclick = async (e) => { e.stopPropagation(); await startScreenShare(); }; }
    if (endCallBtn) {
        endCallBtn.onclick = async (e) => {
            e.stopPropagation(); await hangUpCall(); if (videoCallZone) videoCallZone.style.display = 'none';
            const textChannel = document.querySelector('[data-channel="general-chat"]'); if (textChannel) textChannel.click();
        };
    }

    document.querySelectorAll('#serverChannelsList .custom-user-item').forEach(item => {
        item.onclick = async function(e) {
            e.stopPropagation();
            document.querySelectorAll('#serverChannelsList .custom-user-item').forEach(c => c.classList.remove('active')); this.classList.add('active');
            const channelType = this.getAttribute('data-type'); const channelName = this.getAttribute('data-channel');
            currentChannelContext = channelName; if (chatTitle) chatTitle.textContent = channelName;
            const vZone = document.getElementById('videoCallZone'); const inputArea = document.querySelector('.input-area');
            if (channelType === 'voice') {
                if (hashtag) hashtag.textContent = '🔊'; if (vZone) vZone.style.display = 'flex'; if (inputArea) inputArea.style.display = 'none';
                await startVoiceCall();
            } else {
                if (hashtag) hashtag.textContent = '#'; if (vZone) vZone.style.display = 'none'; if (inputArea) inputArea.style.display = 'flex';
                await hangUpCall(); loadSavedMessages();
            }
        };
    });

    const micVolumeSlider = document.getElementById('micVolumeSlider'); const micVolValue = document.getElementById('micVolValue');
    const siteVolumeSlider = document.getElementById('siteVolumeSlider'); const siteVolValue = document.getElementById('siteVolValue');
    const audioProfileSelect = document.getElementById('audioProfileSelect');

    if (micVolumeSlider && micVolValue) {
        micVolumeSlider.oninput = function() { const vol = this.value; micVolValue.textContent = vol + '%'; if (micGainNode) micGainNode.gain.value = vol / 100; };
    }
    if (siteVolumeSlider && siteVolValue) {
        siteVolumeSlider.oninput = function() { const vol = this.value; siteVolValue.textContent = vol + '%'; const remoteVideo = document.getElementById('remoteVideo'); if (remoteVideo) remoteVideo.volume = Math.min(vol / 100, 1); };
    }
    if (audioProfileSelect) { audioProfileSelect.onchange = function() { alert('Шумодав изменен на: ' + this.options[this.selectedIndex].text); }; }

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

    const userAvatarHeader = document.getElementById('userAvatarHeader'); const userProfileModalOverlay = document.getElementById('userProfileModalOverlay');
    const closeProfileModalBtn = document.getElementById('closeProfileModalBtn'); const logoutBtn = document.getElementById('logoutBtn');
    const saveProfileChangesBtn = document.getElementById('saveProfileChangesBtn'); const modalBigAvatarContainer = document.getElementById('modalBigAvatarContainer');
    const avatarFileInput = document.getElementById('avatarFileInput'); const modalBigAvatarImg = document.getElementById('modalBigAvatarImg');
    const modalBigAvatarText = document.getElementById('modalBigAvatarText'); const avatarControlsBlock = document.getElementById('avatarControlsBlock');
    const avaZoomSlider = document.getElementById('avaZoomSlider'); const avaMoveXSlider = document.getElementById('avaMoveXSlider'); const avaMoveYSlider = document.getElementById('avaMoveYSlider');

    function applyLiveTransform() {
        if (!modalBigAvatarImg) return; const z = avaZoomSlider ? avaZoomSlider.value / 100 : 1; const x = avaMoveXSlider ? avaMoveXSlider.value : 0; const y = avaMoveYSlider ? avaMoveYSlider.value : 0;
        modalBigAvatarImg.style.transform = `scale(${z}) translate(${x}px, ${y}px)`;
        const zTxt = document.getElementById('zoomValText'); if (zTxt) zTxt.textContent = z.toFixed(1) + 'x';
        const xTxt = document.getElementById('moveXValText'); if (xTxt) xTxt.textContent = x + 'px';
        const yTxt = document.getElementById('moveYValText'); if (yTxt) yTxt.textContent = y + 'px';
    }
    if (avaZoomSlider) avaZoomSlider.oninput = applyLiveTransform;
    if (avaMoveXSlider) avaMoveXSlider.oninput = applyLiveTransform;
    if (avaMoveYSlider) avaMoveYSlider.oninput = applyLiveTransform;
    if (modalBigAvatarContainer && avatarFileInput) { modalBigAvatarContainer.onclick = (e) => { e.stopPropagation(); avatarFileInput.click(); }; }

    if (avatarFileInput) {
        avatarFileInput.onchange = function() {
            const file = this.files; if (!file) return; const reader = new FileReader();
            reader.onload = function(event) {
                base64AvatarData = event.target.result; if (modalBigAvatarText) modalBigAvatarText.style.display = 'none';
                if (modalBigAvatarImg) { modalBigAvatarImg.src = base64AvatarData; modalBigAvatarImg.style.display = 'block'; }
                if (avatarControlsBlock) avatarControlsBlock.style.display = 'flex'; applyLiveTransform();
            }; reader.readAsDataURL(file);
        };
    }

    if (userAvatarHeader && userProfileModalOverlay) {
        userAvatarHeader.onclick = async (e) => {
            e.stopPropagation(); const profileLoginDisplay = document.getElementById('profileLoginDisplay'); const profileNicknameInput = document.getElementById('profileNicknameInput');
            if (profileLoginDisplay) profileLoginDisplay.value = myName;
            const userSnap = await db.collection("users").doc(myName).get();
            if (userSnap.exists) {
                const uData = userSnap.data(); if (profileNicknameInput) profileNicknameInput.value = uData.nickname || ""; base64AvatarData = uData.avatarBase64 || "";
                if (base64AvatarData) {
                    if (modalBigAvatarText) modalBigAvatarText.style.display = 'none'; if (modalBigAvatarImg) { modalBigAvatarImg.src = base64AvatarData; modalBigAvatarImg.style.display = 'block'; }
                    if (avatarControlsBlock) avatarControlsBlock.style.display = 'flex'; if (avaZoomSlider) avaZoomSlider.value = (uData.scale || 1) * 100; if (avaMoveXSlider) avaMoveXSlider.value = uData.moveX || 0; if (avaMoveYSlider) avaMoveYSlider.value = uData.moveY || 0; applyLiveTransform();
                } else {
                    if (modalBigAvatarText) { modalBigAvatarText.style.display = 'block'; modalBigAvatarText.textContent = (uData.nickname || myName).charAt(0).toUpperCase(); }
                    if (modalBigAvatarImg) modalBigAvatarImg.style.display = 'none'; if (avatarControlsBlock) avatarControlsBlock.style.display = 'none';
                }
            } userProfileModalOverlay.style.setProperty('display', 'flex', 'important');
        };
    }
    if (saveProfileChangesBtn) {
        saveProfileChangesBtn.onclick = async (e) => {
            e.stopPropagation(); const profileNicknameInput = document.getElementById('profileNicknameInput'); const newNickname = profileNicknameInput ? profileNicknameInput.value.trim() : "";
            const z = avaZoomSlider ? avaZoomSlider.value / 100 : 1; const x = avaMoveXSlider ? parseInt(avaMoveXSlider.value) : 0; const y = avaMoveYSlider ? parseInt(avaMoveYSlider.value) : 0;
            try {
                await db.collection("users").doc(myName).set({ nickname: newNickname, avatarBase64: base64AvatarData, scale: z, moveX: x, moveY: y }, { merge: true });
                alert('Профиль успешно сохранен на сайте!'); if (userProfileModalOverlay) userProfileModalOverlay.style.setProperty('display', 'none', 'important');
            } catch(err) { console.error("Ошибка Firebase сейва:", err); alert('Ошибка сохранения!'); }
        };
    }

    if (closeProfileModalBtn && userProfileModalOverlay) { closeProfileModalBtn.onclick = (e) => { e.stopPropagation(); userProfileModalOverlay.style.setProperty('display', 'none', 'important'); }; }
    if (logoutBtn) { logoutBtn.onclick = (e) => { e.stopPropagation(); localStorage.removeItem('chat_active_user'); window.location.reload(); }; }
    if (userProfileModalOverlay) { userProfileModalOverlay.onclick = (e) => { if (e.target === userProfileModalOverlay) userProfileModalOverlay.style.setProperty('display', 'none', 'important'); }; }
    if (sendBtn) sendBtn.addEventListener('click', handleSendMessage);
    if (messageInput) { messageInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSendMessage(); }); }
    if (publicServerBtn) { publicServerBtn.addEventListener('click', () => { document.querySelectorAll('.guild-icon').forEach(g => g.classList.remove('active')); publicServerBtn.classList.add('active'); currentServerContext = 'public'; currentChannelContext = 'general-chat'; if (chatTitle) chatTitle.textContent = 'general-chat'; if (hashtag) hashtag.textContent = '#'; if (dmChannelsSection) dmChannelsSection.style.display = 'none'; if (serverChannelsSection) serverChannelsSection.style.display = 'block'; loadSavedMessages(); }); }
    checkUserSession();
});

function initChatAfterAuth() {
    db.collection("users").doc(myName).onSnapshot((docSnap) => {
        if (docSnap.exists) {
            const userData = docSnap.data(); const displayName = userData.nickname || myName;
            const topName = document.getElementById('topUserName'); if (topName) topName.textContent = displayName;
            const topAvatar = document.getElementById('userAvatarHeader'); 
            if (topAvatar) {
                if (userData.avatarBase64) { topAvatar.textContent = ''; topAvatar.innerHTML = `<img src="${userData.avatarBase64}" style="position:absolute; width:100%; height:100%; object-fit:cover; transform-origin:center center; transform: scale(${userData.scale || 1}) translate(${userData.moveX || 0}px, ${userData.moveY || 0}px);">`; } 
                else { topAvatar.textContent = displayName.charAt(0).toUpperCase(); topAvatar.style.setProperty('background-color', '#5865f2', 'important'); }
            }
        }
    });
    if (publicServerBtn) publicServerBtn.click();
    if (myName === CREATOR_NICKNAME) {
        db.collection("users").where("status", "==", "pending").onSnapshot((snapshot) => {
            const bellPanel = document.getElementById('bellDropdownPanel'); if (!bellPanel) return;
            bellPanel.innerHTML = '<h4 style="font-size: 15px; font-weight: 600; color: #fff; text-align: center; padding: 10px 0; margin: 0; border-bottom: 1px solid #3f4147;">Запросы на вход</h4>';
            if (snapshot.empty) { bellPanel.innerHTML += '<div style="color: #949ba4; font-size: 13px; text-align: center; padding: 20px 0;">Новых запросов нет</div>'; return; }
            snapshot.forEach((docSnap) => {
                const userData = docSnap.data(); const userRow = document.createElement('div');
                userRow.style = "display: flex; flex-direction: column; gap: 6px; padding: 10px 0; border-bottom: 1px solid #3f4147;";
                userRow.innerHTML = `<div style="font-size: 13px; color: #fff; font-weight: bold;">Юзер: <span style="color: #5865f2;">${userData.username}</span></div><div style="display: flex; gap: 8px;"><button class="approve-btn" style="flex: 1; background-color: #23a55a; color: #fff; border: none; padding: 4px; border-radius: 4px; font-size: 12px; font-weight: bold; cursor: pointer;">Одобрить</button><button class="reject-btn" style="flex: 1; background-color: #f23f43; color: #fff; border: none; padding: 4px; border-radius: 4px; font-size: 12px; font-weight: bold; cursor: pointer;">Бан</button></div>`;
                userRow.querySelector('.approve-btn').onclick = async (e) => { e.stopPropagation(); await db.collection("users").doc(userData.username).update({ status: 'approved' }); alert(`Пользователь ${userData.username} одобрен!`); };
                userRow.querySelector('.reject-btn').onclick = async (e) => { e.stopPropagation(); await db.collection("users").doc(userData.username).delete(); alert(`Запрос пользователя ${userData.username} отклонён!`); };
                bellPanel.appendChild(userRow);
            });
        });
    }
    listenVoiceParticipants();
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
    const uniqueAvaId = 'msgAva_' + Math.random().toString(36).substr(2, 9);
    messageElement.innerHTML = `<div class="message-content" style="display: flex; align-items: flex-start; gap: 12px;"><div id="${uniqueAvaId}" class="user-avatar-header" style="width: 32px; height: 32px; border-radius: 50%; background-color: #5865f2; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff; font-size: 14px; flex-shrink: 0; position: relative; overflow: hidden;">${author.charAt(0).toUpperCase()}</div><div><div class="message-author" style="font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 2px;">${author}</div><div class="message-text" style="font-size: 15px; color: #dbdee1;">${text}</div></div></div><div class="message-hover-actions"><button class="action-btn hover-edit-btn" title="Редактировать сообщение"><span>✏️</span></button><button class="action-btn hover-delete-trigger-btn" title="Удалить"><span>🗑️</span></button><div class="action-dropdown-wrapper"><button class="action-btn hover-more-btn" title="Ещё"><span>&lt;</span></button><div class="hover-submenu"><button class="submenu-item-btn">Добавить в друзья</button></div></div></div>`;
    db.collection("users").doc(author).get().then((uSnap) => {
        if (uSnap.exists) {
            const uData = uSnap.data(); const targetAvaBox = document.getElementById(uniqueAvaId);
            if (targetAvaBox) {
                const authorNameEl = messageElement.querySelector('.message-author'); if (authorNameEl && uData.nickname) authorNameEl.textContent = uData.nickname;
                if (uData.avatarBase64) { targetAvaBox.textContent = ''; targetAvaBox.innerHTML = `<img src="${uData.avatarBase64}" style="position:absolute; width:100%; height:100%; object-fit:cover; transform-origin:center center; transform: scale(${uData.scale || 1}) translate(${uData.moveX || 0}px, ${uData.moveY || 0}px);">`; } 
                else if (uData.nickname) { targetAvaBox.textContent = uData.nickname.charAt(0).toUpperCase(); }
            }
        }
    }).catch(e => console.error(e));
    const timerDeleteBtn = messageElement.querySelector('.hover-delete-trigger-btn'); if (timerDeleteBtn) { timerDeleteBtn.addEventListener('click', (e) => { e.stopPropagation(); initiateMessageDelete(messageElement); }); }
    const addFriendBtn = messageElement.querySelector('.submenu-item-btn'); if (addFriendBtn) { addFriendBtn.addEventListener('click', (e) => { e.stopPropagation(); alert('Заявка отправлена!'); }); }
    const editBtn = messageElement.querySelector('.hover-edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation(); const textSpan = messageElement.querySelector('.message-text'); if (!textSpan || messageElement.classList.contains('editing')) return;
            messageElement.classList.add('editing'); const originalText = textSpan.textContent;
            textSpan.innerHTML = '<div style="display:inline-flex; gap:8px; align-items:center; width:100%; margin-top:4px;"><input type="text" class="edit-input" value="' + originalText + '" style="flex:1; background-color:#383a40; border:none; outline:none; color:#fff; padding:6px; border-radius:4px;"><button class="s-btn" style="background-color:#23a55a; color:#fff; border:none; padding:6px; border-radius:4px; cursor:pointer;">Ок</button><button class="c-btn" style="background:transparent; color:#fff; border:none; cursor:pointer;">Х</button></div>';
            const sBtn = textSpan.querySelector('.s-btn'), cBtn = textSpan.querySelector('.c-btn'), inp = textSpan.querySelector('.edit-input');
            sBtn.addEventListener('click', async (evt) => {
                evt.stopPropagation(); const nt = inp.value.trim(); if (!nt) return;
                try {
                    const snap = await db.collection("messages").where("server","==",currentServerContext).where("channel","==",currentChannelContext).where("author","==",author).where("text","==",originalText).get();
                    snap.forEach(async(doc)=>{await db.collection("messages").doc(doc.id).update({text:nt});}); textSpan.textContent = nt; messageElement.classList.remove('editing');
                } catch(err){console.error(err);}
            }); cBtn.addEventListener('click',(evt)=>{evt.stopPropagation(); textSpan.textContent=originalText; messageElement.classList.remove('editing');});
        });
    } realMessagesArea.appendChild(messageElement); realMessagesArea.scrollTop = realMessagesArea.scrollHeight;
}
