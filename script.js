// === ИСПРАВЛЕННЫЙ ВЕРХНИЙ БЛОК ПЕРЕМЕННЫХ ===
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

const dmServerBtn = document.getElementById('dmServerBtn');
const publicServerBtn = document.getElementById('publicServerBtn');

// Ищем кнопки-круги по классам
const openSettingsBtn = document.querySelector('.settings-gear-trigger'); 
const notificationBell = document.querySelector('.notification-bell');

// ИСПРАВЛЕНО: Находим оверлеи по ID, как прописано в HTML
const settingsSidebar = document.getElementById('settingsSidebar');
const notificationsDropdown = document.getElementById('notificationsDropdown');
const bellBadge = document.getElementById('bellBadge');

// ИСПРАВЛЕНО: Находим внутренний список для писем, который находится внутри дропдауна
const notifList = document.getElementById('notifList') || document.querySelector('.notifications-dropdown');
const notifEmptyText = document.getElementById('notifEmptyText');

const goToZonesBtn = document.getElementById('goToZonesBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');
const mainSettingsScreen = document.getElementById('mainSettingsScreen');
const zoneSettingsScreen = document.getElementById('zoneSettingsScreen');

const dmChannelsSection = document.getElementById('dmChannelsSection');
const serverChannelsSection = document.getElementById('serverChannelsSection');
const dmChannelsList = document.getElementById('dmChannelsList');

// Переменные для модалки профиля
const openFullProfileBtn = document.getElementById('openFullProfileBtn'); 
const profileModalOverlay = document.getElementById('profileModalOverlay');
const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
const profileNicknameInput = document.getElementById('profileNicknameInput');
const saveProfileChangesBtn = document.getElementById('saveProfileChangesBtn');
const profileImageFileInput = document.getElementById('profileImageFileInput');
const uploadAvatarFileBtn = document.getElementById('uploadAvatarFileBtn');
const resetAvatarFileBtn = document.getElementById('resetAvatarFileBtn');

const userHeaderName = document.querySelector('.user-name-header');
const miniMenuAvatar = document.getElementById('miniMenuAvatar');
const miniMenuUsername = document.getElementById('miniMenuUsername');

const zones = {
    chatArea: document.getElementById('chatArea'),
    channelsSidebar: document.getElementById('channelsSidebar'),
    guildsSidebar: document.getElementById('guildsSidebar'),
    settingsSidebar: document.getElementById('settingsSidebar')
};
let activeZoneKey = '';
let myName = localStorage.getItem('chat_nickname') || 'User';
let selectedAvatarColor = localStorage.getItem('chat_avatar_color') || '#5865f2';
let uploadedAvatarDataUrl = localStorage.getItem('chat_avatar_image') || '';
let notificationsCount = 0;


// Переключение на вкладку Личных Сообщений (DM)
if (dmServerBtn) {
    dmServerBtn.addEventListener('click', () => {
        if (publicServerBtn) publicServerBtn.classList.remove('active');
        dmServerBtn.classList.add('active');
        if (serverChannelsSection) serverChannelsSection.style.display = 'none';
        if (dmChannelsSection) dmChannelsSection.style.display = 'block';
    });
}

// Переключение на вкладку Общего Сервера
if (publicServerBtn) {
    publicServerBtn.addEventListener('click', () => {
        if (dmServerBtn) dmServerBtn.classList.remove('active');
        publicServerBtn.classList.add('active');
        if (dmChannelsSection) dmChannelsSection.style.display = 'none';
        if (serverChannelsSection) serverChannelsSection.style.display = 'block';
        
        // Меняем шапку при переходе на общий сервер
        const chatHeaderSpan = document.querySelector('.chat-header span');
        if (chatHeaderSpan) chatHeaderSpan.textContent = '# general-chat';
    });
}

// Функция динамического добавления друга в список ЛС
function createDirectMessageItem(username) {
    if (!dmChannelsList) return;
    
    // Проверяем, нет ли уже этого пользователя в списке ЛС
    const exists = Array.from(dmChannelsList.querySelectorAll('span')).some(span => span.textContent === username);
    if (exists) return;

    const userItem = document.createElement('div');
    userItem.className = 'user-item';
    
    // Генерируем случайный цвет для аватара друга
    const randomColor = ['#5865f2', '#23a55a', '#f23f43', '#eb459e', '#f47fff'][Math.floor(Math.random() * 5)];
    
    userItem.innerHTML = `
        <div class="user-avatar" style="background-color: ${randomColor};">${username.charAt(0).toUpperCase()}</div>
        <span>${username}</span>
    `;

    // Клик по другу меняет шапку чата на общение с ним
    userItem.addEventListener('click', () => {
        dmChannelsList.querySelectorAll('.user-item').forEach(item => item.classList.remove('active'));
        userItem.classList.add('active');
        
        const chatHeaderSpan = document.querySelector('.chat-header span');
        if (chatHeaderSpan) chatHeaderSpan.textContent = `@ ${username}`;
        
        // Очищаем контейнер сообщений для имитации приватного чата
        if (messagesContainer) messagesContainer.innerHTML = '';
        appendMessage('Система', `Вы открыли приватный диалог с пользователем ${username}`);
    });

    dmChannelsList.appendChild(userItem);
}

function handleSendMessage() {
    if (!messageInput) return;
    const text = messageInput.value.trim();
    if (text === '') return;
    appendMessage(myName, text);
    messageInput.value = '';
    messageInput.focus();
}

if (sendBtn) sendBtn.addEventListener('click', handleSendMessage);
if (messageInput) {
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); handleSendMessage(); }
    });
}
function appendMessage(sender, text) {
    if (!messagesContainer) return;
    const isMyMessage = (sender === myName);
    const messageElement = document.createElement('div');
    messageElement.className = 'message'; // Жесткий класс для ховера и сетки
    
    const actionsHtml = isMyMessage 
        ? `<button class="action-btn edit-btn" title="Редактировать">✏️</button>
           <button class="action-btn delete-btn" title="Удалить">🗑️</button>`
        : '';

    // Получаем первую букву и цвет для генерации аватарки автора в сообщении
    const firstLetter = sender.charAt(0).toUpperCase();
    const avatarColor = isMyMessage ? (selectedAvatarColor || '#5865f2') : '#23a55a';

    // Формируем HTML строго под CSS-структуру
    messageElement.innerHTML = `
        <div class="user-avatar" style="background-color: ${avatarColor};">
            ${uploadedAvatarDataUrl && isMyMessage ? `<img src="${uploadedAvatarDataUrl}" alt="avatar">` : firstLetter}
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
    
    // Безопасное экранирование текста от XSS
    messageElement.querySelector('.message-text').textContent = text;
    messagesContainer.appendChild(messageElement);

    // Логика кнопки редактирования
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
                if (newText !== '') messageTextSpan.textContent = newText;
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

    // Логика анимированного удаления
    const deleteBtn = messageElement.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            messageElement.classList.add('deleting');
            setTimeout(() => { messageElement.remove(); }, 200);
        });
    }

      // Автоскролл чата вниз
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

    const deleteBtn = messageElement.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            messageElement.classList.add('deleting');
            setTimeout(() => { messageElement.remove(); }, 200);
        });
    }

    const arrowBtn = messageElement.querySelector('.arrow-btn');
    if (arrowBtn) {
        arrowBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let userMenu = messageElement.querySelector('.user-action-menu');
            if (!userMenu) {
                userMenu = document.createElement('div');
                userMenu.className = 'user-action-menu';
                userMenu.innerHTML = `<div class="menu-item add-friend">Добавить в друзья</div>`;
                messageElement.appendChild(userMenu);
                userMenu.querySelector('.add-friend').addEventListener('click', (eClick) => {
                    eClick.stopPropagation();
                    addNotification('friend', `${sender} отправил вам запрос в друзья.`);
                    userMenu.classList.remove('visible');
                });
            }
            arrowBtn.classList.toggle('open');
            userMenu.classList.toggle('visible');
        });
    }
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
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
        notificationsCount = 0;
        if (bellBadge) bellBadge.classList.remove('active');
    });
}

// Глобальный клик по документу для закрытия панелей
document.addEventListener('click', (e) => {
    // Безопасное закрытие селектора зон
    if (zoneSelectOptions) zoneSelectOptions.classList.remove('active');
    
    // Закрываем настройки, только если элементы существуют на странице
    if (settingsSidebar && openSettingsBtn) {
        if (!settingsSidebar.contains(e.target) && !openSettingsBtn.contains(e.target)) {
            settingsSidebar.classList.remove('active');
        }
    }
    
    // Закрываем уведомления, только если элементы существуют на странице
    if (notificationsDropdown && notificationBell) {
        if (!notificationsDropdown.contains(e.target) && !notificationBell.contains(e.target)) {
            notificationsDropdown.classList.remove('visible');
        }
    }

    // Закрытие контекстных меню сообщений
    document.querySelectorAll('.user-action-menu').forEach(menu => menu.classList.remove('visible'));
    document.querySelectorAll('.action-btn.arrow-btn').forEach(btn => btn.classList.remove('open'));
    
    // Новая проверка: Закрываем модалку профиля, только если кликнули по самому оверлею вокруг окна
    if (profileModalOverlay && e.target === profileModalOverlay) {
        profileModalOverlay.classList.remove('active');
    }
});


function checkEmptyNotifications() {
    if (notifList && notifList.children.length === 0 && notifEmptyText) {
        notifEmptyText.style.display = 'block';
    }
}

function addNotification(type, text) {
    if (!notifList || !bellBadge || !notifEmptyText) return;
    notificationsCount++;
    bellBadge.classList.add('active');
    notifEmptyText.style.display = 'none';

    const notifItem = document.createElement('div');
    notifItem.className = 'notification-item';
    let titleText = type === 'system' ? 'Системное обеспечение' : 'ЗАПРОС В ДРУЗЬЯ';
    let actionsHtml = type === 'friend' ? `<div class="notif-actions"><button class="notif-action-btn accept-btn">✔️</button><button class="notif-action-btn decline-btn">❌</button></div>` : '';

    notifItem.innerHTML = `<div class="notif-blur-target"><div class="notif-title">${titleText}</div><div class="notif-text">${text}</div></div>${actionsHtml}`;
    
    if (type === 'friend') {
        const acceptBtn = notifItem.querySelector('.accept-btn');
        const declineBtn = notifItem.querySelector('.decline-btn');
        const blurTarget = notifItem.querySelector('.notif-blur-target');
        const actionsContainer = notifItem.querySelector('.notif-actions');

        acceptBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (actionsContainer) actionsContainer.remove();
            blurTarget.innerHTML = `<div style="color: #23a55a; font-size:13px; text-align:center; font-weight:500; padding: 5px 0;">✔️ Запрос в друзья принят</div>`;
            setTimeout(() => { notifItem.remove(); checkEmptyNotifications(); }, 2000);
        });

        declineBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            blurTarget.classList.add('blurred');
            if (actionsContainer) actionsContainer.style.opacity = '0';

            const overlay = document.createElement('div');
            overlay.className = 'confirm-overlay';
            overlay.innerHTML = `<div class="confirm-title">Вы точно хотите отклонить запрос в друзья?</div><div class="confirm-buttons"><button class="confirm-btn yes-btn">Да</button><button class="confirm-btn no-btn">Нет</button></div>`;
            notifItem.appendChild(overlay);

                   overlay.querySelector('.yes-btn').addEventListener('click', (eClick) => {
            eClick.stopPropagation();
            overlay.remove();
            if (actionsContainer) actionsContainer.remove();
            
            // ИСПРАВЛЕНИЕ: Удаляем размытие перед изменением текста статуса
            blurTarget.classList.remove('blurred'); 
            
            blurTarget.innerHTML = `<div style="color: #f23f43; font-size:13px; text-align:center; font-weight:500; padding: 5px 0;">❌ Запрос в друзья отклонён</div>`;
            setTimeout(() => { notifItem.remove(); checkEmptyNotifications(); }, 2000);
        });

            overlay.querySelector('.no-btn').addEventListener('click', (eClick) => {
                eClick.stopPropagation();
                overlay.remove();
                blurTarget.classList.remove('blurred');
                if (actionsContainer) actionsContainer.style.opacity = '1';
            });
        });
    }
    notifList.insertBefore(notifItem, notifList.firstChild);
}

if (goToZonesBtn) {
    goToZonesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        mainSettingsScreen.classList.remove('active-screen');
        zoneSettingsScreen.classList.add('active-screen');
    });
}

if (backToMenuBtn) {
    backToMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        zoneSettingsScreen.classList.remove('active-screen');
        mainSettingsScreen.classList.add('active-screen');
        if (activeZoneKey && zones[activeZoneKey]) zones[activeZoneKey].classList.remove('zone-highlight');
        activeZoneKey = '';
        if (zoneSelectTrigger) zoneSelectTrigger.innerHTML = 'Выберите зону <span class="select-arrow">▼</span>';
    });
}

if (zoneSelectTrigger) {
    zoneSelectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        zoneSelectTrigger.parentElement.classList.toggle('hide-options');
    });
}

document.querySelectorAll('.custom-option').forEach(option => {
    option.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeZoneKey && zones[activeZoneKey]) zones[activeZoneKey].classList.remove('zone-highlight');
        activeZoneKey = option.getAttribute('data-value');
        zoneSelectTrigger.innerHTML = option.textContent + ' <span class="select-arrow">▼</span>';
        zoneSelectTrigger.parentElement.classList.add('hide-options');
        
        if (activeZoneKey && zones[activeZoneKey]) {
            zones[activeZoneKey].classList.add('zone-highlight');
            let currentBg = window.getComputedStyle(zones[activeZoneKey]).backgroundColor;
            if (customColorInput) {
                let hex = rgbToHex(currentBg);
                customColorInput.value = hex;
                if (colorPreviewCircle) colorPreviewCircle.style.backgroundColor = hex;
            }
        }
    });

    option.addEventListener('mouseenter', () => {
        const hoverZoneKey = option.getAttribute('data-value');
        if (zones[hoverZoneKey]) zones[hoverZoneKey].classList.add('zone-highlight');
    });

    option.addEventListener('mouseleave', () => {
        const hoverZoneKey = option.getAttribute('data-value');
        if (zones[hoverZoneKey] && hoverZoneKey !== activeZoneKey) zones[hoverZoneKey].classList.remove('zone-highlight');
    });
});

if (customColorInput) {
    customColorInput.addEventListener('input', (e) => {
        if (colorPreviewCircle) colorPreviewCircle.style.backgroundColor = e.target.value;
    });
}

if (applyColorBtn) {
    applyColorBtn.addEventListener('click', () => {
        if (!activeZoneKey || !zones[activeZoneKey]) { alert('Сначала выберите зону!'); return; }
        const chosenColor = customColorInput.value;
        zones[activeZoneKey].style.backgroundColor = chosenColor;
        localStorage.setItem('chat_bg_' + activeZoneKey, chosenColor);
        zones[activeZoneKey].classList.remove('zone-highlight');
        activeZoneKey = '';
        if (zoneSelectTrigger) zoneSelectTrigger.innerHTML = 'Выберите зону <span class="select-arrow">▼</span>';
        alert('Цвет успешно применен!');
    });
}

function rgbToHex(rgb) {
    if (!rgb || typeof rgb !== 'string') return '#313338';
    if (rgb.startsWith('#')) return rgb;
    let rgbValues = rgb.match(/\d+/g);
    if (!rgbValues || rgbValues.length < 3) return '#313338';
    let r = Math.max(0, Math.min(255, parseInt(rgbValues[0])));
    let g = Math.max(0, Math.min(255, parseInt(rgbValues[1])));
    let b = Math.max(0, Math.min(255, parseInt(rgbValues[2])));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
document.addEventListener('click', (e) => {
    if (zoneSelectTrigger) zoneSelectTrigger.parentElement.classList.add('hide-options');
    if (notificationsDropdown) notificationsDropdown.classList.remove('visible');
    if (settingsSidebar) settingsSidebar.classList.remove('active');
    document.querySelectorAll('.user-action-menu').forEach(menu => menu.classList.remove('visible'));
    document.querySelectorAll('.action-btn.arrow-btn').forEach(btn => btn.classList.remove('open'));
    
    // Новая проверка: Закрываем модалку профиля, только если кликнули по самому серому оверлею вокруг окна
    if (e.target === profileModalOverlay) {
        profileModalOverlay.classList.remove('active');
    }
});

// ==========================================
/* 12. ЛОГИКА НАСТРОЕК ПРОФИЛЯ, КАСКАДНЫХ ТЕНЕЙ И ЗАГРУЗКИ ФОТО */
// ==========================================

// Функция обновления визуального состояния аватарок на странице
function updateProfileUI() {
    myName = localStorage.getItem('chat_nickname') || 'User';
    selectedAvatarColor = localStorage.getItem('chat_avatar_color') || '#5865f2';
    uploadedAvatarDataUrl = localStorage.getItem('chat_avatar_image') || '';

    if (miniMenuUsername) miniMenuUsername.textContent = myName;
    if (userHeaderName) userHeaderName.textContent = myName;

    const firstLetter = myName.charAt(0).toUpperCase();

    // ИСПРАВЛЕНО: Обновляем аватарку в шапке чата через правильную переменную openFullProfileBtn
    if (openFullProfileBtn) {
        if (uploadedAvatarDataUrl) {
            openFullProfileBtn.innerHTML = `<img src="${uploadedAvatarDataUrl}" alt="avatar">`;
            openFullProfileBtn.style.backgroundColor = 'transparent';
        } else {
            openFullProfileBtn.textContent = firstLetter;
            openFullProfileBtn.style.backgroundColor = selectedAvatarColor;
        }
    }

    // Обновляем аватарку в мини-меню профиля (если оно есть)
    if (miniMenuAvatar) {
        if (uploadedAvatarDataUrl) {
            miniMenuAvatar.innerHTML = `<img src="${uploadedAvatarDataUrl}" alt="avatar">`;
            miniMenuAvatar.style.backgroundColor = 'transparent';
        } else {
            miniMenuAvatar.textContent = firstLetter;
            miniMenuAvatar.style.backgroundColor = selectedAvatarColor;
        }
    }
}

    if (profileNicknameInput) profileNicknameInput.value = myName;
    if (resetAvatarFileBtn) {
        resetAvatarFileBtn.style.display = uploadedAvatarDataUrl ? 'block' : 'none';
    }

// Перенаправление клика с красивой кнопки на системный инпут выбора файлов
if (uploadAvatarFileBtn && profileImageFileInput) {
    uploadAvatarFileBtn.addEventListener('click', () => profileImageFileInput.click());
}

// Считывание картинки с устройства и перевод в Base64 для localStorage
if (profileImageFileInput) {
    profileImageFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0]; // Исправлено чтение первого файла из массива
        if (!file) return;

        // Ограничение размера файла до 1.5МБ, чтобы localStorage не переполнялся
        if (file.size > 1.5 * 1024 * 1024) {
            alert('Файл слишком большой! Выберите картинку размером до 1.5 МБ.');
            profileImageFileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            uploadedAvatarDataUrl = event.target.result; // Сохраняем текстовую строку картинки
            if (resetAvatarFileBtn) resetAvatarFileBtn.style.display = 'block';
            alert('Фото успешно выбрано! Нажмите "Сохранить изменения" для применения.');
        };
        reader.readAsDataURL(file);
    });
}

// Удаление загруженного фото и возврат к обычной цветной аватарке с буквой
if (resetAvatarFileBtn) {
    resetAvatarFileBtn.addEventListener('click', () => {
        uploadedAvatarDataUrl = '';
        if (profileImageFileInput) profileImageFileInput.value = '';
        resetAvatarFileBtn.style.display = 'none';
    });
}

// Открытие большого окна настроек аккаунта
if (openFullProfileBtn && profileModalOverlay) {
    openFullProfileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileModalOverlay.classList.add('active');
        
        document.querySelectorAll('.avatar-color-circle').forEach(circle => {
            if (circle.getAttribute('data-color') === selectedAvatarColor) {
                circle.classList.add('selected');
            } else {
                circle.classList.remove('selected');
            }
        });
    });
}

// Закрытие настроек профиля по крестику
if (closeProfileModalBtn && profileModalOverlay) {
    closeProfileModalBtn.addEventListener('click', () => {
        profileModalOverlay.classList.remove('active');
    });
}

// Выбор фонового цвета аватара в модальном окне
document.querySelectorAll('.avatar-color-circle').forEach(circle => {
    circle.addEventListener('click', () => {
        document.querySelectorAll('.avatar-color-circle').forEach(c => c.classList.remove('selected'));
        circle.classList.add('selected');
        selectedAvatarColor = circle.getAttribute('data-color');
    });
});

// Сохранение всех изменений профиля
if (saveProfileChangesBtn) {
    saveProfileChangesBtn.addEventListener('click', () => {
        const newNick = profileNicknameInput.value.trim();
        if (newNick === '') { alert('Никнейм не может быть пустым!'); return; }
        
        localStorage.setItem('chat_nickname', newNick);
        localStorage.setItem('chat_avatar_color', selectedAvatarColor);
        
        // Сохраняем или удаляем изображение в базе данных
        if (uploadedAvatarDataUrl) {
            localStorage.setItem('chat_avatar_image', uploadedAvatarDataUrl);
        } else {
            localStorage.removeItem('chat_avatar_image');
        }
        
        updateProfileUI();
        profileModalOverlay.classList.remove('active');
    });
}

// ГЛОБАЛЬНОЕ СОБЫТИЕ ЗАГРУЗКИ СТРАНИЦЫ
window.addEventListener('DOMContentLoaded', () => {
    updateProfileUI(); // Запускаем инициализацию профиля

    Object.keys(zones).forEach(zoneKey => {
        const savedColor = localStorage.getItem('chat_bg_' + zoneKey);
        if (savedColor && zones[zoneKey]) zones[zoneKey].style.backgroundColor = savedColor;
    });

    setTimeout(() => { addNotification('system', 'Обновите site для применения изменений.'); }, 2000);
    setTimeout(() => { addNotification('friend', 'Влад отправил вам запрос в друзья.', 'Влад'); }, 5000);
    
    // НАХОДИМ КНОПКИ (внутри события, когда HTML уже загружен)
    const closeBtn = document.getElementById('closeModalBtn');
    const modalOverlay = document.getElementById('profileModalOverlay');
    const openBtn = document.getElementById('openProfileModalBtn'); // Проверьте ID кнопки открытия в HTML!

    // НАВЕШИВАЕМ КЛИКИ С ПРОВЕРКОЙ
    if (openBtn && modalOverlay) {
        openBtn.addEventListener('click', () => {
            modalOverlay.classList.add('active');
        });
    }

    if (closeBtn && modalOverlay) {
        closeBtn.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
        });
    }
}); // Вот эта скобка закрывает window.addEventListener
