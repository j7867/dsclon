document.addEventListener('DOMContentLoaded', () => {

    // === 1. БАЗОВЫЕ ЭЛЕМЕНТЫ И ШАПКА ЧАТА ===
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatTitle = document.getElementById('chatTitle'); 
    const hashtag = document.querySelector('.hashtag');
    const userHeaderName = document.querySelector('.user-name-header');

    // === 2. КНОПКИ И ПАНЕЛИ ШАПКИ ===
    const openSettingsBtn = document.querySelector('.settings-gear-trigger') || document.getElementById('openSettingsBtn'); 
    const notificationBell = document.querySelector('.notification-bell') || document.getElementById('notificationBell');
    const settingsSidebar = document.getElementById('settingsSidebar');
    const notificationsDropdown = document.getElementById('notificationsDropdown');
    const bellBadge = document.getElementById('bellBadge');
    const notifList = document.getElementById('notifList');
    const notifEmptyText = document.getElementById('notifEmptyText');

    // === 3. НАСТРОЙКИ ЗОН ===
    const mainSettingsScreen = document.getElementById('mainSettingsScreen');
    const zoneSettingsScreen = document.getElementById('zoneSettingsScreen');
    const zoneSelectTrigger = document.getElementById('zoneSelectTrigger');
    const zoneSelectOptions = document.getElementById('zoneSelectOptions');
    const customColorInput = document.getElementById('customColorInput');
    const colorPreviewCircle = document.getElementById('colorPreviewCircle');
    const applyColorBtn = document.getElementById('applyColorBtn');

    const zones = {
        chatArea: document.getElementById('chatArea'),
        channelsSidebar: document.getElementById('channelsSidebar'),
        guildsSidebar: document.getElementById('guildsSidebar'),
        settingsSidebar: document.getElementById('settingsSidebar')
    };
    let activeZoneKey = '';

    // === 4. СЕРВЕРЫ И КАНАЛЫ (ДИНАМИКА) ===
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

    // === 5. МОДАЛКА ПРОФИЛЯ И АККАУНТОВ ===
    const openFullProfileBtn = document.getElementById('openFullProfileBtn') || document.querySelector('.user-avatar-header'); 
    const profileModalOverlay = document.getElementById('profileModalOverlay');
    const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
    const profileNicknameInput = document.getElementById('profileNicknameInput');
    const saveProfileChangesBtn = document.getElementById('saveProfileChangesBtn');

    const authModalOverlay = document.getElementById('authModalOverlay');
    const authLoginInput = document.getElementById('authLoginInput');
    const authPasswordInput = document.getElementById('authPasswordInput');
    const authSubmitBtn = document.getElementById('authSubmitBtn');

    // СОСТОЯНИЕ СЕССИИ И ПРАВА СОЗДАТЕЛЯ
    let myName = localStorage.getItem('chat_active_user') || '';
    let selectedAvatarColor = localStorage.getItem('chat_avatar_color_' + myName) || '#5865f2';
    let uploadedAvatarDataUrl = localStorage.getItem('chat_avatar_image_' + myName) || '';
    let notificationsCount = 0;
    
    let currentServerContext = 'dm'; 
    let currentChannelContext = 'friends-list';
    const IS_CREATOR = true; 

    // ==========================================
    // ЛОГИКА СИСТЕМЫ АККАУНТОВ (ВХОД / ПАРОЛЬ)
    // ==========================================
    function checkUserSession() {
        if (!myName) {
            if (authModalOverlay) authModalOverlay.classList.add('active');
        } else {
            if (authModalOverlay) authModalOverlay.classList.remove('active');
            initChatAfterAuth();
        }
    }

    if (authSubmitBtn) {
        authSubmitBtn.addEventListener('click', () => {
            const login = authLoginInput.value.trim();
            const password = authPasswordInput.value.trim();

            if (!login || !password) {
                alert('Пожалуйста, заполните все поля!');
                return;
            }

            const savedPassword = localStorage.getItem('user_pass_' + login);
            if (savedPassword) {
                if (savedPassword !== password) {
                    alert('Неверный пароль для данного никнейма!');
                    return;
                }
            } else {
                localStorage.setItem('user_pass_' + login, password);
                alert('Новый аккаунт успешно создан и зарегистрирован!');
            }

            localStorage.setItem('chat_active_user', login);
            myName = login;
            if (authModalOverlay) authModalOverlay.classList.remove('active');
            initChatAfterAuth();
        });
    }

    function initChatAfterAuth() {
        if (userHeaderName) userHeaderName.textContent = myName;
        if (openFullProfileBtn) openFullProfileBtn.textContent = myName.charAt(0).toUpperCase();
        selectedAvatarColor = localStorage.getItem('chat_avatar_color_' + myName) || '#5865f2';
        uploadedAvatarDataUrl = localStorage.getItem('chat_avatar_image_' + myName) || '';
        loadSavedMessages();
    }

    // ==========================================
    // СОХРАНЕНИЕ И ЗАГРУЗКА ИСТОРИИ СООБЩЕНИЙ
    // ==========================================
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
        const key = `chat_history_${currentServerContext}_${currentChannelContext}`;
        const saved = localStorage.getItem(key);
        messagesContainer.innerHTML = ''; 
        if (saved) {
            const messagesData = JSON.parse(saved);
            messagesData.forEach(data => {
                appendMessage(data.author, data.text, true); 
            });
        }
    }
    // ==========================================
    // РЕНДЕР СООБЩЕНИЙ И АДМИН-УДАЛЕНИЕ
    // ==========================================
    function appendMessage(sender, text, isHistory = false) {
        if (!messagesContainer) return;
        
        const canDelete = IS_CREATOR || (sender === myName);
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
            <div class="message-content">
                <strong>${sender}</strong>
                <span class="message-text"></span>
            </div>
            <div class="message-actions">
                ${actionsHtml}
                <button class="action-btn arrow-btn" title="Еще">></button>
            </div>
        `;
        
        messageElement.querySelector('.message-text').textContent = text;
        messagesContainer.appendChild(messageElement);

        // Обработчик кнопки редактирования (Пункт 2)
        const editBtn = messageElement.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (messageElement.classList.contains('editing-mode')) return;
                const messageContent = messageElement.querySelector('.message-content');
                const messageTextSpan = messageElement.querySelector('.message-text');
                const oldText = messageTextSpan.textContent;
                messageElement.classList.add('editing-mode');

                const editForm = document.createElement('div');
                editForm.className = 'message-edit-form';
                editForm.innerHTML = `
                    <input type="text" class="message-edit-input" value="${oldText}" autocomplete="off">
                    <div class="edit-form-buttons">
                        <button class="edit-save-btn">Сохранить</button>
                        <button class="edit-cancel-btn">Отмена</button>
                    </div>
                `;
                messageTextSpan.style.display = 'none';
                messageContent.appendChild(editForm);

                const editInput = editForm.querySelector('.message-edit-input');
                editInput.focus();

                const saveChanges = () => {
                    const newText = editInput.value.trim();
                    if (newText !== '') {
                        messageTextSpan.textContent = newText;
                        saveMessagesToStorage(); 
                    }
                    closeEditForm();
                };
                const closeEditForm = () => {
                    editForm.remove();
                    messageTextSpan.style.display = 'block';
                    messageElement.classList.remove('editing-mode');
                };

                editForm.querySelector('.edit-save-btn').addEventListener('click', saveChanges);
                editForm.querySelector('.edit-cancel-btn').addEventListener('click', closeEditForm);
            });
        }

        // Обработчик анимированного удаления (Пункт 4)
        const deleteBtn = messageElement.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                messageElement.classList.add('deleting');
                setTimeout(() => { 
                    messageElement.remove(); 
                    saveMessagesToStorage(); 
                }, 200);
            });
        }

        // Стрелочка меню (Запрос в друзья + запрет самого себя)
        const arrowBtn = messageElement.querySelector('.arrow-btn');
        if (arrowBtn) {
            arrowBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // ЗАПРЕТ ДОБАВЛЕНИЯ САМОГО СЕБЯ (Пункт 9)
                if (sender === myName) {
                    alert('Вы не можете отправить запрос в друзья самому себе!');
                    return;
                }

                let userMenu = messageElement.querySelector('.user-action-menu');
                if (!userMenu) {
                    userMenu = document.createElement('div');
                    userMenu.className = 'user-action-menu';
                    userMenu.innerHTML = `<div class="menu-item add-friend">Добавить в друзья</div>`;
                    messageElement.appendChild(userMenu);
                    userMenu.querySelector('.add-friend').addEventListener('click', (eClick) => {
                        eClick.stopPropagation();
                        addNotification('friend', sender);
                        userMenu.classList.remove('visible');
                        arrowBtn.classList.remove('open');
                    });
                }
                arrowBtn.classList.toggle('open');
                userMenu.classList.toggle('visible');
            });
        }

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        if (!isHistory) saveMessagesToStorage();
    }
    // === НАВИГАЦИЯ КАСТОМНЫХ ЗОН ===
    const zonesTriggerBtn = document.getElementById('goToZonesBtn');
    const returnToMenuBtn = document.getElementById('backToMenuBtn');

    if (zonesTriggerBtn && mainSettingsScreen && zoneSettingsScreen) {
        zonesTriggerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mainSettingsScreen.style.display = 'none';
            zoneSettingsScreen.style.display = 'block';
        });
    }

    if (returnToMenuBtn && mainSettingsScreen && zoneSettingsScreen) {
        returnToMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            zoneSettingsScreen.style.display = 'none';
            mainSettingsScreen.style.display = 'block';
            if (activeZoneKey && zones[activeZoneKey]) zones[activeZoneKey].classList.remove('zone-highlight');
            activeZoneKey = '';
            if (zoneSelectTrigger) zoneSelectTrigger.innerHTML = 'Выберите зону <span class="select-arrow">▼</span>';
        });
    }

    if (zoneSelectTrigger && zoneSelectOptions) {
        zoneSelectTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            zoneSelectOptions.classList.toggle('active');
        });
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
                        let r = parseInt(rgbValues[0]), g = parseInt(rgbValues[1]), b = parseInt(rgbValues[2]);
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
            const chosenColor = customColorInput.value;
            zones[activeZoneKey].style.backgroundColor = chosenColor;
            zones[activeZoneKey].classList.remove('zone-highlight');
            activeZoneKey = '';
            if (zoneSelectTrigger) zoneSelectTrigger.innerHTML = 'Выберите зону <span class="select-arrow">▼</span>';
            alert('Цвет изменен!');
        });
    }

    function checkEmptyNotifications() {
        if (notifList && notifList.children.length === 0 && notifEmptyText) notifEmptyText.style.display = 'block';
    }

    function addNotification(type, senderName) {
        if (!notifList || !bellBadge || !notifEmptyText) return;
        if (type === 'friend') bellBadge.classList.add('active');
        notifEmptyText.style.display = 'none';

        const notifItem = document.createElement('div');
        notifItem.className = 'notification-item';
        let titleText = type === 'system' ? 'Системное обеспечение' : 'ЗАПРОС В ДРУЗЬЯ';
        let mainText = type === 'friend' ? `${senderName} отправил запрос в друзья.` : senderName;
        let actionsHtml = type === 'friend' ? `<div class="notif-actions"><button class="notif-action-btn accept-btn">✔️</button></div>` : '';

        notifItem.innerHTML = `<div class="notif-blur-target"><div class="notif-title">${titleText}</div><div class="notif-text">${mainText}</div></div>${actionsHtml}`;
        
        if (type === 'friend') {
            notifItem.querySelector('.accept-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                createDirectMessageItem(senderName); 
                notifItem.remove();
                checkEmptyNotifications();
            });
        }
        notifList.insertBefore(notifItem, notifList.firstChild);
    }

    function createDirectMessageItem(username) {
        if (!dmChannelsList) return;
        const exists = Array.from(dmChannelsList.querySelectorAll('span')).some(span => span.textContent === username);
        if (exists) return;

        const userItem = document.createElement('div');
        userItem.className = 'custom-user-item'; 
        const randomColor = ['#5865f2', '#23a55a', '#f23f43'][Math.floor(Math.random() * 3)];
        userItem.innerHTML = `<div class="user-avatar" style="background-color: ${randomColor};">${username.charAt(0).toUpperCase()}</div><span>${username}</span>`;
        dmChannelsList.appendChild(userItem);
    }

    // Глобальное закрытие менюшек по клику на документ
    document.addEventListener('click', (e) => {
        const selectOptions = document.getElementById('zoneSelectOptions');
        if (selectOptions) selectOptions.classList.remove('active');
        if (settingsSidebar && openSettingsBtn && !settingsSidebar.contains(e.target) && !openSettingsBtn.contains(e.target)) {
            settingsSidebar.classList.remove('active');
        }
        if (notificationsDropdown && notificationBell && !notificationsDropdown.contains(e.target) && !notificationBell.contains(e.target)) {
            notificationsDropdown.classList.remove('visible');
        }
        if (serverModalOverlay && e.target === serverModalOverlay) serverModalOverlay.classList.remove('active');
        if (channelModalOverlay && e.target === channelModalOverlay) channelModalOverlay.classList.remove('active');
        if (profileModalOverlay && e.target === profileModalOverlay) profileModalOverlay.classList.remove('active');
    });

    // Запуск сессии и проверка памяти при старте
    checkUserSession();
    loadSavedServersFromMemory();
});
