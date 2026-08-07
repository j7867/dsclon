let myName = localStorage.getItem('chat_nickname');
if (!myName) {
    myName = prompt("Enter your nickname:") || "User";
    localStorage.setItem('chat_nickname', myName);
}

const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const zoneSelect = document.getElementById('zoneSelect');
const customColorInput = document.getElementById('customColorInput');
const colorPreviewCircle = document.getElementById('colorPreviewCircle');
const applyColorBtn = document.getElementById('applyColorBtn');

const zones = {
    'Central Chat': document.getElementById('messagesContainer'),
    'Channels Sidebar': document.getElementById('channelsSidebar') || document.querySelector('.channels-sidebar'),
    'guildsSidebar': document.getElementById('guildsSidebar') || document.querySelector('.guilds-sidebar'),
    'settingsSidebar': document.getElementById('settingsSidebar') || document.querySelector('.settings-sidebar')
};

// Функция удаления подсветки со всех зон
function clearAllHighlights() {
    Object.values(zones).forEach(el => {
        if (el) el.classList.remove('zone-highlight');
    });
}

// 1. ЛОГИКА НАВЕДЕНИЯ НА ПУНКТЫ МЕНЮ
// Ищем все элементы кастомного списка (если это обычный select, код ниже просто пропустится без ошибок)
const options = document.querySelectorAll('.custom-option');
if (options.length > 0) {
    options.forEach(option => {
        // Наведение мыши
        option.addEventListener('mouseenter', () => {
            clearAllHighlights();
            const targetValue = option.getAttribute('data-value');
            const targetElement = zones[targetValue];
            if (targetElement) {
                targetElement.classList.add('zone-highlight');
            }
        });
        // Увод мыши
        option.addEventListener('mouseleave', () => {
            clearAllHighlights();
        });
    });
}

// 2. ВЫБОР ЗОНЫ И СМЕНА ЦВЕТА
if (zoneSelect && customColorInput && colorPreviewCircle) {
    zoneSelect.addEventListener('change', () => {
        const currentZone = zoneSelect.value;
        if (zones[currentZone]) {
            const currentZoneBg = window.getComputedStyle(zones[currentZone]).backgroundColor;
            const hexColor = rgbToHex(currentZoneBg);
            customColorInput.value = hexColor;
            colorPreviewCircle.style.backgroundColor = hexColor;
        }
    });

    customColorInput.addEventListener('input', (e) => {
        colorPreviewCircle.style.backgroundColor = e.target.value;
    });
}

if (applyColorBtn) {
    applyColorBtn.addEventListener('click', () => {
        const selectedZone = zoneSelect.value;
        const selectedColor = customColorInput.value;
        if (zones[selectedZone]) {
            zones[selectedZone].style.backgroundColor = selectedColor;
            localStorage.setItem('chat_bg_' + selectedZone, selectedColor);
        }
    });
}

// Вспомогательная функция перевода цвета
function rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    const rgbValues = rgb.match(/\d+/g);
    if (!rgbValues) return '#313338';
    const r = parseInt(rgbValues[0]).toString(16).padStart(2, '0');
    const g = parseInt(rgbValues[1]).toString(16).padStart(2, '0');
    const b = parseInt(rgbValues[2]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}
