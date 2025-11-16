// script.js
let stream;
let isMuted = false;
let isCameraOff = false;

async function startWebcam() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.muted = true; // Mute self-video to avoid feedback
        const selfVideo = document.getElementById('self-video');
        selfVideo.innerHTML = '';
        selfVideo.appendChild(video);
    } catch (err) {
        console.error("Error accessing webcam:", err);
        document.getElementById('self-video').innerHTML = 'Webcam not available';
    }
}

function toggleMute() {
    if (stream) {
        stream.getAudioTracks().forEach(track => {
            track.enabled = !track.enabled;
            isMuted = !track.enabled;
        });
        document.getElementById('mute-btn').innerText = isMuted ? '🎙️ Unmute Mic' : '🎙️ Mute Mic';
    }
}

function toggleCamera() {
    if (stream) {
        stream.getVideoTracks().forEach(track => {
            track.enabled = !track.enabled;
            isCameraOff = !track.enabled;
        });
        document.getElementById('camera-btn').innerText = isCameraOff ? '📷 Camera On' : '📷 Camera Off';
    }
}

async function startInterview() {
    const response = await fetch('/start_interview');
    const data = await response.json();
    updateQuestion(data);
}

async function nextQuestion() {
    const response = await fetch('/next_question');
    const data = await response.json();
    updateQuestion(data);
}

async function submitAnswer(question, index) {
    const answer = "User response placeholder"; // Replace with actual audio transcription if integrated
    const response = await fetch('/submit_answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer, question, index })
    });
    const data = await response.json();
    updateFeedback(data);
}

async function endInterview() {
    const response = await fetch('/end_interview');
    const data = await response.json();
    document.getElementById('interviewer-content').innerHTML = `<div>${data.message}. Video saved to ${data.video_file}</div>`;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
}

function updateQuestion(data) {
    const content = document.getElementById('interviewer-content');
    if (data.done) {
        content.innerHTML = `<div>${data.question}</div>`;
        endInterview();
    } else {
        content.innerHTML = `
            <div>Question ${data.index}: ${data.question}</div>
            <button onclick="submitAnswer('${data.question}', ${data.index})">Submit Answer</button>
        `;
    }
}

function updateFeedback(data) {
    const content = document.getElementById('interviewer-content');
    content.innerHTML += `<div>Feedback: ${data.feedback}</div>`;
    if (data.next) {
        setTimeout(nextQuestion, 2000); // Move to next question after 2 seconds
    }
}

document.getElementById('mute-btn').addEventListener('click', toggleMute);
document.getElementById('camera-btn').addEventListener('click', toggleCamera);
document.getElementById('disconnect-btn').addEventListener('click', endInterview);

window.onload = () => {
    startWebcam();
    startInterview();
};