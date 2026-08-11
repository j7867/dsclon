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

    // === 4. СЕРВЕРЫ И КАНАЛЫ (ОБНОВЛЕНО ПОД НОВЫЕ ПЛЮСЫ) ===
    const guildsSidebar = document.getElementById('guildsSidebar');
    const dmServerBtn = document.getElementById('dmServerBtn');
    const publicServerBtn = document.getElementById('publicServerBtn');
    const dmChannelsSection = document.getElementById('dmChannelsSection');
    const serverChannelsSection = document.getElementById('serverChannelsSection');
    const dmChannelsList = document.getElementById('dmChannelsList');
    const serverChannelsList = document.getElementById('serverChannelsList');
    
    // Новые триггеры спавна серверов и каналов из HTML
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

    // === 5. МОДАЛКА ПРОФИЛЯ ===
    const openFullProfileBtn = document.getElementById('openFullProfileBtn') || document.querySelector('.user-avatar-header'); 
    const profileModalOverlay = document.getElementById('profileModalOverlay');
    const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
    const profileNicknameInput = document.getElementById('profileNicknameInput');
    const saveProfileChangesBtn = document.getElementById('saveProfileChangesBtn');

    // === 6. МОДАЛКА СИСТЕМЫ АККАУНТОВ (Пункт 1) ===
    const authModalOverlay = document.getElementById('authModalOverlay');
    const authLoginInput = document.getElementById('authLoginInput');
    const authPasswordInput = document.getElementById('authPasswordInput');
    const authSubmitBtn = document.getElementById('authSubmitBtn');

    // СОСТОЯНИЕ ТЕКУЩЕЙ СЕССИИ
    let myName = localStorage.getItem('chat_active_user') || '';
    let selectedAvatarColor = localStorage.getItem('chat_avatar_color_' + myName) || '#5865f2';
    let uploadedAvatarDataUrl = localStorage.getItem('chat_avatar_image_' + myName) || '';
    let notificationsCount = 0;
    
    // Глобальные переменные отслеживания активных комнат
    let currentServerContext = 'dm'; // 'dm', 'public', или ID кастомного сервера
    let currentChannelContext = 'general-chat';

    // ПРАВА АДМИНИСТРАТОРА (Пункт 4)
    const IS_CREATOR = true;

    // ==========================================
    // ЛОГИКА СИСТЕМЫ АККАУНТОВ (ЛОГИН / ПАРОЛЬ)
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
                // Если аккаунт уже существует — сверяем пароли
                if (savedPassword !== password) {
                    alert('Неверный пароль для данного никнейма!');
                    return;
                }
            } else {
                // Если это новый пользователь — автоматически регистрируем его
                localStorage.setItem('user_pass_' + login, password);
                alert('Новый аккаунт успешно создан и зарегистрирован!');
            }

            // Записываем активную сессию
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
    // СОХРАНЕНИЕ И ЗАГРУЗКА ИСТОРИИ СООБЩЕНИЙ (Пункт 6)
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
    // РЕНДЕР СООБЩЕНИЙ И АДМИН-УДАЛЕНИЕ (Пункт 4)
    // ==========================================
    function appendMessage(sender, text, isHistory = false) {
        if (!messagesContainer) return;
        
        // ПРАВА АДМИНИСТРАТОРА: Создатель трет любые сообщения, пользователи - только свои
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
    editForm.innerHTML = <input type="text" class="message-edit-input" value="${oldText}" autocomplete="off"> <div class="edit-form-buttons"> <button class="edit-save-btn">Сохранить</button> <button class="edit-cancel-btn">Отмена</button> </div>;
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
       if (deleteBtn) {deleteBtn.addEventListener('click', (e) => {
           e.stopPropagation();
           messageElement.classList.add('deleting');
           setTimeout(() => {
               messageElement.remove();
               saveMessagesToStorage();
           }, 200);
       });
    }
