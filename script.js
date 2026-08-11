document.addEventListener('DOMContentLoaded', () => {

    // === 1. БАЗОВЫЕ ЭЛЕМЕНТЫ ЧАТА ===
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
    const goToZonesBtn = document.getElementById('goToZonesBtn');
    const backToMenuBtn = document.getElementById('backToMenuBtn');
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

    // === 4. СЕРВЕРЫ И КАНАЛЫ ===
    const dmServerBtn = document.getElementById('dmServerBtn');
    const publicServerBtn = document.getElementById('publicServerBtn');
    const dmChannelsSection = document.getElementById('dmChannelsSection');
    const serverChannelsSection = document.getElementById('serverChannelsSection');
    const dmChannelsList = document.getElementById('dmChannelsList');

    // === 5. МОДАЛКА ПРОФИЛЯ ===
    const openFullProfileBtn = document.getElementById('openFullProfileBtn'); 
    const profileModalOverlay = document.getElementById('profileModalOverlay');
    const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
    const profileNicknameInput = document.getElementById('profileNicknameInput');
    const saveProfileChangesBtn = document.getElementById('saveProfileChangesBtn');
    const profileImageFileInput = document.getElementById('profileImageFileInput');
    const uploadAvatarFileBtn = document.getElementById('uploadAvatarFileBtn');
    const resetAvatarFileBtn = document.getElementById('resetAvatarFileBtn');

    // === ПЕРЕМЕННЫЕ СОСТОЯНИЯ И АВТОРИЗАЦИИ ===
    let myName = localStorage.getItem('chat_nickname') || 'AdminCreator';
    let selectedAvatarColor = localStorage.getItem('chat_avatar_color') || '#5865f2';
    let uploadedAvatarDataUrl = localStorage.getItem('chat_avatar_image') || '';
    let notificationsCount = 0;

    // ПРАВА АДМИНИСТРАТОРА (Удаление любых сообщений)
    const IS_CREATOR = true; 

    // Простая система авторизации аккаунтов (Пункт 1)
    if (!localStorage.getItem('chat_nickname')) {
        const askName = prompt('Введите ваш логин (никнейм) для входа в аккаунт:', 'AdminCreator');
        if (askName && askName.trim() !== '') {
            myName = askName.trim();
            localStorage.setItem('chat_nickname', myName);
        }
    }

    // Сохранение сообщений в память браузера (Пункт 6)
    function saveMessagesToStorage() {
        if (!messagesContainer) return;
        const messagesData = [];
        messagesContainer.querySelectorAll('.message').forEach(msg => {
            const author = msg.querySelector('strong').textContent;
            const text = msg.querySelector('.message-text').textContent;
            messagesData.push({ author, text });
        });
        localStorage.setItem('chat_saved_messages', JSON.stringify(messagesData));
    }

    // Загрузка сообщений при обновлении страницы (Пункт 6)
    function loadSavedMessages() {
        if (!messagesContainer) return;
        const saved = localStorage.getItem('chat_saved_messages');
        if (saved) {
            const messagesData = JSON.parse(saved);
            messagesContainer.innerHTML = ''; 
            messagesData.forEach(data => {
                appendMessage(data.author, data.text, true); 
            });
        }
    }

    // Рендер сообщений и экшены
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

        // Обработчик удаления (Пункт 4 - Создатель трет любого)
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
        // Стрелочка меню (Запрос в друзья + запрет самого себя - Пункты 9, 5)
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
        
        // Если это новое сообщение, а не загрузка истории — сохраняем его в базу (Пункт 6)
        if (!isHistory) saveMessagesToStorage();
    }

    function handleSendMessage() {
        if (!messageInput) return;
        const text = messageInput.value.trim();
        if (text === '') return;
        appendMessage(myName, text);
        messageInput.value = '';
    }

    if (sendBtn) sendBtn.addEventListener('click', handleSendMessage);
    if (messageInput) {
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSendMessage();
        });
    }

    // ==========================================
    // КЛИКИ ШЕСТЕРЕНКИ И КОЛОКОЛЬЧИКА (Пункт 3)
    // ==========================================
   // Показ/скрытие панели настроек по клику на шестеренку
if (openSettingsBtn && settingsSidebar) {
    openSettingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (notificationsDropdown) notificationsDropdown.classList.remove('visible');
        settingsSidebar.classList.toggle('active');
    });
}

// Показ/скрытие выпадающего списка уведомлений по клику на колокольчик
if (notificationBell && notificationsDropdown) {
    notificationBell.addEventListener('click', (e) => {
        e.stopPropagation();
        if (settingsSidebar) settingsSidebar.classList.remove('active');
        notificationsDropdown.classList.toggle('visible');
        if (bellBadge) bellBadge.classList.remove('active');
    });
}

    // ==========================================
    // ЛОГИКА УВЕДОМЛЕНИЙ И ДРУЗЕЙ В ЛС (Пункт 5)
    // ==========================================
    function checkEmptyNotifications() {
        if (notifList && notifList.children.length === 0 && notifEmptyText) {
            notifEmptyText.style.display = 'block';
        }
    }

    function addNotification(type, senderName) {
        if (!notifList || !bellBadge || !notifEmptyText) return;
        
        if (type === 'friend') {
            bellBadge.classList.add('active');
        }
        notifEmptyText.style.display = 'none';

        const notifItem = document.createElement('div');
        notifItem.className = 'notification-item';
        let titleText = type === 'system' ? 'Системное обеспечение' : 'ЗАПРОС В ДРУЗЬЯ';
        let mainText = type === 'friend' ? `${senderName} отправил вам запрос в друзья.` : senderName;
        let actionsHtml = type === 'friend' ? `<div class="notif-actions"><button class="notif-action-btn accept-btn">✔️</button><button class="notif-action-btn decline-btn">❌</button></div>` : '';

        notifItem.innerHTML = `<div class="notif-blur-target"><div class="notif-title">${titleText}</div><div class="notif-text">${mainText}</div></div>${actionsHtml}`;
        
        if (type === 'friend') {
            const acceptBtn = notifItem.querySelector('.accept-btn');
            const declineBtn = notifItem.querySelector('.decline-btn');
            const blurTarget = notifItem.querySelector('.notif-blur-target');

            // АВТОМАТИЧЕСКОЕ ДОБАВЛЕНИЕ В ЛС ПРИ ПРИНЯТИИ (Пункт 5)
            acceptBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                createDirectMessageItem(senderName); // Передаем имя друга в боковое меню ЛС
                notifItem.remove();
                checkEmptyNotifications();
                alert(`Пользователь ${senderName} успешно добавлен в список ваших личных сообщений!`);
            });

            declineBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                blurTarget.classList.add('blurred');
                const overlay = document.createElement('div');
                overlay.className = 'confirm-overlay';
                overlay.innerHTML = `<div class="confirm-title">Отклонить запрос?</div><div class="confirm-buttons"><button class="confirm-btn yes-btn">Да</button><button class="confirm-btn no-btn">Нет</button></div>`;
                notifItem.appendChild(overlay);

                overlay.querySelector('.yes-btn').addEventListener('click', () => {
                    notifItem.remove();
                    checkEmptyNotifications();
                });
                overlay.querySelector('.no-btn').addEventListener('click', () => {
                    overlay.remove();
                    blurTarget.classList.remove('blurred');
                });
            });
        }
        notifList.insertBefore(notifItem, notifList.firstChild);
    }

    // Интерактивное добавление друга в ЛС сайдбара
    function createDirectMessageItem(username) {
        if (!dmChannelsList) return;
        const exists = Array.from(dmChannelsList.querySelectorAll('span')).some(span => span.textContent === username);
        if (exists) return;

        const userItem = document.createElement('div');
        userItem.className = 'custom-user-item'; 
        const randomColor = ['#5865f2', '#23a55a', '#f23f43', '#eb459e', '#f47fff'][Math.floor(Math.random() * 5)];
        
        userItem.innerHTML = `
            <div class="user-avatar" style="background-color: ${randomColor};">${username.charAt(0).toUpperCase()}</div>
            <span>${username}</span>
        `;
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
        if (profileModalOverlay && e.target === profileModalOverlay) {
            profileModalOverlay.classList.remove('active');
        }
    });

     // === НАВИГАЦИЯ МЕЖДУ ЭКРАНАМИ НАСТРОЕК (ПЕРЕКЛЮЧЕНИЕ ЗОН) ===
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
        
        if (activeZoneKey && zones[activeZoneKey]) {
            zones[activeZoneKey].classList.remove('zone-highlight');
        }
        activeZoneKey = '';
        if (zoneSelectTrigger) zoneSelectTrigger.innerHTML = 'Выберите зону <span class="select-arrow">▼</span>';
    });
}

    // === УВЕДОМЛЕНИЯ И СЕЛЕКТОР ЗОН ===
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
            
            if (zoneSelectTrigger) {
                zoneSelectTrigger.innerHTML = option.textContent + ' <span class="select-arrow">▼</span>';
            }
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
                        if (colorPreviewCircle) colorPreviewCircle.style.backgroundColor = hex;
                    }
                }
            }
        });

        option.addEventListener('mouseenter', () => {
            const hoverZoneKey = option.getAttribute('data-value');
            if (zones[hoverZoneKey]) zones[hoverZoneKey].classList.add('zone-highlight');
        });

        option.addEventListener('mouseleave', () => {
            const hoverZoneKey = option.getAttribute('data-value');
            if (zones[hoverZoneKey] && hoverZoneKey !== activeZoneKey) {
                zones[hoverZoneKey].classList.remove('zone-highlight');
            }
        });
    });

    // Загрузка сообщений и инициализация интерфейса
    loadSavedMessages(); 
    if (userHeaderName) userHeaderName.textContent = myName;
    if (openFullProfileBtn) openFullProfileBtn.textContent = myName.charAt(0).toUpperCase();

    // Симуляция системных писем
    setTimeout(() => { addNotification('system', 'Добро пожаловать в создатель-мод чата.'); }, 2000);
});
