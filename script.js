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

               // Клик по зоне: фиксируем её, обновляем круг и плавно закрываем список вариантов!
        option.addEventListener('click', () => {
            activeZoneKey = option.getAttribute('data-value');
            const targetElement = zones[activeZoneKey];
            
            // МАГИЯ ЗАКРЫТИЯ: Находим контейнер списка и вешаем класс скрытия
            const selectContainer = option.closest('.custom-select-container');
            if (selectContainer) {
                selectContainer.classList.add('hide-options');
                
                // Как только мышка полностью уйдёт с контейнера, снимаем класс скрытия, 
                // чтобы при следующем наведении меню снова открывалось штатно!
                selectContainer.addEventListener('mouseleave', () => {
                    selectContainer.classList.remove('hide-options');
                }, { once: true }); // once: true означает, что проверка сработает ровно 1 раз
            }
            
            if (zoneSelectTrigger) {
                zoneSelectTrigger.innerHTML = `${option.textContent} <span class="select-arrow">▼</span>`;
            }
            
            if (targetElement && customColorInput && colorPreviewCircle) {
                const currentZoneBg = window.getComputedStyle(targetElement).backgroundColor;
                const hexColor = rgbToHex(currentZoneBg);
                customColorInput.value = hexColor;
                colorPreviewCircle.style.backgroundColor = hexColor;
            }
        });


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

const closeBtn = document.getElementById('closeSettingsBtn');
const mainScreen = document.getElementById('mainSettingsScreen');
const zoneScreen = document.getElementById('zoneSettingsScreen');

if (closeBtn && modalOverlay && mainScreen && zoneScreen) {
    closeBtn.addEventListener('click', () => {
        // 1. Плавный сброс экранов на первый при закрытии через крестик
        zoneScreen.classList.remove('active-screen');
        mainScreen.classList.add('active-screen');
        
        // 2. Полное закрытие самого окна и уборка подсветок
        modalOverlay.classList.remove('active');
        clearAllHighlights();
    });
}

// ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ЭКРАНОВ ВНУТРИ ОКНА НАСТРОЕК
const goToZonesBtn = document.getElementById('goToZonesBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');

// Переход на экран настройки зон при клике на кнопку
if (goToZonesBtn && mainScreen && zoneScreen) {
    goToZonesBtn.addEventListener('click', () => {
        mainScreen.classList.remove('active-screen');
        zoneScreen.classList.add('active-screen');
    });
}

// Возврат на главный экран настроек при клике на кнопку Назад
if (backToMenuBtn && mainScreen && zoneScreen) {
    backToMenuBtn.addEventListener('click', () => {
        zoneScreen.classList.remove('active-screen');
        mainScreen.classList.add('active-screen');
        clearAllHighlights(); // Убираем рамки подсветки зон при выходе
    });
};

