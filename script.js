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

// Переменная для хранения текущей выбранной зоны
let activeZoneKey = null;

// Полный объект зон (вернули centralChat)
const zones = {
    'centralChat': document.getElementById('messagesContainer') || document.querySelector('.messages-container'),
    'channelsSidebar': document.getElementById('channelsSidebar') || document.querySelector('.channels-sidebar'),
    'guildsSidebar': document.getElementById('guildsSidebar') || document.querySelector('.guilds-sidebar'),
    'settingsSidebar': document.getElementById('settingsSidebar') || document.querySelector('.settings-sidebar')
};

// Проверяем сохраненные цвета при загрузке страницы
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

// 1. ЛОГИКА ДЛЯ КАСТОМНОГО МЕНЮ (НАВЕДЕНИЕ И КЛИК)
const options = document.querySelectorAll('.custom-option');
if (options.length > 0) {
    options.forEach(option => {
        // Подсветка зоны при наведении на пункт меню
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

        // КЛИК ПО ПУНКТУ: фиксируем зону и обновляем круг цветов!
        option.addEventListener('click', () => {
            activeZoneKey = option.getAttribute('data-value');
            const targetElement = zones[activeZoneKey];
            
            if (targetElement && customColorInput && colorPreviewCircle) {
                // Берем текущий цвет этой зоны из браузера
                const currentZoneBg = window.getComputedStyle(targetElement).backgroundColor;
                const hexColor = rgbToHex(currentZoneBg);
                
                // Перекрашиваем инпут и круг под цвет выбранной зоны
                customColorInput.value = hexColor;
                colorPreviewCircle.style.backgroundColor = hexColor;
            }
        });
    });
}

// 2. ИЗМЕНЕНИЕ ЦВЕТА В ИНПУТЕ (ОБНОВЛЕНИЕ КРУГА)
if (customColorInput && colorPreviewCircle) {
    customColorInput.addEventListener('input', (e) => {
        colorPreviewCircle.style.backgroundColor = e.target.value;
    });
}

// 3. НАЖАТИЕ НА КНОПКУ APPLY (СОХРАНЕНИЕ ЦВЕТА)
if (applyColorBtn) {
    applyColorBtn.addEventListener('click', () => {
        if (activeZoneKey && zones[activeZoneKey]) {
            const selectedColor = customColorInput.value;
            zones[activeZoneKey].style.backgroundColor = selectedColor;
            localStorage.setItem('chat_bg_' + activeZoneKey, selectedColor);
        } else {
            alert('Сначала выберите зону в списке!');
        }
    });
}

// Функция перевода цвета в HEX формат
function rgbToHex(rgb) {
    if (!rgb || rgb.startsWith('#')) return rgb || '#313338';
    const rgbValues = rgb.match(/\d+/g);
    if (!rgbValues) return '#313338';
    const r = parseInt(rgbValues[0]).toString(16).padStart(2, '0');
    const g = parseInt(rgbValues[1]).toString(16).padStart(2, '0');
    const b = parseInt(rgbValues[2]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}
