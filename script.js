// === 1. ГЛОБАЛЬНАЯ ОШИБКОУСТОЙЧИВАЯ ФУНКЦИЯ АВТОРИЗАЦИИ ===
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
    } catch (err) { 
        console.error("ОШИБКА АВТОРИЗАЦИИ:", err);
    }
};

// === 2. ФУНКЦИЯ КРУГОВОГО ТАЙМЕРА УДАЛЕНИЯ СООБЩЕНИЙ ===
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
    if (circle) circle.style.strokeDashoffset = "0";

    deleteInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft >= 0) {
            numberText.textContent = timeLeft;
            if (circle) circle.style.strokeDashoffset = 62.8 * ((5 - timeLeft) / 5);
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

// === 3. КОНФИГУРАЦИЯ GOOGLE FIREBASE ===
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
let userHeaderName, openFullProfileBtn, goToAdminRequestsBtn;
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

    // ШЕСТЕРЕНКА НАСТРОЕК (ПЛАВНЫЙ ТОГГЛ)
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const settingsSidebar = document.getElementById('settingsSidebar');
    if (openSettingsBtn && settingsSidebar) {
        openSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsSidebar.classList.toggle('active');
        });
    }

    // МЕНЮ НАСТРОЕК ЗОН (ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ)
    const goToZonesBtn = document.getElementById('goToZonesBtn');
    const backToMenuBtn = document.getElementById('backToMenuBtn');
    const mainSettingsScreen = document.getElementById('mainSettingsScreen');
    const zoneSettingsScreen = document.getElementById('zoneSettingsScreen');
    
    if (goToZonesBtn && mainSettingsScreen && zoneSettingsScreen) {
        goToZonesBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mainSettingsScreen.classList.remove('active-screen');
            zoneSettingsScreen.classList.add('active-screen');
        });
    }
    if (backToMenuBtn && mainSettingsScreen && zoneSettingsScreen) {
        backToMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            zoneSettingsScreen.classList.remove('active-screen');
            mainSettingsScreen.classList.add('active-screen');
        });
    }

    // ВЫПАДАЮЩИЙ СПИСОК ЗОН
    const zoneSelectTrigger = document.getElementById('zoneSelectTrigger');
    const zoneSelectOptions = document.getElementById('zoneSelectOptions');
    let selectedZone = '';
    if (zoneSelectTrigger && zoneSelectOptions) {
        zoneSelectTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            zoneSelectOptions.classList.toggle('active');
        });
    }
    document.querySelectorAll('.custom-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            selectedZone = this.getAttribute('data-value');
            if (zoneSelectTrigger) zoneSelectTrigger.innerHTML = this.textContent + ' <span class="select-arrow">▼</span>';
            if (zoneSelectOptions) zoneSelectOptions.classList.remove('active');
        });
    });

    // КНОПКА «ПРИМЕНИТЬ» ЦВЕТ ЗОНЫ
    const applyColorBtn = document.getElementById('applyColorBtn');
    const customColorInput = document.getElementById('customColorInput');
    if (applyColorBtn && customColorInput) {
        applyColorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!selectedZone) { alert('Сначала выберите зону!'); return; }
            const el = document.getElementById(selectedZone);
            if (el) { el.style.setProperty('background-color', customColorInput.value, 'important'); }
        });
    }

    // МОДAЛКА ПРОФИЛЯ ПО КЛИКУ НА АВАТАРКУ
    const userAvatarHeader = document.getElementById('userAvatarHeader');
    const profileModalOverlay = document.getElementById('profileModalOverlay');
    const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
    if (userAvatarHeader && profileModalOverlay) {
        userAvatarHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            profileModalOverlay.classList.add('active');
        });
    }
    if (closeProfileModalBtn && profileModalOverlay) {
        closeProfileModalBtn.addEventListener('click', () => {
            profileModalOverlay.classList.remove('active');
        });
    }
    // ОЖИВЛЯЕМ КНОПКУ УВЕДОМЛЕНИЙ (КОЛОКОЛЬЧИК)
    const notificationBell = document.getElementById('notificationBell');
    if (notificationBell) {
        notificationBell.addEventListener('click', (e) => {
            e.stopPropagation();
            alert('Уведомления успешно включены! Вы будете получать звуковые сигналы о новых сообщениях.');
        });
    }

    // ГЛОБАЛЬНЫЙ КЛИК ДЛЯ ЗАКРЫТИЯ ОКИН НАСТРОЕК
    document.addEventListener('click', (e) => {
        if (settingsSidebar && !settingsSidebar.contains(e.target) && e.target !== openSettingsBtn) {
            settingsSidebar.classList.remove('active');
        }
        if (zoneSelectOptions && !zoneSelectOptions.contains(e.target) && e.target !== zoneSelectTrigger) {
            zoneSelectOptions.classList.remove('active');
        }
    });

    if (sendBtn) sendBtn.addEventListener('click', handleSendMessage);
    if (messageInput) { messageInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSendMessage(); }); }

    if (publicServerBtn) {
        publicServerBtn.addEventListener('click', () => {
            document.querySelectorAll('.guild-icon').forEach(g => g.classList.remove('active'));
            publicServerBtn.classList.add('active');
            currentServerContext = 'public'; currentChannelContext = 'general-chat';
            if (chatTitle) chatTitle.textContent = 'general-chat';
            if (hashtag) hashtag.textContent = '#';
            if (dmChannelsSection) dmChannelsSection.style.display = 'none';
            if (serverChannelsSection) serverChannelsSection.style.display = 'block';
            loadSavedMessages();
        });
    }
    checkUserSession();
});
function initChatAfterAuth() {
    const topName = document.getElementById('topUserName');
    if (topName) topName.textContent = myName;
    const topAvatar = document.getElementById('userAvatarHeader');
    if (topAvatar) topAvatar.textContent = myName.charAt(0).toUpperCase();
    if (publicServerBtn) publicServerBtn.click();
}

function loadSavedMessages() {
    const realContainer = document.getElementById('messagesContainer') || document.getElementById('chatMessages');
    if (!realContainer) return;
    realContainer.innerHTML = ''; 
    if (messagesListener) { messagesListener(); messagesListener = null; }

    messagesListener = db.collection("messages")
        .where("server", "==", currentServerContext)
        .where("channel", "==", currentChannelContext)
        .orderBy("timestamp", "asc")
        .onSnapshot((snapshot) => {
            realContainer.innerHTML = ''; 
            snapshot.forEach((docSnap) => {
                const msg = docSnap.data();
                if (msg.author && msg.text) { appendMessage(msg.author, msg.text); }
            });
        });
}

async function handleSendMessage() {
    if (!messageInput) return;
    const text = messageInput.value.trim();
    if (text === '') return;
    try {
        await db.collection("messages").add({
            server: currentServerContext, channel: currentChannelContext,
            author: myName, text: text, timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        messageInput.value = '';
    } catch (err) { console.error(err); }
}

// ОБНОВЛЕННЫЙ РЕНДЕР: Панель со стрелочкой-трансформером и скрытым меню
function appendMessage(author, text) {
    const realMessagesArea = document.getElementById('messagesContainer') || document.getElementById('chatMessages');
    if (!realMessagesArea) return;

    const messageElement = document.createElement('div');
    messageElement.className = 'message-item message';
    
    messageElement.innerHTML = `
        <div class="message-content">
            <span class="message-author">${author}:</span>
            <span class="message-text">${text}</span>
        </div>
        <!-- Дискорд-панель действий -->
        <div class="message-hover-actions">
            <button class="action-btn hover-emoji-btn" title="Добавить реакцию">😀</button>
            <button class="action-btn hover-edit-btn" title="Редактировать сообщение">✏️</button>
            
            <!-- Стрелочка-трансформер с выпадающим подменю внутри -->
            <div class="action-dropdown-wrapper">
                <button class="action-btn hover-more-btn" title="Ещё">&gt;</button>
                <div class="hover-submenu">
                    <button class="submenu-item-btn">Добавить в друзья</button>
                </div>
            </div>
            
            <button class="action-btn hover-delete-trigger-btn" title="Удалить">🗑️</button>
        </div>
    `;

    // Логика удаления
    const timerDeleteBtn = messageElement.querySelector('.hover-delete-trigger-btn');
    if (timerDeleteBtn) {
        timerDeleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            initiateMessageDelete(messageElement);
        });
    }

    // Логика для кнопки "Добавить в друзья" внутри подменю
    const addFriendBtn = messageElement.querySelector('.submenu-item-btn');
    if (addFriendBtn) {
        addFriendBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            alert(`Заявка в друзья пользователю ${author} успешно отправлена!`);
            // Закрываем подменю после клика
            const submenu = messageElement.querySelector('.hover-submenu');
            if (submenu) submenu.classList.remove('active');
        });
    }

    realMessagesArea.appendChild(messageElement);
    realMessagesArea.scrollTop = realMessagesArea.scrollHeight;
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
