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

// Переменная для хранения текущей выбранной зоны
let activeZoneKey = null;

// Объект зон (ключи теперь строго соответствуют вашим data-value в HTML!)
const zones = {
    'chatArea': document.getElementById('messagesContainer') || document.querySelector('.messages-container') || document.querySelector('.chat-area'),
    'channelsSidebar': document.getElementById('channelsSidebar') || document.querySelector('.channels-sidebar'),
    'guildsSidebar': document.getElementById('guildsSidebar') || document.querySelector('.guilds-sidebar'),
    'settingsSidebar': document.getElementById('settingsSidebar') || document.querySelector('.settings-sidebar')
};

// Загрузка сохраненных цветов при старте страницы
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

// ЛОГИКА ДЛЯ КАСТОМНОГО СПИСКА (НАВЕДЕНИЕ И КЛИК)
const options = document.querySelectorAll('.custom-option');
if (options.length > 0) {
    options.forEach(option => {
        // Подсветка зоны при наведении курсора на пункт меню
        option.addEventListener('mouseenter', () => {
            clearAllHighlights();
            const targetValue = option.getAttribute('data-value');
            const targetElement = zones[targetValue];
            if (targetElement) {
                targetElement.classList.add('zone-highlight');
            }
        });

        // Убираем подсветку при уходе мыши
        option.addEventListener('mouseleave', () => {
            clearAllHighlights();
        });

        // КЛИК ПО ПУНКТУ: Выбираем зону, меняем текст в триггере и обновляем круг цветов!
        option.addEventListener('click', () => {
            activeZoneKey = option.getAttribute('data-value');
            const targetElement = zones[activeZoneKey];
            
            // Обновляем текст в шапке выпадающего списка
            if (zoneSelectTrigger) {
                zoneSelectTrigger.textContent = option.textContent;
            }
            
            if (targetElement && customColorInput && colorPreviewCircle) {
                // Получаем текущий цвет фона элемента
                const currentZoneBg = window.getComputedStyle(targetElement).backgroundColor;
                const hexColor = rgbToHex(currentZoneBg);
                
                // Синхронизируем инпут и цветной кружок
                customColorInput.value = hexColor;
                colorPreviewCircle.style.backgroundColor = hexColor;
            }
        });
    });
}

// Обновление круга при ручном выборе цвета в пикере
if (customColorInput && colorPreviewCircle) {
    customColorInput.addEventListener('input', (e) => {
        colorPreviewCircle.style.backgroundColor = e.target.value;
    });
}

// Применение цвета по кнопке APPLY
if (applyColorBtn) {
    applyColorBtn.addEventListener('click', () => {
        if (activeZoneKey && zones[activeZoneKey]) {
            const selectedColor = customColorInput.value;
            zones[activeZoneKey].style.backgroundColor = selectedColor;
            localStorage.setItem('chat_bg_' + activeZoneKey, selectedColor);
        } else {
            alert('Сначала выберите зону из списка!');
        }
    });
}

// Функция перевода RGB в HEX формат
function rgbToHex(rgb) {
    if (!rgb || rgb.startsWith('#')) return rgb || '#313338';
    const rgbValues = rgb.match(/\d+/g);
    if (!rgbValues) return '#313338';
    const r = parseInt(rgbValues[0]).toString(16).padStart(2, '0');
    const g = parseInt(rgbValues[1]).toString(16).padStart(2, '0');
    const b = parseInt(rgbValues[2]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}
// ПЛАВНОЕ ОТКРЫТИЕ И ЗАКРЫТИЕ ОКНА НАСТРОЕК ПРЯМО ПОД ШЕСТЕРЁНКОЙ
const gearBtn = document.getElementById('openSettingsBtn');
const modalOverlay = document.getElementById('settingsModalOverlay');

if (gearBtn && modalOverlay) {
    gearBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Чтобы клик случайно не сбрасывался
        modalOverlay.classList.toggle('active'); // toggle плавно откроет или закроет окно при повторном клике!
    });
}

// Закрытие окна при клике на крестик внутри него
const closeBtn = document.getElementById('closeSettingsBtn');
if (closeBtn && modalOverlay) {
    closeBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('active');
        clearAllHighlights();
    });
}
