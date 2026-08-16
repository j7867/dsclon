// === ФУНКЦИЯ КРУГОВОГО ТАЙМЕРА УДАЛЕНИЯ СООБЩЕНИЙ ===
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
    
    const maxOffset = 62.8;
    if (circle) circle.style.strokeDashoffset = "0";

    deleteInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft >= 0) {
            numberText.textContent = timeLeft;
            const progress = (5 - timeLeft) / 5;
            if (circle) circle.style.strokeDashoffset = maxOffset * progress;
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
                .where("text", "==", textContent)
                .get();

            snapshot.forEach(async (doc) => {
                await db.collection("messages").doc(doc.id).delete();
            });

            messageElement.remove();
        } catch (err) {
            console.error("Ошибка удаления с сервера Firebase:", err);
        }
    }, 5000);

    cancelBtn.onclick = () => {
        clearTimeout(deleteTimeout);
        clearInterval(deleteInterval);
        panel.classList.remove('active');
    };
}

let messagesListener = null;

// === КОНФИГУРАЦИЯ GOOGLE FIREBASE ===
const firebaseConfig = {
  apiKey: "AIzaSyAY20LAIcPbkR6r4HUjCVctCWYfnDC4svw",
  authDomain: "://firebaseapp.com",
  projectId: "ds-chat78",
  storageBucket: "://appspot.com",
  messagingSenderId: "1071477755850",
  appId: "1:1071477755850:web:ee611a5113d09a8ec584b4"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

const CREATOR_NICKNAME = 'dj1ka';
let myName = '';
let currentServerContext = 'public';
let currentChannelContext = 'general-chat';
// Основные элементы интерфейса
let authModalOverlay, authLoginInput, authPasswordInput, authSubmitBtn;
let userHeaderName, openFullProfileBtn, goToAdminRequestsBtn;
let adminRequestsList, requestsCountBadge, noRequestsText;
let publicServerBtn, dmServerBtn, serverChannelsSection, dmChannelsSection, chatTitle, hashtag, messagesContainer, messageInput, sendBtn;

document.addEventListener('DOMContentLoaded', () => {
    authModalOverlay = document.getElementById('authModalOverlay');
    authLoginInput = document.getElementById('authLoginInput');
    authPasswordInput = document.getElementById('authPasswordInput');
    authSubmitBtn = document.getElementById('authSubmitBtn');
    userHeaderName = document.querySelector('.user-name') || document.getElementById('userHeaderName');
    openFullProfileBtn = document.getElementById('openFullProfileBtn');
    goToAdminRequestsBtn = document.getElementById('goToAdminRequestsBtn');
    adminRequestsList = document.getElementById('adminRequestsList');
    requestsCountBadge = document.getElementById('requestsCountBadge');
    noRequestsText = document.getElementById('noRequestsText');
    publicServerBtn = document.getElementById('publicServerBtn');
    dmServerBtn = document.getElementById('dmServerBtn');
    serverChannelsSection = document.getElementById('serverChannelsSection');
    dmChannelsSection = document.getElementById('dmChannelsSection');
    chatTitle = document.getElementById('chatTitle');
    hashtag = document.getElementById('hashtag');
    messageInput = document.getElementById('messageInput');
    sendBtn = document.getElementById('sendBtn');
    
    messagesContainer = document.getElementById('messagesContainer') || document.querySelector('.messages-container') || document.querySelector('.chat-messages') || document.getElementById('chatMessages');

    if (authSubmitBtn) {
        authSubmitBtn.addEventListener('click', async () => {
            const login = authLoginInput.value.trim();
            const password = authPasswordInput.value.trim();
            if (!login || !password) { alert('Заполните все поля!'); return; }
            
            try {
                const userRef = db.collection("users").doc(login);
                const userSnap = await userRef.get();

                if (userSnap.exists) {
                    const userData = userSnap.data();
                    if (userData.password !== password) { 
                        alert('Неверный пароль для этого никнейма!'); 
                        return; 
                    }
                    if (userData.status === 'pending') { 
                        alert('Ваш аккаунт всё ещё ожидает подтверждения администратором!'); 
                        return; 
                    }
                } else {
                    const initialStatus = (login === CREATOR_NICKNAME) ? 'approved' : 'pending';
                    await userRef.set({ username: login, password: password, status: initialStatus });
                    
                    if (initialStatus === 'pending') { 
                        alert('Заявка на создание аккаунта отправлена администратору!'); 
                        return; 
                    }
                }

                localStorage.setItem('chat_active_user', login);
                myName = login;
                if (authModalOverlay) authModalOverlay.classList.remove('active');
                initChatAfterAuth();
            } catch (err) { 
                console.error("ПОЛНАЯ ОШИБКА АВТОРИЗАЦИИ:", err);
                alert('Ошибка подключения к базе! Подробности в консоли (F12)'); 
            }
        });
    }

    if (sendBtn) sendBtn.addEventListener('click', handleSendMessage);
    if (messageInput) {
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSendMessage();
        });
    }

    if (publicServerBtn) {
        publicServerBtn.addEventListener('click', () => {
            document.querySelectorAll('.guild-icon').forEach(g => g.classList.remove('active'));
            publicServerBtn.classList.add('active');
            currentServerContext = 'public';
            currentChannelContext = 'general-chat';
            if (chatTitle) chatTitle.textContent = 'general-chat';
            if (hashtag) hashtag.textContent = '#';
            if (dmChannelsSection) dmChannelsSection.style.display = 'none';
            if (serverChannelsSection) serverChannelsSection.style.display = 'block';
            loadSavedMessages();
        });
    }

    if (dmServerBtn) {
        dmServerBtn.addEventListener('click', () => {
            document.querySelectorAll('.guild-icon').forEach(g => g.classList.remove('active'));
            dmServerBtn.classList.add('active');
            currentServerContext = 'dm';
            currentChannelContext = 'friends';
            if (chatTitle) chatTitle.textContent = 'Друзья';
            if (hashtag) hashtag.textContent = '';
            if (serverChannelsSection) serverChannelsSection.style.display = 'none';
            if (dmChannelsSection) dmChannelsSection.style.display = 'block';
            loadSavedMessages();
        });
    }

    // Запуск проверки сессии при старте
    checkUserSession();
});
function initChatAfterAuth() {
    if (userHeaderName) userHeaderName.textContent = myName;
    if (openFullProfileBtn) openFullProfileBtn.textContent = myName.charAt(0).toUpperCase();
    
    if (myName === CREATOR_NICKNAME && goToAdminRequestsBtn) {
        goToAdminRequestsBtn.style.display = 'block';
        listenToPendingRequests();
    }
    
    if (publicServerBtn) {
        publicServerBtn.click();
    } else {
        loadSavedMessages();
    }
}

function listenToPendingRequests() {
    if (!adminRequestsList || !requestsCountBadge || !noRequestsText) return;
    
    db.collection("users").onSnapshot((snapshot) => {
        adminRequestsList.innerHTML = '';
        let count = 0;
        
        snapshot.forEach((docSnap) => {
            const user = docSnap.data();
            if (user.status === 'pending') {
                count++;
                const card = document.createElement('div');
                card.className = 'request-card';
                card.innerHTML = `
                    <div class="request-info">
                        <div class="request-user-name">Логин: ${user.username}</div>
                        <div class="request-user-pass">Пароль: ${user.password}</div>
                    </div>
                    <div class="request-actions-row">
                        <button class="request-btn request-approve-btn">✔️ Одобрить</button>
                        <button class="request-btn request-decline-btn">❌ Отклонить</button>
                    </div>
                `;

                card.querySelector('.request-approve-btn').addEventListener('click', async () => {
                    await db.collection("users").doc(user.username).update({ status: 'approved' });
                });

                card.querySelector('.request-decline-btn').addEventListener('click', async () => {
                    await db.collection("users").doc(user.username).update({ status: 'declined' });
                });

                adminRequestsList.appendChild(card);
            }
        });
        requestsCountBadge.textContent = count;
        noRequestsText.style.display = (count === 0) ? 'block' : 'none';
    });
}

function loadSavedMessages() {
    const realContainer = document.getElementById('chatMessages') || document.getElementById('messagesContainer') || document.querySelector('.chat-messages') || document.querySelector('.messages-container');
    if (!realContainer) return;
    
    realContainer.innerHTML = ''; 

    if (messagesListener) {
        messagesListener();
        messagesListener = null;
    }

    messagesListener = db.collection("messages")
        .where("server", "==", currentServerContext)
        .where("channel", "==", currentChannelContext)
        .orderBy("timestamp", "asc")
        .onSnapshot((snapshot) => {
            realContainer.innerHTML = ''; 
            snapshot.forEach((docSnap) => {
                const msg = docSnap.data();
                if (msg.author && msg.text) {
                    appendMessage(msg.author, msg.text, true);
                }
            });
        }, (error) => {
            console.error("Ошибка чтения сообщений из Firestore:", error);
        });
}
async function handleSendMessage() {
    if (!messageInput) return;
    const text = messageInput.value.trim();
    if (text === '') return;

    try {
        await db.collection("messages").add({
            server: currentServerContext,
            channel: currentChannelContext,
            author: myName,
            text: text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        messageInput.value = '';
    } catch (err) {
        console.error("Ошибка отправки в Firebase:", err);
    }
}

function appendMessage(author, text, isHistory = false) {
    const realMessagesArea = document.getElementById('chatMessages') || document.querySelector('.chat-messages') || document.querySelector('.messages-container') || document.getElementById('messagesContainer');
    if (!realMessagesArea) return;

    const messageElement = document.createElement('div');
    messageElement.className = 'message-item';
    
    messageElement.innerHTML = `
        <div class="message-content">
            <span class="message-author" style="font-weight:bold; color:#fff;">${author}:</span>
            <span class="message-text" style="color:#dcddde;">${text}</span>
            <button class="delete-btn" style="background:transparent; border:none; color:#f04747; cursor:pointer; margin-left:10px;" title="Удалить">🗑️</button>
        </div>
    `;

    const timerDeleteBtn = messageElement.querySelector('.delete-btn');
    if (timerDeleteBtn) {
        timerDeleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            initiateMessageDelete(messageElement);
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
// Пробивная глобальная функция для клика по кнопке входа
window.triggerManualAuth = async function() {
    const btn = document.getElementById('authSubmitBtn');
    if (!btn) return;
    
    const loginInput = document.getElementById('authLoginInput');
    const passwordInput = document.getElementById('authPasswordInput');
    
    if (!loginInput || !passwordInput) {
        alert("Ошибка: Поля ввода не найдены на странице!");
        return;
    }
    
    const login = loginInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!login || !password) {
        alert('Заполните все поля!');
        return;
    }

    try {
        const userRef = db.collection("users").doc(login);
        const userSnap = await userRef.get();

        if (userSnap.exists) {
            const userData = userSnap.data();
            if (userData.password !== password) { 
                alert('Неверный пароль для этого никнейма!'); 
                return; 
            }
            if (userData.status === 'pending') { 
                alert('Ваш аккаунт всё ещё ожидает подтверждения администратором!'); 
                return; 
            }
        } else {
            const initialStatus = (login === CREATOR_NICKNAME) ? 'approved' : 'pending';
            await userRef.set({ username: login, password: password, status: initialStatus });
            
            if (initialStatus === 'pending') { 
                alert('Заявка на создание аккаунта отправлена администратору!'); 
                return; 
            }
        }

        localStorage.setItem('chat_active_user', login);
        myName = login;
        if (authModalOverlay) authModalOverlay.classList.remove('active');
        
        // На всякий случай скрываем плашку и через ID напрямую
        const overlay = document.getElementById('authModalOverlay');
        if (overlay) overlay.style.setProperty('display', 'none', 'important');
        
        initChatAfterAuth();
    } catch (err) { 
        console.error("ПОЛНАЯ ОШИБКА АВТОРИЗАЦИИ:", err);
        alert('Ошибка подключения к базе! Проверьте консоль.'); 
    }
};
