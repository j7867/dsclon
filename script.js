let currentTargetUser = 'Иван';

const chatHistory = {
    'Иван': [{ author: 'Иван', text: 'Привет! Как дела с разработкой сайта?' }],
    'Алексей': [],
    'Мария': []
};

const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const chatUserTitle = document.getElementById('current-chat-user');
const chatArea = document.getElementById('chatArea');

function renderMessages() {
    messagesContainer.innerHTML = '';
    const messages = chatHistory[currentTargetUser] || [];
    
    messages.forEach(msg => {
        const msgElement = document.createElement('div');
        msgElement.className = 'message';
        
        const firstLetter = msg.author.charAt(0).toUpperCase();
        const avatarColor = msg.author === 'Вы' ? '#5865f2' : '#747f8d';

        // Создаем внутренности сообщения безопасным путем
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

    chatHistory[currentTargetUser].push({
        author: 'Вы',
        text: text
    });

    messageInput.value = '';
    renderMessages();
}

function selectUser(username) {
    currentTargetUser = username;
    chatUserTitle.textContent = username;
    
    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('active');
        if(item.querySelector('span').textContent === username) {
            item.classList.add('active');
        }
    });

    renderMessages();
}

function changeBg(color) {
    chatArea.style.backgroundColor = color;
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Запускаем первичный рендеринг при загрузке страницы
renderMessages();
