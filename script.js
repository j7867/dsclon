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
    'channelssidebar': document.getElementById('channelssidebar') || document.querySelector('.channels-sidebar'),
    'guildsidebar': document.getElementById('guildsidebar') || document.querySelector('.guilds-sidebar'),
    'settingssidebar': document.getElementById('settingssidebar') || document.querySelector('.settings-sidebar')
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
    });
}

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

// ЛОГИКА РАБОТЫ ЧАТА (ОТПРАВКА И ПРОКРУТКА)
function appendMessage(sender, text) {
    if (!messagesContainer) return;

    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    
    messageElement.innerHTML = `
        <div class="message-content">
            <strong>${sender}:</strong> <span class="text-node">${text}</span>
        </div>
        <div class="message-actions">
            <button class="action-btn edit-btn" title="Редактировать">✏️</button>
            <button class="action-btn delete-btn" title="Удалить">🗑️</button>
            <button class="action-btn arrow-btn" title="Еще">></button>
        </div>
            </div>
    `;

    messagesContainer.appendChild(messageElement);

    // // АВТО-ПРОКРУТКА ЧАТА ВНИЗ
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
} // Логика для кнопки-стрелочки внутри сообщения
    const arrowBtn = messageElement.querySelector('.arrow-btn');
    if (arrowBtn) {
        arrowBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            arrowBtn.classList.toggle('open');
            
            let userMenu = messageElement.querySelector('.user-action-menu');
            if (!userMenu) {
                userMenu = document.createElement('div');
                userMenu.className = 'user-action-menu';
                userMenu.innerHTML = `
                    <div class="menu-item add-friend">Добавить в друзья</div>
                    <div class="menu-item send-dm">Написать в ЛС</div>
                `;
                messageElement.appendChild(userMenu);
            }
            userMenu.classList.toggle('visible');
        });
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

// Ваша реальная правая панель из HTML
const settingssidebar = document.getElementById('settingssidebar');

const zoneSelectOptions = document.getElementById('zoneSelectOptions');
// Находим кнопку шестеренки (проверьте, чтобы класс или ID совпадал с вашим HTML)
const settingsToggleBtn = document.getElementById('settingsTrigger') || document.querySelector('.settings-trigger') || document.querySelector('.fa-gear');

   if (settingsToggleBtn && settingssidebar) {
    settingsToggleBtn.addEventListener('click', () => {
        settingssidebar.classList.toggle('active');
    });
}

if (zoneSelectTrigger && zoneSelectOptions) {
    zoneSelectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        zoneSelectOptions.classList.toggle('active');
    });

    document.addEventListener('click', () => {
        zoneSelectOptions.classList.remove('active');
    });
}

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
        }
    });
}
// ФИНАЛЬНЫЙ ИСПРАВЛЯЮЩИЙ СКРИПТ ДЛЯ ОТКРЫТИЯ НАСТРОЕК
(function() {
    // Находим панель и экраны по вашему HTML
    const sidebar = document.getElementById('settingsSidebar');
    const screen1 = document.getElementById('mainSettingsScreen');
    const screen2 = document.getElementById('zoneSettingsScreen');
    
    // Автоматически находим кнопку шестерёнки на странице
    const gearBtn = document.getElementById('settingsTrigger') || 
                    document.querySelector('.settings-trigger') || 
                    document.querySelector('.fa-gear') ||
                    document.querySelector('[title="Настройки"]');

    if (gearBtn && sidebar) {
        // Вешаем железный клик на шестерёнку
        gearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
            
            // Сбрасываем меню на Экран 1 при каждом открытии
            if (screen1 && screen2) {
                screen1.classList.add('active-screen');
                screen2.classList.remove('active-screen');
            }
        });
    }

    // Находим кнопки переключения экранов внутри самой панели
    const toZones = document.getElementById('goToZonesBtn');
    const toMenu = document.getElementById('backToMenuBtn');

    if (toZones && screen1 && screen2) {
        toZones.addEventListener('click', () => {
            screen1.classList.remove('active-screen');
            screen2.classList.add('active-screen');
        });
    }

    if (toMenu && screen1 && screen2) {
        toMenu.addEventListener('click', () => {
            screen2.classList.remove('active-screen');
            screen1.classList.add('active-screen');
        });
    }
})();
