let myName = localStorage.getItem('chat_nickname');
if (!myName) {
    myName = prompt("Enter your nickname:") || "User";
    localStorage.setItem('chat_nickname', myName);
}

const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const customColorInput = document.getElementById('customColorInput');
const colorPreviewCircle = document.getElementById('colorPreviewCircle');
const applyColorBtn = document.getElementById('applyColorBtn');
const zoneSelectTrigger = document.getElementById('zoneSelectTrigger');

let activeZoneKey = null;

// Объект сайдбаров и чата
const zones = {
    'chatArea': document.getElementById('messagesContainer') || document.querySelector('.messages-container') || document.querySelector('.chat-area'),
    'channelsSidebar': document.getElementById('channelsSidebar') || document.querySelector('.channels-sidebar'),
    'guildsSidebar': document.getElementById('guildsSidebar') || document.querySelector('.guilds-sidebar'),
    'settingsSidebar': document.getElementById('settingsSidebar') || document.querySelector('.settings-sidebar')
};

// Применяем сохраненные цвета
Object.keys(zones).forEach(zoneKey => {
    const savedColor = localStorage.getItem('chat_bg_' + zoneKey);
    if (savedColor && zones[zoneKey]) {
        zones[zoneKey].style.backgroundColor = savedColor;
    }
});

function clearAllHighlights() {
    Object.values(zones).forEach(el => {
        if (el) el.classList.remove('zone-highlight');
    });
}

// НАВЕДЕНИЕ И ВЫБОР ВНУТРИ МОДАЛЬНОГО ОКНА
const options = document.querySelectorAll('.custom-option');
if (options.length > 0) {
    options.forEach(option => {
        option.addEventListener('mouseenter', () => {
            clearAllHighlights();
            const targetValue = option.getAttribute('data-value');
            const targetElement = zones[targetValue];
            if (targetElement) {
                targetElement.classList.add('zone-highlight');
            }
        });

        option.addEventListener('mouseleave', () => {
            clearAllHighlights();
        });
        option.addEventListener('click', () => {
            activeZoneKey = option.getAttribute('data-value');
            const targetElement = zones[activeZoneKey];
            
            const selectContainer = option.closest('.custom-select-container');
            if (selectContainer) {
                selectContainer.classList.add('hide-options');
                selectContainer.addEventListener('mouseleave', () => {
                    selectContainer.classList.remove('hide-options');
                }, { once: true });
            }
                 if (zoneSelectTrigger) {
            zoneSelectTrigger.innerHTML = option.textContent + ' <span class="select-arrow">▼</span>';
        }

                  if (targetElement && customColorInput && colorPreviewCircle) {
            const currentZoneBg = window.getComputedStyle(targetElement).backgroundColor;
            const hexColor = rgbToHex(currentZoneBg);
            customColorInput.value = hexColor;
            colorPreviewCircle.style.backgroundColor = hexColor;
        }  
});

if (customColorInput && colorPreviewCircle) {
    customColorInput.addEventListener('input', (e) => {
        colorPreviewCircle.style.backgroundColor = e.target.value;
    });
}

if (applyColorBtn) {
    applyColorBtn.addEventListener('click', () => {
        if (activeZoneKey && zones[activeZoneKey]) {
            const selectedColor = customColorInput.value;
            zones[activeZoneKey].style.backgroundColor = selectedColor;
            localStorage.setItem('chat_bg_' + activeZoneKey, selectedColor);
            alert('Цвет для зоны успешно применен и сохранен!');
              }
    });
}

// Функция перевода цвета в HEX формат
function rgbToHex(rgb) {
    const rgbValues = rgb.match(/\d+/g);
    if (!rgbValues) return '#313338';
    const r = parseInt(rgbValues[0]).toString(16).padStart(2, '0');
    const g = parseInt(rgbValues[1]).toString(16).padStart(2, '0');
    const b = parseInt(rgbValues[2]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

// ==========================================
// ЛОГИКА РАБОТЫ ЧАТА (ОТПРАВКА И ПРОКРУТКА)
// ==========================================

// Функция добавления сообщения на экран и авто-прокрутки вниз
function appendMessage(sender, text) {
    if (!messagesContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message-item';
    messageElement.innerHTML = `<strong>${sender}:</strong> ${text}`;
    messagesContainer.appendChild(messageElement);
    
    // АВТО-ПРОКРУТКА ЧАТА ВНИЗ
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Функция самой отправки
function handleSendMessage() {
    if (!messageInput) return;
    
    const text = messageInput.value.trim();
    if (text === '') return; // Пустые сообщения не отправляем
    
    // Отправляем сообщение от вашего никнейма
    appendMessage(myName, text);
    
    // Очищаем поле ввода и возвращаем на него фокус
    messageInput.value = '';
    messageInput.focus();
}

// Получаем элементы кнопок и экранов
const goToZonesBtn = document.getElementById('goToZonesBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');
const mainSettingsScreen = document.getElementById('mainSettingsScreen');
const zoneSettingsScreen = document.getElementById('zoneSettingsScreen');

// Переход на Экран 2 (Настройка зон)
goToZonesBtn.addEventListener('click', () => {
    mainSettingsScreen.classList.remove('active-screen');
    zoneSettingsScreen.classList.add('active-screen');
});

// Возврат на Экран 1 (Главное меню настроек)
backToMenuBtn.addEventListener('click', () => {
    zoneSettingsScreen.classList.remove('active-screen');
    mainSettingsScreen.classList.add('active-screen');
const zoneSelectOptions = document.getElementById('zoneSelectOptions');
if (zoneSelectTrigger && zoneSelectOptions) {
    zoneSelectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        zoneSelectOptions.classList.toggle('active');
    });
    document.addEventListener('click', () => {
        zoneSelectOptions.classList.remove('active');
    });
// Логика кнопки ПРИМЕНИТЬ
if (typeof applyColorBtn !== 'undefined' && applyColorBtn) {
    applyColorBtn.addEventListener('click', () => {
        if (!activeZoneKey) {
            alert('Сначала выберите зону из списка!');
            return;
        }

        const selectedColor = customColorInput.value;
        const targetElement = zones[activeZoneKey];

        if (targetElement) {
            targetElement.style.backgroundColor = selectedColor;
            localStorage.setItem('chat_bg_' + activeZoneKey, selectedColor);
            alert('Цвет для зоны успешно применен и сохранен!');
        }
    });
}
// Обработчик клика по кнопке "Отправить"
if (typeof sendBtn !== 'undefined' && sendBtn) {
    sendBtn.addEventListener('click', handleSendMessage);
}

// Обработчик нажатия Enter в поле ввода
if (typeof messageInput !== 'undefined' && messageInput) {
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Предотвращаем перенос строки
            handleSendMessage();
    });
