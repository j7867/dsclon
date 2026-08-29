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

let deleteTimeout = null;
let deleteInterval = null;

function initiateMessageDelete(messageElement) {
    const panel = document.getElementById('deleteConfirmPanel');
    const numberText = document.getElementById('countdownNumber');
    const circle = document.getElementById('countdownCircle');
    const cancelBtn = document.getElementById('cancelDeleteBtn');
    if (!panel || !numberText || !circle || !cancelBtn) return;
    clearTimeout(deleteTimeout);
    clearInterval(deleteInterval);
    panel.classList.add('active');
    let timeLeft = 5;
    numberText.textContent = timeLeft;
    if (circle) circle.style.strokeDashoffset = "62.8";
    deleteInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft >= 0) {
            numberText.textContent = timeLeft;
            if (circle) circle.style.strokeDashoffset = (62.8 * (timeLeft / 5)) + 'px';
        }
    }, 1000);
    deleteTimeout = setTimeout(async () => {
        clearInterval(deleteInterval);
        panel.classList.remove('active');
        try {
            const textContent = messageElement.querySelector('.message-text')?.textContent || "";
            const authorContent = messageElement.querySelector('.message-author')?.textContent.replace(':', '').trim() || "";
            const snapshot = await db.collection("messages")
                .where("server", "==", currentServerContext)
                .where("channel", "==", currentChannelContext)
                .where("author", "==", authorContent)
                .where("text", "==", textContent).get();
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
const CREATOR_NICKNAME = 'dj1ka';
let myName = '';
let currentServerContext = 'public';
let currentChannelContext = 'general-chat';
let authModalOverlay, authLoginInput, authPasswordInput, authSubmitBtn;
let publicServerBtn, dmServerBtn, serverChannelsSection, dmChannelsSection, chatTitle, hashtag, messagesContainer, messageInput, sendBtn;
document.addEventListener('DOMContentLoaded', () => {
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
    if (openSettingsBtn && settingsSidebar) {
        openSettingsBtn.addEventListener('click', (e) => { e.stopPropagation(); settingsSidebar.classList.toggle('active'); });
    }
    const goToZonesBtn = document.getElementById('goToZonesBtn');
    const backToMenuBtn = document.getElementById('backToMenuBtn');
    const mainSettingsScreen = document.getElementById('mainSettingsScreen');
    const zoneSettingsScreen = document.getElementById('zoneSettingsScreen');
    if (goToZonesBtn && mainSettingsScreen && zoneSettingsScreen) {
        goToZonesBtn.addEventListener('click', (e) => { e.stopPropagation(); mainSettingsScreen.classList.remove('active-screen'); zoneSettingsScreen.classList.add('active-screen'); });
    }
    if (backToMenuBtn && mainSettingsScreen && zoneSettingsScreen) {
        backToMenuBtn.addEventListener('click', (e) => { e.stopPropagation(); zoneSettingsScreen.classList.remove('active-screen'); mainSettingsScreen.classList.add('active-screen'); });
    }
        const zoneSelectTrigger = document.getElementById('zoneSelectTrigger');
    const zoneSelectOptions = document.getElementById('zoneSelectOptions');
    let selectedZone = '';
    if (zoneSelectTrigger && zoneSelectOptions) {
        zoneSelectTrigger.addEventListener('click', (e) => { e.stopPropagation(); zoneSelectOptions.classList.toggle('active'); });
    }
    document.querySelectorAll('.custom-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation(); selectedZone = this.getAttribute('data-value');
            if (zoneSelectTrigger) zoneSelectTrigger.innerHTML = this.textContent + ' <span class="select-arrow">▼</span>';
            if (zoneSelectOptions) zoneSelectOptions.classList.remove('active');
        });
    });

    const applyColorBtn = document.getElementById('applyColorBtn');
    const customColorInput = document.getElementById('customColorInput');
    if (applyColorBtn && customColorInput) {
        applyColorBtn.addEventListener('click', (e) => {
            e.stopPropagation(); if (!selectedZone) { alert('Сначала выберите зону!'); return; }
            const el = document.getElementById(selectedZone); if (el) { el.style.setProperty('background-color', customColorInput.value, 'important'); }
        });
    }

    // Оживляем клики по кружочкам красок в окне настроек профиля
    let selectedAvatarColor = '#5865f2';
    document.querySelectorAll('.avatar-color-circle').forEach(circle => {
        circle.onclick = function(e) {
            e.stopPropagation();
            document.querySelectorAll('.avatar-color-circle').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedAvatarColor = this.getAttribute('data-color');
            const cropBox = document.querySelector('.avatar-crop-container');
            if (cropBox) cropBox.style.backgroundColor = selectedAvatarColor;
        };
    });
       // ОЖИВЛЯЕМ КНОПКУ «СОХРАНИТЬ ИЗМЕНЕНИЯ» ПРОФИЛЯ С КРАСКАМИ И АВАТАРКОЙ
    const saveProfileChangesBtn = document.getElementById('saveProfileChangesBtn');
    const profileNicknameInput = document.getElementById('profileNicknameInput');
    const profileModalOverlay = document.getElementById('profileModalOverlay');

    if (saveProfileChangesBtn) {
        saveProfileChangesBtn.onclick = function() {
            const newNick = profileNicknameInput ? profileNicknameInput.value.trim() : '';
            if (newNick) {
                myName = newNick;
                localStorage.setItem('chat_active_user', myName);
            }
            
            const topName = document.getElementById('topUserName');
            const topAvatar = document.getElementById('userAvatarHeader');
            if (topName) topName.textContent = myName;
            
            if (topAvatar) {
                topAvatar.style.backgroundColor = selectedAvatarColor;
                if (base64AvatarData) {
                    topAvatar.textContent = '';
                    topAvatar.style.backgroundImage = 'url(' + base64AvatarData + ')';
                    topAvatar.style.backgroundSize = 'cover';
                    topAvatar.style.backgroundPosition = 'center';
                } else {
                    topAvatar.style.backgroundImage = 'none';
                    topAvatar.textContent = myName.charAt(0).toUpperCase();
                }
            }
            if (profileModalOverlay) profileModalOverlay.classList.remove('active');
            alert('Профиль успешно обновлен!');
        };
    }
}

function checkUserSession() {
    const savedUser = localStorage.getItem('chat_active_user');
    if (savedUser) { 
        myName = savedUser; 
        if (authModalOverlay) authModalOverlay.classList.remove('active'); 
        initChatAfterAuth(); 
    } else { 
        if (authModalOverlay) authModalOverlay.classList.add('active'); 
    }
}
