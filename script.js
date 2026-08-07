let myName = localStorage.getItem('chat_nickname');
if (!myName) {
    myName = prompt("Введите ваш никнейм для чата:") || "Пользователь";
    localStorage.setItem('chat_nickname', myName);
}

const chatArea = document.getElementById('chatArea');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const customColorInput = document.getElementById('customColorInput');
const colorPreviewCircle = document.getElementById('colorPreviewCircle');

// 1. Логика работы с цветом фона
const savedBg = localStorage.getItem('chat_bg_color');
if (savedBg) {
    chatArea.style.backgroundColor = savedBg;
    if (customColorInput) customColorInput.value = savedBg;
    if (colorPreviewCircle) colorPreviewCircle.style.backgroundColor = savedBg;
}

if (customColorInput) {
    customColorInput.addEventListener('input', (e) => {
        const selectedColor = e.target.value;
        chatArea.style.backgroundColor = selectedColor;
        if (colorPreviewCircle) colorPreviewCircle.style.backgroundColor = selectedColor;
        localStorage.setItem('chat_bg_color', selectedColor);
    });
}

// 2. Логика базы данных и управления сообщениями
function renderMessages() {
    messagesContainer.innerHTML = '';
    const messages = JSON.parse(localStorage.getItem('local_messages') || '[]');
    
    messages.forEach((msg) => {
        const msgElement = document.createElement('div');
        msgElement.className = 'message';
        
        const firstLetter = msg.author.charAt(0).toUpperCase();
        const avatarColor = msg.author === myName ? '#5865f2' : '#747f8d';

        // Формируем блок кнопок действий (только если автор — это текущий пользователь)
        let actionsHtml = '';
        if (msg.author === myName) {
            actionsHtml = `
                <div class="message-actions">
                    <button class="action-btn" onclick="editMessage('${msg.id}')" title="Изменить">✏️</button>
                    <button class="action-btn delete" onclick="deleteMessage('${msg.id}')" title="Удалить">🗑️</button>
                </div>
            `;
        }

        msgElement.innerHTML = `
            <div class="user-avatar" style="background-color: ${avatarColor};">${firstLetter}</div>
            <div class="message-content">
                <span class="message-author">${msg.author}</span>
                <span class="message-text">${msg.text}</span>
            </div>
            ${actionsHtml}
        `;
        messagesContainer.appendChild(msgElement);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    const messages = JSON.parse(localStorage.getItem('local_messages') || '[]');
    messages.push({
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        author: myName,
        text: text,
        time: Date.now()
    });

    localStorage.setItem('local_messages', JSON.stringify(messages));
    messageInput.value = '';
    renderMessages();
}

// Глобальные функции для изменения и удаления сообщений
window.editMessage = function(msgId) {
    const messages = JSON.parse(localStorage.getItem('local_messages') || '[]');
    const msgIndex = messages.findIndex(m => m.id === msgId);
    
    if (msgIndex !== -1 && messages[msgIndex].author === myName) {
        const oldText = messages[msgIndex].text;
        const newText = prompt("Редактировать сообщение:", oldText);
        
        if (newText !== null && newText.trim() !== '') {
            messages[msgIndex].text = newText.trim();
            localStorage.setItem('local_messages', JSON.stringify(messages));
            renderMessages();
        }
    }
}

window.deleteMessage = function(msgId) {
    if (confirm("Вы уверены, что хотите удалить это сообщение?")) {
        let messages = JSON.parse(localStorage.getItem('local_messages') || '[]');
        messages = messages.filter(m => m.id !== msgId || m.author !== myName);
        localStorage.setItem('local_messages', JSON.stringify(messages));
        renderMessages();
    }
}

sendBtn.onclick = sendMessage;
messageInput.onkeydown = function(e) {
    if (e.key === 'Enter') sendMessage();
};

// Первичный запуск базы данных при открытии страницы
renderMessages();
