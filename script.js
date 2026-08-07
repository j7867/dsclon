import { initializeApp } from "https://gstatic.com";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot } from "https://gstatic.com";

const firebaseConfig = {
    apiKey: "AIzaSyAY20LAIcpbkR6r4HUjCVctcWYfnDC4svw",
    authDomain: "://firebaseapp.com",
    projectId: "ds-chat78",
    storageBucket: "ds-chat78.firebasestorage.app",
    messagingSenderId: "1084561649631",
    appId: "1:1084561649631:web:5361cf4ae5540104e09e6a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let myName = localStorage.getItem('chat_nickname');
if (!myName) {
    myName = prompt("Введите ваш никнейм для чата:") || "Пользователь";
    localStorage.setItem('chat_nickname', myName);
}

const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const chatArea = document.getElementById('chatArea');

window.changeBg = function(color) {
    chatArea.style.backgroundColor = color;
}

const q = query(collection(db, "messages"), orderBy("time", "asc"));
onSnapshot(q, (snapshot) => {
    messagesContainer.innerHTML = '';
    snapshot.forEach((doc) => {
        const msg = doc.data();
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
});

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    messageInput.value = '';

    try {
        await addDoc(collection(db, "messages"), {
            author: myName,
            text: text,
            time: Date.now()
        });
    } catch (e) {
        console.error("Ошибка отправки: ", e);
    }
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
});
