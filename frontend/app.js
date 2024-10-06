const socket = io();

// Retrieve nickname from local storage
let nickname = localStorage.getItem('nickname');

// If no nickname, redirect to login page
if (!nickname) {
    window.location.href = 'login.html';
}

// Initialize DOM elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startChatButton = document.getElementById('start-chat');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send');

// Local and Remote Streams
let localStream;
let remoteStream;
let peerConnection;

// Configuration for WebRTC connection
const config = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' } // Use a STUN server
    ]
};

// Function to start video chat
startChatButton.addEventListener('click', async () => {
    // Request access to the webcam and microphone
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    // Signal for finding a partner
    socket.emit('findPartner');
});

// Handle partner found event
socket.on('partnerFound', async (partnerId) => {
    peerConnection = new RTCPeerConnection(config);

    // Add local stream to peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Set up remote stream
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('signal', { candidate: event.candidate, partnerId });
        }
    };

    // Handle signaling
    socket.on('signal', async (data) => {
        if (data.signal) {
            if (data.from !== socket.id) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                socket.emit('signal', { signal: peerConnection.localDescription, partnerId });
            }
        } else if (data.candidate) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    });
});

// Function to send a message
sendButton.onclick = () => {
    const message = messageInput.value.trim();
    if (message) {
        const fullMessage = `${nickname}: ${message}`; // Prefix message with nickname
        socket.emit('message', fullMessage);
        appendMessage(fullMessage); // Display message in chat
        messageInput.value = ''; // Clear the input after sending
    }
};

// Listen for incoming messages
socket.on('message', (message) => {
    appendMessage(message);
});

// Function to append message to messages div
function appendMessage(message) {
    const newMessage = document.createElement('div');
    newMessage.innerText = message;
    newMessage.classList.add('chat-message');
    messagesDiv.appendChild(newMessage);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to the latest message
}

// Handle nickname change (optional)
document.getElementById('nickname').onchange = (event) => {
    nickname = event.target.value;
    if (nickname) {
        localStorage.setItem('nickname', nickname); // Update nickname in local storage
        socket.emit('join', nickname);
    }
};

// Optional: Send message on Enter key press
messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendButton.click(); // Trigger send button click
    }
});
