const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const settingTrigger = document.getElementById('settingTrigger');
const settingsSidebar = document.getElementById('settingsSidebar');
const goToZonesBtn = document.getElementById('goToZonesBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');
const mainSettingsScreen = document.getElementById('mainSettingsScreen');
const zoneSettingsScreen = document.getElementById('zoneSettingsScreen');
const zoneSelectTrigger = document.getElementById('zoneSelectTrigger');
const zoneSelectOptions = document.getElementById('zoneSelectOptions');
const customColorInput = document.getElementById('customColorInput');
const colorPreviewCircle = document.getElementById('colorPreviewCircle');
const applyColorBtn = document.getElementById('applyColorBtn');

const notificationBell = document.getElementById('notificationBell');
const notificationsDropdown = document.getElementById('notificationsDropdown');
const bellBadge = document.getElementById('bellBadge');
const notifList = document.getElementById('notifList');
const notifEmptyText = document.getElementById('notifEmptyText');

let notificationsCount = 0;
let myName = localStorage.getItem('chat_nickname') || 'User';

const zones = {
    chatArea: document.getElementById('chatArea'),
    channelsSidebar: document.getElementById('channelsSidebar'),
    guildsSidebar: document.getElementById('guildsSidebar'),
    settingsSidebar: document.getElementById('settingsSidebar')
};
let activeZoneKey = '';

function appendMessage(sender, text) {
    if (!messagesContainer) return;
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.innerHTML = `
        <div class="message-content">
            <strong>${sender}</strong>
            <span class="message-text">${text}</span>
        </div>
        <div class="message-actions">
            <button class="action-btn edit-btn" title="Редактировать">✏️</button>
            <button class="action-btn delete-btn" title="Удалить">🗑️</button>
            <button class="action-btn arrow-btn" title="Еще">></button>
        </div>
    `;
    messagesContainer.appendChild(messageElement);

    const arrowBtn = messageElement.querySelector('.arrow-btn');
    if (arrowBtn) {
        arrowBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            arrowBtn.classList.toggle('open');
            let userMenu = messageElement.querySelector('.user-action-menu');
            if (!userMenu) {
                userMenu = document.createElement('div');
                userMenu.className = 'user-action-menu';
                userMenu.innerHTML = `<div class="menu-item add-friend">Добавить в друзья</div>`;
                messageElement.appendChild(userMenu);
            }
            userMenu.classList.toggle('visible');
        });
    }
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
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

// ОТКРЫТИЕ И ЗАКРЫТИЕ ПАРЯЩИХ ОКОН С ЗАЩИТОЙ ОТ КЛИКОВ
if (settingTrigger && settingsSidebar) {
    settingTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (notificationsDropdown) notificationsDropdown.classList.remove('visible');
        settingsSidebar.classList.toggle('active');
    });
}

if (notificationBell && notificationsDropdown) {
    notificationBell.addEventListener('click', (e) => {
        e.stopPropagation();
        if (settingsSidebar) settingsSidebar.classList.remove('active');
        notificationsDropdown.classList.toggle('visible');
        notificationsCount = 0;
        if (bellBadge) bellBadge.classList.remove('active');
    });
}

// Защищаем само окно настроек от закрытия при кликах внутри него
if (settingsSidebar) {
    settingsSidebar.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}
// ==========================================
// ЧАСТЬ 2: ЛОГИКА УВЕДОМЛЕНИЙ И КНОПОК ДРУЖБЫ
// ==========================================
function addNotification(type, text) {
    if (!notifList || !bellBadge || !notifEmptyText) return;
    notificationsCount++;
    bellBadge.classList.add('active');
    notifEmptyText.style.display = 'none';

    const notifItem = document.createElement('div');
    notifItem.className = 'notification-item';
    let titleText = type === 'system' ? 'Системное обновление' : 'Запрос в друзья';
    
    let actionsHtml = type === 'friend' ? `
        <div class="notif-actions">
            <button class="notif-action-btn accept-btn" title="Принять">✔️</button>
            <button class="notif-action-btn decline-btn" title="Отклонить">❌</button>
        </div>
    ` : '';

    notifItem.innerHTML = `
        <div class="notif-content-wrapper">
            <div class="notif-title">${titleText}</div>
            <div class="notif-text">${text}</div>
        </div>
        ${actionsHtml}
    `;
    
    if (type === 'friend') {
        const acceptBtn = notifItem.querySelector('.accept-btn');
        const declineBtn = notifItem.querySelector('.decline-btn');
        const contentWrapper = notifItem.querySelector('.notif-content-wrapper');
        const actionsWrapper = notifItem.querySelector('.notif-actions');

        acceptBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            contentWrapper.style.display = 'none';
            actionsWrapper.style.display = 'none';
            notifItem.innerHTML = `<div class="notif-status-text accepted">✔️ Запрос в друзья принят</div>`;
            setTimeout(() => { notifItem.remove(); checkEmptyNotifications(); }, 2000);
        });

        declineBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            contentWrapper.style.display = 'none';
            actionsWrapper.style.display = 'none';
            notifItem.innerHTML = `<div class="notif-status-text declined">❌ Запрос в друзья отклонён</div>`;
            setTimeout(() => { notifItem.remove(); checkEmptyNotifications(); }, 2000);
        });
    }

    notifList.insertBefore(notifItem, notifList.firstChild);
}

function checkEmptyNotifications() {
    if (notifList && notifList.children.length === 0 && notifEmptyText) {
        notifEmptyText.style.display = 'block';
    }
}

// Защищаем окно уведомлений от закрытия при кликах внутри него
if (notificationsDropdown) {
    notificationsDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}


// ==========================================
// ЧАСТЬ 3: ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ И НАСТРОЙКА ЗОН
// ==========================================
if (goToZonesBtn) {
    goToZonesBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Идеальное переключение без закрытия меню!
        mainSettingsScreen.classList.remove('active-screen');
        zoneSettingsScreen.classList.add('active-screen');
    });
}

if (backToMenuBtn) {
    backToMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Возврат без закрытия меню!
        zoneSettingsScreen.classList.remove('active-screen');
        mainSettingsScreen.classList.add('active-screen');
        if (activeZoneKey && zones[activeZoneKey]) zones[activeZoneKey].classList.remove('zone-highlight');
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
        option.parentElement.parentElement.classList.add('hide-options');
        
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
// КЛИК В ПУСТОТУ ЗАКРЫВАЕТ ВСЕ ОКНА
document.addEventListener('click', () => {
    if (zoneSelectTrigger) zoneSelectTrigger.parentElement.classList.add('hide-options');
    if (notificationsDropdown) notificationsDropdown.classList.remove('visible');
    if (settingsSidebar) settingsSidebar.classList.remove('active');
    document.querySelectorAll('.user-action-menu').forEach(menu => menu.classList.remove('visible'));
    document.querySelectorAll('.action-btn.arrow-btn').forEach(btn => btn.classList.remove('open'));
});

// ЗАГРУЗКА ЦВЕТОВ И СТАРТ ТАЙМЕРОВ УВЕДОМЛЕНИЙ
window.addEventListener('DOMContentLoaded', () => {
    Object.keys(zones).forEach(zoneKey => {
        const savedColor = localStorage.getItem('chat_bg_' + zoneKey);
        if (savedColor && zones[zoneKey]) zones[zoneKey].style.backgroundColor = savedColor;
    });

    setTimeout(() => { addNotification('system', 'Обновите site для применения изменений.'); }, 2000);
    setTimeout(() => { addNotification('friend', 'Влад отправил вам запрос в друзья.'); }, 5000);
});

