// Ваши уникальные ключи конфигурации Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAY20LAIcPbkR6r4HUjCVctCWYfnDC4svw",
  authDomain: "ds-chat78.firebaseapp.com",
  projectId: "ds-chat78",
  storageBucket: "ds-chat78.appspot.com",
  messagingSenderId: "1084561649631",
  appId: "1:1084561649631:web:5361cf4ae5540104e09e6a"
};

// Старт приложения
const app = firebase.initializeApp(firebaseConfig);

// Правильный запуск Firestore с обходом CSP для GitHub Pages
const db = firebase.firestore();
db.settings({
    forceLongPolling: true // В старых/compat версиях пишется именно так, без слова experimental!
});

    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatTitle = document.getElementById('chatTitle'); 
    const hashtag = document.querySelector('.hashtag');
    const userHeaderName = document.querySelector('.user-name-header');

    const openSettingsBtn = document.querySelector('.settings-gear-trigger') || document.getElementById('openSettingsBtn'); 
    const notificationBell = document.querySelector('.notification-bell') || document.getElementById('notificationBell');
    const settingsSidebar = document.getElementById('settingsSidebar');
    const notificationsDropdown = document.getElementById('notificationsDropdown');
    const bellBadge = document.getElementById('bellBadge');
    const notifList = document.getElementById('notifList');
    const notifEmptyText = document.getElementById('notifEmptyText');

    const mainSettingsScreen = document.getElementById('mainSettingsScreen');
    const zoneSettingsScreen = document.getElementById('zoneSettingsScreen');
    const zoneSelectTrigger = document.getElementById('zoneSelectTrigger');
    const zoneSelectOptions = document.getElementById('zoneSelectOptions');
    const customColorInput = document.getElementById('customColorInput');
    const applyColorBtn = document.getElementById('applyColorBtn');

    const goToAdminRequestsBtn = document.getElementById('goToAdminRequestsBtn');
    const adminRequestsScreen = document.getElementById('adminRequestsScreen');
    const backToMenuFromAdminBtn = document.getElementById('backToMenuFromAdminBtn');
    const adminRequestsList = document.getElementById('adminRequestsList');
    const requestsCountBadge = document.getElementById('requestsCountBadge');
    const noRequestsText = document.getElementById('noRequestsText');

    const zones = {
        chatArea: document.getElementById('chatArea'),
        channelsSidebar: document.getElementById('channelsSidebar'),
        guildsSidebar: document.getElementById('guildsSidebar'),
        settingsSidebar: document.getElementById('settingsSidebar')
    };
    let activeZoneKey = '';

    const guildsSidebar = document.getElementById('guildsSidebar');
    const dmServerBtn = document.getElementById('dmServerBtn');
    const publicServerBtn = document.getElementById('publicServerBtn');
    const dmChannelsSection = document.getElementById('dmChannelsSection');
    const serverChannelsSection = document.getElementById('serverChannelsSection');
    const dmChannelsList = document.getElementById('dmChannelsList');
    const serverChannelsList = document.getElementById('serverChannelsList');
    
    const addServerBtnTrigger = document.getElementById('addServerBtnTrigger');
    const openCreateChannelBtn = document.getElementById('openCreateChannelBtn');
    const serverModalOverlay = document.getElementById('serverModalOverlay');
    const channelModalOverlay = document.getElementById('channelModalOverlay');
    const closeServerModalBtn = document.getElementById('closeServerModalBtn');
    const closeChannelModalBtn = document.getElementById('closeChannelModalBtn');
    const submitCreateServerBtn = document.getElementById('submitCreateServerBtn');
    const submitCreateChannelBtn = document.getElementById('submitCreateChannelBtn');
    const newServerNameInput = document.getElementById('newServerNameInput');
    const newChannelNameInput = document.getElementById('newChannelNameInput');

    const openFullProfileBtn = document.getElementById('openFullProfileBtn') || document.querySelector('.user-avatar-header'); 
    const profileModalOverlay = document.getElementById('profileModalOverlay');
    const authModalOverlay = document.getElementById('authModalOverlay');
    const authLoginInput = document.getElementById('authLoginInput');
    const authPasswordInput = document.getElementById('authPasswordInput');
    const authSubmitBtn = document.getElementById('authSubmitBtn');

    let myName = localStorage.getItem('chat_active_user') || '';
    let selectedAvatarColor = localStorage.getItem('chat_avatar_color_' + myName) || '#5865f2';
    let uploadedAvatarDataUrl = localStorage.getItem('chat_avatar_image_' + myName) || '';
    
    let currentServerContext = 'dm'; 
    let currentChannelContext = 'friends-list';
    const CREATOR_NICKNAME = 'dj1ka';

    function checkUserSession() {
        if (!myName) {
            if (authModalOverlay) authModalOverlay.classList.add('active');
        } else {
            if (authModalOverlay) authModalOverlay.classList.remove('active');
            initChatAfterAuth();
        }
    }

        if (authSubmitBtn) {
        authSubmitBtn.addEventListener('click', async () => {
            const login = authLoginInput.value.trim();
            const password = authPasswordInput.value.trim();
            if (!login || !password) { alert('Заполните все поля!'); return; }
            
            try {
                // Правильный синтаксис для compat-версии Firestore
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

    function initChatAfterAuth() {
        if (userHeaderName) userHeaderName.textContent = myName;
        if (openFullProfileBtn) openFullProfileBtn.textContent = myName.charAt(0).toUpperCase();
        
        const chatArea = document.getElementById('chatArea');
        if (chatArea) chatArea.style.display = 'flex'; 

        if (myName === CREATOR_NICKNAME && goToAdminRequestsBtn) {
            goToAdminRequestsBtn.style.display = 'block';
            listenToPendingRequests();
        }
        
        // ВОТ ЭТУ СТРОЧКУ ДОБАВЬ: имитируем клик на главную кнопку публичного сервера при входе
        if (publicServerBtn) {
            publicServerBtn.click();
        } else {
            loadSavedMessages();
        }
    }

       function listenToPendingRequests() {
        if (!adminRequestsList || !requestsCountBadge || !noRequestsText) return;
        
        // Правильное онлайн-слушание коллекции users в compat-версии
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

                    // Исправленное отклонение аккаунта в базе
                    card.querySelector('.request-decline-btn').addEventListener('click', async () => {
                        await db.collection("users").doc(user.username).update({ status: 'declined' });
                      
                      });
                  
                     adminRequestsList.appendChild(card);
                 }
             }); // закрываем snapshot.forEach
            
            requestsCountBadge.textContent = count;
            noRequestsText.style.display = (count === 0) ? 'block' : 'none';
        }); // закрываем onSnapshot
    } // закрываем саму функцию listenToPendingRequests


    if (goToAdminRequestsBtn && mainSettingsScreen && adminRequestsScreen) {
        goToAdminRequestsBtn.addEventListener('click', (e) => {
            e.stopPropagation(); mainSettingsScreen.style.display = 'none'; adminRequestsScreen.style.display = 'block';
        });
    }
    if (backToMenuFromAdminBtn && mainSettingsScreen && adminRequestsScreen) {
        backToMenuFromAdminBtn.addEventListener('click', (e) => {
            e.stopPropagation(); adminRequestsScreen.style.display = 'none'; mainSettingsScreen.style.display = 'block';
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('chat_active_user'); window.location.reload();
        });
    }

    function saveMessagesToStorage() {
        if (!messagesContainer) return;
        const key = `chat_history_${currentServerContext}_${currentChannelContext}`;
        const messagesData = [];
        messagesContainer.querySelectorAll('.message').forEach(msg => {
            const author = msg.querySelector('strong').textContent;
            const text = msg.querySelector('.message-text').textContent;
            messagesData.push({ author, text });
        });
        localStorage.setItem(key, JSON.stringify(messagesData));
    }

  function loadSavedMessages() {
    if (!messagesContainer) return;
    messagesContainer.innerHTML = ''; 

    if (messagesListener) messagesListener();

    messagesListener = db.collection("messages")
        .where("server", "==", currentServerContext)
        .where("channel", "==", currentChannelContext)
        .orderBy("timestamp", "asc")
        .onSnapshot((snapshot) => {
            messagesContainer.innerHTML = ''; 
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

    function appendMessage(sender, text, isHistory = false) {
        if (!messagesContainer) return;
        const canDelete = (myName === CREATOR_NICKNAME) || (sender === myName);
        const canEdit = (sender === myName); 
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        let actionsHtml = '';
        if (canEdit) actionsHtml += `<button class="action-btn edit-btn" title="Редактировать">✏️</button>`;
        if (canDelete) actionsHtml += `<button class="action-btn delete-btn" title="Удалить">🗑️</button>`;
        const firstLetter = sender.charAt(0).toUpperCase();
        const avatarColor = (sender === myName) ? selectedAvatarColor : '#23a55a';

        messageElement.innerHTML = `
            <div class="user-avatar" style="background-color: ${avatarColor};">
                ${uploadedAvatarDataUrl && (sender === myName) ? `<img src="${uploadedAvatarDataUrl}" alt="avatar">` : firstLetter}
            </div>
            <div class="message-content"><strong>${sender}</strong><span class="message-text"></span></div>
            <div class="message-actions">${actionsHtml}<button class="action-btn arrow-btn" title="Еще">></button></div>
        `;
        messageElement.querySelector('.message-text').textContent = text;
        messagesContainer.appendChild(messageElement);

        const editBtn = messageElement.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation(); if (messageElement.classList.contains('editing-mode')) return;
                const messageContent = messageElement.querySelector('.message-content');
                const messageTextSpan = messageElement.querySelector('.message-text');
                const oldText = messageTextSpan.textContent;
                messageElement.classList.add('editing-mode');
                const editForm = document.createElement('div');
                editForm.className = 'message-edit-form';
                editForm.innerHTML = `<input type="text" class="message-edit-input" value="${oldText}"><div class="edit-form-buttons"><button class="edit-save-btn">Сохранить</button><button class="edit-cancel-btn">Отмена</button></div>`;
                messageTextSpan.style.display = 'none'; messageContent.appendChild(editForm);
                const editInput = editForm.querySelector('.message-edit-input'); editInput.focus();
                const saveChanges = () => {
                    const newText = editInput.value.trim(); if (newText !== '') messageTextSpan.textContent = newText;
                    saveMessagesToStorage(); closeEditForm();
                };
                const closeEditForm = () => { editForm.remove(); messageTextSpan.style.display = 'block'; messageElement.classList.remove('editing-mode'); };
                editForm.querySelector('.edit-save-btn').addEventListener('click', saveChanges);
                editForm.querySelector('.edit-cancel-btn').addEventListener('click', closeEditForm);
            });
        }

        const deleteBtn = messageElement.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); messageElement.classList.add('deleting');
                setTimeout(() => { messageElement.remove(); saveMessagesToStorage(); }, 200);
            });
        }

        const arrowBtn = messageElement.querySelector('.arrow-btn');
        if (arrowBtn) {
            arrowBtn.addEventListener('click', (e) => {
                e.stopPropagation(); if (sender === myName) { alert('Нельзя добавлять себя!'); return; }
                let userMenu = messageElement.querySelector('.user-action-menu');
                if (!userMenu) {
                    userMenu = document.createElement('div'); userMenu.className = 'user-action-menu';
                    userMenu.innerHTML = `<div class="menu-item add-friend">Добавить в друзья</div>`;
                    messageElement.appendChild(userMenu);
                    userMenu.querySelector('.add-friend').addEventListener('click', (eClick) => {
                        eClick.stopPropagation(); addNotification('friend', sender);
                        userMenu.classList.remove('visible'); arrowBtn.classList.remove('open');
                    });
                }
                arrowBtn.classList.toggle('open'); userMenu.classList.toggle('visible');
            });
        }
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        if (!isHistory) saveMessagesToStorage();
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


    if (sendBtn) sendBtn.addEventListener('click', handleSendMessage);
    if (messageInput) messageInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSendMessage(); });

    if (openSettingsBtn && settingsSidebar) {
        openSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation(); if (notificationsDropdown) notificationsDropdown.classList.remove('visible');
            settingsSidebar.classList.toggle('active');
        });
    }

    if (notificationBell && notificationsDropdown) {
        notificationBell.addEventListener('click', (e) => {
            e.stopPropagation(); if (settingsSidebar) settingsSidebar.classList.remove('active');
            notificationsDropdown.classList.toggle('visible'); if (bellBadge) bellBadge.classList.remove('active');
        });
    }

    if (guildsSidebar) {
        guildsSidebar.addEventListener('click', (e) => {
            if (e.target === guildsSidebar && addServerBtnTrigger) addServerBtnTrigger.classList.add('spawned');
        });
    }

    if (addServerBtnTrigger && serverModalOverlay) {
        addServerBtnTrigger.addEventListener('click', (e) => {
            e.stopPropagation(); serverModalOverlay.classList.add('active');
            if (newServerNameInput) { newServerNameInput.value = ''; newServerNameInput.focus(); }
        });
    }

    if (openCreateChannelBtn && channelModalOverlay) {
        openCreateChannelBtn.addEventListener('click', (e) => {
            e.stopPropagation(); channelModalOverlay.classList.add('active');
            if (newChannelNameInput) { newChannelNameInput.value = ''; newChannelNameInput.focus(); }
        });
    }

    if (closeServerModalBtn && serverModalOverlay) closeServerModalBtn.addEventListener('click', () => serverModalOverlay.classList.remove('active'));
    if (closeChannelModalBtn && channelModalOverlay) closeChannelModalBtn.addEventListener('click', () => channelModalOverlay.classList.remove('active'));

    if (submitCreateServerBtn && serverModalOverlay && newServerNameInput && guildsSidebar) {
        submitCreateServerBtn.addEventListener('click', () => {
            const name = newServerNameInput.value.trim(); if (!name) { alert('Введите имя сервера!'); return; }
            const serverId = 'custom_server_' + Date.now();
            const newServerBtn = document.createElement('div');
            newServerBtn.className = 'guild-icon'; newServerBtn.id = serverId;
            newServerBtn.textContent = name.charAt(0).toUpperCase(); newServerBtn.title = name;

            newServerBtn.addEventListener('click', () => {
                document.querySelectorAll('.guild-icon').forEach(g => g.classList.remove('active'));
                newServerBtn.classList.add('active');
                currentServerContext = serverId; currentChannelContext = 'general-chat';
                if (chatTitle) chatTitle.textContent = 'general-chat'; if (hashtag) hashtag.textContent = '#';
                if (dmChannelsSection) dmChannelsSection.style.display = 'none';
                if (serverChannelsSection) serverChannelsSection.style.display = 'block';
                renderServerChannelsList(serverId); loadSavedMessages();
            });

            guildsSidebar.insertBefore(newServerBtn, addServerBtnTrigger);
            serverModalOverlay.classList.remove('active');
            const savedServers = JSON.parse(localStorage.getItem('chat_custom_servers') || '[]');
            savedServers.push({ id: serverId, name: name });
            localStorage.setItem('chat_custom_servers', JSON.stringify(savedServers));
        });
    }

    if (submitCreateChannelBtn && channelModalOverlay && newChannelNameInput) {
        submitCreateChannelBtn.addEventListener('click', () => {
            const name = newChannelNameInput.value.trim().toLowerCase().replace(/\s+/g, '-'); if (!name) { alert('Имя канала!'); return; }
            const channelId = 'channel_' + Date.now();
            const storageKey = 'channels_for_' + currentServerContext;
            const savedChannels = JSON.parse(localStorage.getItem(storageKey) || '[]');
            savedChannels.push({ id: channelId, name: name });
            localStorage.setItem(storageKey, JSON.stringify(savedChannels));
            channelModalOverlay.classList.remove('active'); renderServerChannelsList(currentServerContext); 
        });
    }

    function renderServerChannelsList(serverId) {
        if (!serverChannelsList) return;
        serverChannelsList.innerHTML = ''; 
        const defaultChannel = document.createElement('div');
        defaultChannel.className = 'custom-user-item' + (currentChannelContext === 'general-chat' ? ' active' : '');
        defaultChannel.innerHTML = `<div class="user-avatar" style="background-color: #5865f2;">#</div><span>general-chat</span>`;
        defaultChannel.addEventListener('click', () => {
            serverChannelsList.querySelectorAll('.custom-user-item').forEach(i => i.classList.remove('active'));
            defaultChannel.classList.add('active'); currentChannelContext = 'general-chat';
            if (chatTitle) chatTitle.textContent = 'general-chat'; loadSavedMessages();
        });
        serverChannelsList.appendChild(defaultChannel);

        const storageKey = 'channels_for_' + serverId;
        const savedChannels = JSON.parse(localStorage.getItem(storageKey) || '[]');
        savedChannels.forEach(ch => {
            const channelItem = document.createElement('div');
            channelItem.className = 'custom-user-item' + (currentChannelContext === ch.id ? ' active' : '');
            channelItem.innerHTML = `<div class="user-avatar" style="background-color: #383a40;">#</div><span>${ch.name}</span>`;
            channelItem.addEventListener('click', () => {
                serverChannelsList.querySelectorAll('.custom-user-item').forEach(i => i.classList.remove('active'));
                channelItem.classList.add('active'); currentChannelContext = ch.id;
                if (chatTitle) chatTitle.textContent = ch.name; loadSavedMessages();
            });
            serverChannelsList.appendChild(channelItem);
        });
    }
    function loadSavedServersFromMemory() {
        if (!guildsSidebar || !addServerBtnTrigger) return;
        const savedServers = JSON.parse(localStorage.getItem('chat_custom_servers') || '[]');
        savedServers.forEach(srv => {
            const btn = document.createElement('div');
            btn.className = 'guild-icon'; btn.id = srv.id;
            btn.textContent = srv.name.charAt(0).toUpperCase(); btn.title = srv.name;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.guild-icon').forEach(g => g.classList.remove('active'));
                btn.classList.add('active'); currentServerContext = srv.id; currentChannelContext = 'general-chat';
                if (chatTitle) chatTitle.textContent = 'general-chat'; if (hashtag) hashtag.textContent = '#';
                if (dmChannelsSection) dmChannelsSection.style.display = 'none';
                if (serverChannelsSection) serverChannelsSection.style.display = 'block';
                renderServerChannelsList(srv.id); loadSavedMessages();
            });
            guildsSidebar.insertBefore(btn, addServerBtnTrigger);
        });
    }

    if (dmServerBtn) {
        dmServerBtn.addEventListener('click', () => {
            document.querySelectorAll('.guild-icon').forEach(g => g.classList.remove('active'));
            dmServerBtn.classList.add('active'); currentServerContext = 'dm'; currentChannelContext = 'friends-list';
            if (chatTitle) chatTitle.textContent = 'Личные сообщения'; if (hashtag) hashtag.textContent = '@';
            if (serverChannelsSection) serverChannelsSection.style.display = 'none';
            if (dmChannelsSection) dmChannelsSection.style.display = 'block';
            loadSavedMessages();
        });
    }

    if (publicServerBtn) {
        publicServerBtn.addEventListener('click', () => {
            document.querySelectorAll('.guild-icon').forEach(g => g.classList.remove('active'));
            publicServerBtn.classList.add('active'); currentServerContext = 'public'; currentChannelContext = 'general-chat';
            if (chatTitle) chatTitle.textContent = 'general-chat'; if (hashtag) hashtag.textContent = '#';
            if (dmChannelsSection) dmChannelsSection.style.display = 'none';
            if (serverChannelsSection) serverChannelsSection.style.display = 'block';
            renderServerChannelsList('public'); loadSavedMessages();
        });
    }

    const zonesTriggerBtn = document.getElementById('goToZonesBtn');
    const returnToMenuBtn = document.getElementById('backToMenuBtn');
    if (zonesTriggerBtn && mainSettingsScreen && zoneSettingsScreen) {
        zonesTriggerBtn.addEventListener('click', (e) => { e.stopPropagation(); mainSettingsScreen.style.display = 'none'; zoneSettingsScreen.style.display = 'block'; });
    }
    if (returnToMenuBtn && mainSettingsScreen && zoneSettingsScreen) {
        returnToMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation(); zoneSettingsScreen.style.display = 'none'; mainSettingsScreen.style.display = 'block';
            if (activeZoneKey && zones[activeZoneKey]) zones[activeZoneKey].classList.remove('zone-highlight');
            activeZoneKey = ''; if (zoneSelectTrigger) zoneSelectTrigger.innerHTML = 'Выберите зону <span class="select-arrow">▼</span>';
        });
    }
    if (zoneSelectTrigger && zoneSelectOptions) {
        zoneSelectTrigger.addEventListener('click', (e) => { e.stopPropagation(); zoneSelectOptions.classList.toggle('active'); });
    }

    document.querySelectorAll('.custom-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            if (activeZoneKey && zones[activeZoneKey]) zones[activeZoneKey].classList.remove('zone-highlight');
            activeZoneKey = option.getAttribute('data-value');
            if (zoneSelectTrigger) zoneSelectTrigger.innerHTML = option.textContent + ' <span class="select-arrow">▼</span>';
            if (zoneSelectOptions) zoneSelectOptions.classList.remove('active');
            if (activeZoneKey && zones[activeZoneKey]) {
                zones[activeZoneKey].classList.add('zone-highlight');
                let currentBg = window.getComputedStyle(zones[activeZoneKey]).backgroundColor;
                if (customColorInput) {
                    let rgbValues = currentBg.match(/\d+/g);
                    if (rgbValues && rgbValues.length >= 3) {
                        let r = parseInt(rgbValues), g = parseInt(rgbValues), b = parseInt(rgbValues);
                        let hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                        customColorInput.value = hex;
                    }
                }
            }
        });
    });

    if (applyColorBtn) {
        applyColorBtn.addEventListener('click', () => {
            if (!activeZoneKey || !zones[activeZoneKey]) { alert('Выберите зону!'); return; }
            zones[activeZoneKey].style.backgroundColor = customColorInput.value;
            zones[activeZoneKey].classList.remove('zone-highlight');
            activeZoneKey = ''; if (zoneSelectTrigger) zoneSelectTrigger.innerHTML = 'Выберите зону <span class="select-arrow">▼</span>';
            alert('Цвет изменен!');
        });
    }

    function checkEmptyNotifications() { if (notifList && notifList.children.length === 0 && notifEmptyText) notifEmptyText.style.display = 'block'; }

    function addNotification(type, senderName) {
        if (!notifList || !bellBadge || !notifEmptyText) return;
        if (type === 'friend') bellBadge.classList.add('active');
        notifEmptyText.style.display = 'none';
        const notifItem = document.createElement('div'); notifItem.className = 'notification-item';
        let titleText = type === 'system' ? 'Системное обеспечение' : 'ЗАПРОС В ДРУЗЬЯ';
        let mainText = type === 'friend' ? `${senderName} отправил запрос.` : senderName;
        let actionsHtml = type === 'friend' ? `<div class="notif-actions"><button class="notif-action-btn accept-btn">✔️</button></div>` : '';
        notifItem.innerHTML = `<div class="notif-blur-target"><div class="notif-title">${titleText}</div><div class="notif-text">${mainText}</div></div>${actionsHtml}`;
        if (type === 'friend') {
            notifItem.querySelector('.accept-btn').addEventListener('click', (e) => {
                e.stopPropagation(); createDirectMessageItem(senderName); notifItem.remove(); checkEmptyNotifications();
            });
        }
        notifList.insertBefore(notifItem, notifList.firstChild)
  
function createDirectMessageItem(username) {

        if (!dmChannelsList) return;
        if (Array.from(dmChannelsList.querySelectorAll('span')).some(span => span.textContent === username)) return;
        const userItem = document.createElement('div'); userItem.className = 'custom-user-item'; 
        userItem.innerHTML = `<div class="user-avatar" style="background-color: #5865f2;">${username.charAt(0).toUpperCase()}</div><span>${username}</span>`;
        dmChannelsList.appendChild(userItem);
    }

    document.addEventListener('click', (e) => {
        const selectOptions = document.getElementById('zoneSelectOptions');
        if (selectOptions) selectOptions.classList.remove('active');
        if (settingsSidebar && openSettingsBtn && !settingsSidebar.contains(e.target) && !openSettingsBtn.contains(e.target)) settingsSidebar.classList.remove('active');
        if (notificationsDropdown && notificationBell && !notificationsDropdown.contains(e.target) && !notificationBell.contains(e.target)) notificationsDropdown.classList.remove('visible');
        if (serverModalOverlay && e.target === serverModalOverlay) serverModalOverlay.classList.remove('active');
        if (channelModalOverlay && e.target === channelModalOverlay) channelModalOverlay.classList.remove('active');
        if (profileModalOverlay && e.target === profileModalOverlay) profileModalOverlay.classList.remove('active');
    });

    checkUserSession(); loadSavedServersFromMemory();
}
