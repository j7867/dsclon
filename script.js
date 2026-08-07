```javascript
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
    chatArea: document.getElementById('chatArea'),
    channelsSidebar: document.getElementById('channelsSidebar'),
    guildsSidebar: document.getElementById('guildsSidebar'),
    settingsSidebar: document.getElementById('settingsSidebar')
};

Object.keys(zones).forEach(zoneKey => {
    const savedColor = localStorage.getItem('chat_bg_' + zoneKey);
    if (savedColor && zones[zoneKey]) {
        zones[zoneKey].style.backgroundColor = savedColor;
    }
});

if (zoneSelect && customColorInput && colorPreviewCircle) {
    zoneSelect.addEventListener('change', () => {
        const currentZone = zoneSelect.value;
        const currentZoneBg = window.getComputedStyle(zones[currentZone]).backgroundColor;
        const hexColor = rgbToHex(currentZoneBg);
        customColorInput.value = hexColor;
        colorPreviewCircle.style.backgroundColor = hexColor;
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

function rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    const rgbValues = rgb.match(/\d+/g);
    if (!rgbValues) return '#313338';
    const r = parseInt(rgbValues[0]).toString(16).padStart(2, '0');
    const g = parseInt(rgbValues[1]).toString(16).padStart(2, '0');
    const b = parseInt(rgbValues[2]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

function renderMessages() {
    messagesContainer.innerHTML = '';
    const messages = JSON.parse(localStorage.getItem('local_messages') || '[]');
    
    messages.forEach((msg) => {
        const msgElement = document.createElement('div');
        msgElement.className = 'message';
        const firstLetter = msg.author.charAt(0).toUpperCase();
        const avatarColor = msg.author === myName ? '#5865f2' : '#747f8d';

        let actionsHtml = '';
        if (msg.author === myName) {
            actionsHtml = `
                <div class="message-actions">
                    <button class="action-btn" onclick="editMessage('${msg.id}')">✏️</button>
                    <button class="action-btn delete" onclick="deleteMessage('${msg.id}')">🗑️</button>
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

window.editMessage = function(msgId) {
    const messages = JSON.parse(localStorage.getItem('local_messages') || '[]');
    const msgIndex = messages.findIndex(m => m.id === msgId);
    if (msgIndex !== -1 && messages[msgIndex].author === myName) {
        const oldText = messages[msgIndex].text;
        const newText = prompt("Edit message:", oldText);
        if (newText !== null && newText.trim() !== '') {
            messages[msgIndex].text = newText.trim();
            localStorage.setItem('local_messages', JSON.stringify(messages));
            renderMessages();
        }
    }
}

window.deleteMessage = function(msgId) {
    if (confirm("Delete this message?")) {
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

renderMessages();
