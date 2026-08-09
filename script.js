// 1. НАХОДИМ ВСЕ ПАРЯЩИЕ ЭЛЕМЕНТЫ НА СТРАНИЦЕ
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

// ЭЛЕМЕНТЫ НОВОГО КОЛОКОЛЬЧИКА
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

// 2. ЛОГИКА ОТПРАВКИ И ОБВОДКИ СООБЩЕНИЙ
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

    // Поворот стрелочки и серое меню "Добавить в друзья"
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

// 3. ОТКРЫТИЕ ПАРЯЩИХ ОКНО ПО КЛИКУ НА КНОПКИ
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

// ЛОГИКА ДОБАВЛЕНИЯ УВЕДОМЛЕНИЙ В КОЛОКОЛ
function addNotification(type, text) {
    if (!notifList || !bellBadge || !notifEmptyText) return;
    notificationsCount++;
    bellBadge.classList.add('active');
    notifEmptyText.style.display = 'none';

    const notifItem = document.createElement('div');
    notifItem.className = 'notification-item';
    let titleText = type === 'system' ? 'Системное обновление' : 'Запрос в друзья';
    notifItem.innerHTML = `
        <div class="notif-title">${titleText}</div>
        <div class="notif-text">${text}</div>
    `;
    notifList.insertBefore(notifItem, notifList.firstChild);
}

// ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ ВНУТРИ НАСТРОЕК
if (goToZonesBtn) {
    goToZonesBtn.addEventListener('click', () => {
        mainSettingsScreen.classList.remove('active-screen');
        zoneSettingsScreen.classList.add('active-screen');
    });
}
if (backToMenuBtn) {
    backToMenuBtn.addEventListener('click', () => {
        zoneSettingsScreen.classList.remove('active-screen');
        mainSettingsScreen.classList.add('active-screen');
        if (activeZoneKey && zones[activeZoneKey]) zones[activeZoneKey].classList.remove('zone-highlight');
    });
}

// ВЫБОР И КАСТОМИЗАЦИЯ ЗОН
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
    if (rgb.startsWith('#')) return rgb;
    let rgbValues = rgb.match(/\d+/g);
    if (!rgbValues) return '#313338';
    let r = parseInt(rgbValues[0]).toString(16).padStart(2, '0');
    let g = parseInt(rgbValues[1]).toString(16).padStart(2, '0');
    let b = parseInt(rgbValues[2]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

// КЛИК В ПУСТОТУ МЕСТА СБРАСЫВАЕТ ВСЕ ОКНА
document.addEventListener('click', () => {
    if (zoneSelectTrigger) zoneSelectTrigger.parentElement.classList.add('hide-options');
    if (notificationsDropdown) notificationsDropdown.classList.remove('visible');
    if (settingsSidebar) settingsSidebar.classList.remove('active');
    document.querySelectorAll('.user-action-menu').forEach(menu => menu.classList.remove('visible'));
    document.querySelectorAll('.action-btn.arrow-btn').forEach(btn => btn.classList.remove('open'));
});

// ТЕСТОВЫЕ УВЕДОМЛЕНИЯ ПРИ СТАРТЕ СТРАНИЦЫ
window.addEventListener('DOMContentLoaded', () => {
    Object.keys(zones).forEach(zoneKey => {
        const savedColor = localStorage.getItem('chat_bg_' + zoneKey);
        if (savedColor && zones[zoneKey]) zones[zoneKey].style.backgroundColor = savedColor;
    });

    setTimeout(() => { addNotification('system', 'Обновите сайт для применения изменений.'); }, 2000);
    setTimeout(() => { addNotification('friend', 'Влад отправил вам запрос в друзья.'); }, 5000);
});
