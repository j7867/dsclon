let myName = localStorage.getItem('chat_nickname');
if (!myName) {
    myName = prompt("Введите ваш никнейм для чата:") || "Пользователь";
    localStorage.setItem('chat_nickname', myName);
}

const chatArea = document.getElementById('chatArea');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

// Загрузка сохраненного цвета
const savedBg = localStorage.getItem('chat_bg_color');
if (savedBg) {
    chatArea.style.backgroundColor = savedBg;
}

window.changeBg = function(color) {
    chatArea.style.backgroundColor = color;
    localStorage.setItem('chat_bg_color', color);
}

function renderMessages() {
    messagesContainer.innerHTML = '';
    const messages = JSON.parse(localStorage.getItem('local_messages') || '[]');
    
    messages.forEach((msg) => {
        const msgElement = document.createElement('div');
        msgElement.className = 'message';
        
        const firstLetter = msg.author.charAt(0).toUpperCase();
        const avatarColor = msg.author === myName ? '#5865f2' : '#747f8d';

        msgElement.innerHTML = `
            <div class="user-avatar" style="background-color: ${avatarColor};">${firstLetter}</div>
            <div class="message-content">
                <span class="message-author">${msg.author}</span>
                <span class="message-text">${msg.text}</span>
            </div>
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
        author: myName,
        text: text,
        time: Date.now()
    });

    localStorage.setItem('local_messages', JSON.stringify(messages));
    messageInput.value = '';
    renderMessages();
}

sendBtn.onclick = sendMessage;
messageInput.onkeydown = function(e) {
    if (e.key === 'Enter') sendMessage();
};

// Запуск отображения при старте
renderMessages();
