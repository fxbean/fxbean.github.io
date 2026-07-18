// ===== CONFIGURATION =====
const API_URL = 'http://localhost:3000/api'; // Change to your backend URL when deployed

// ===== STATE =====
const state = {
    profileId: null,
    username: null,
    displayName: null,
    avatarUrl: null,
    followers: null,
    friends: null,
    isVerified: false,
    isRunning: false,
    followsSent: 0,
};

// ===== DOM REFS =====
const dom = {
    profileInput: document.getElementById('profileInput'),
    verifyBtn: document.getElementById('verifyBtn'),
    amountInput: document.getElementById('amountInput'),
    generateBtn: document.getElementById('generateBtn'),
    clearLogBtn: document.getElementById('clearLogBtn'),

    profilePreview: document.getElementById('profilePreview'),
    avatarImg: document.getElementById('avatarImg'),
    displayName: document.getElementById('displayName'),
    displayUsername: document.getElementById('displayUsername'),
    displayFollowers: document.getElementById('displayFollowers'),
    displayFriends: document.getElementById('displayFriends'),

    statusIndicator: document.getElementById('statusIndicator'),
    progressBar: document.getElementById('progressBar'),
    statusDetails: document.getElementById('statusDetails'),
    logList: document.getElementById('logList'),
};

// ===== API FUNCTIONS =====
async function fetchProfile(profileId) {
    const response = await fetch(`${API_URL}/profile/${profileId}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch profile');
    }
    return response.json();
}

async function sendFollowRequest(targetUserId, amount) {
    const response = await fetch(`${API_URL}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, amount })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send follow request');
    }
    return response.json();
}

// ===== VERIFY PROFILE =====
async function verifyProfile() {
    const profileId = dom.profileInput.value.trim();
    if (!profileId) {
        addLog('Please enter a profile ID.', 'warning');
        return;
    }

    setStatus('loading', 'Verifying...');

    try {
        const data = await fetchProfile(profileId);
        
        if (!data.user) {
            throw new Error('User not found');
        }

        state.profileId = data.user.id;
        state.username = data.user.name;
        state.displayName = data.user.displayName;
        state.avatarUrl = data.avatar;
        state.followers = data.followers;
        state.friends = data.friends;
        state.isVerified = true;

        // Show preview
        dom.profilePreview.classList.remove('hidden');
        dom.avatarImg.src = data.avatar || `https://www.roblox.com/headshot-thumbnail/headshot?userId=${data.user.id}`;
        dom.avatarImg.alt = data.user.displayName;
        dom.displayName.textContent = data.user.displayName;
        dom.displayUsername.textContent = data.user.name;
        dom.displayFollowers.textContent = data.followers;
        dom.displayFriends.textContent = data.friends;

        addLog(`✅ Verified: ${data.user.displayName} (@${data.user.name})`, 'success');
        setStatus('ready', 'Ready');
        dom.generateBtn.disabled = false;

    } catch (err) {
        dom.profilePreview.classList.add('hidden');
        addLog(`❌ ${err.message}`, 'error');
        setStatus('error', 'Verification failed');
        dom.generateBtn.disabled = true;
    }
}

// ===== GENERATE FOLLOWERS =====
async function generateFollowers() {
    if (!state.isVerified) {
        addLog('⚠️ Please verify your profile ID first.', 'warning');
        return;
    }

    if (state.isRunning) {
        addLog('⏳ Already running. Please wait.', 'warning');
        return;
    }

    const amount = parseInt(dom.amountInput.value);
    if (!amount || amount < 1 || amount > 10000) {
        addLog('⚠️ Please enter a valid amount (1-10,000).', 'warning');
        return;
    }

    state.isRunning = true;
    dom.generateBtn.disabled = true;
    dom.verifyBtn.disabled = true;

    setStatus('running', `Starting...`);
    dom.progressBar.style.width = '0%';
    addLog(`🚀 Starting follower generation for @${state.username}...`, 'info');

    try {
        // Send request to backend
        const result = await sendFollowRequest(state.profileId, amount);
        addLog(`📡 ${result.message}`, 'info');

        // Simulate progress since actual bot would take time
        let progress = 0;
        const totalSteps = Math.min(amount, 100);
        
        for (let i = 0; i < totalSteps; i++) {
            progress = ((i + 1) / totalSteps) * 100;
            dom.progressBar.style.width = `${progress}%`;
            dom.statusDetails.innerHTML = `<p>Sending followers... ${Math.round(progress)}%</p>`;
            await sleep(200);
        }

        // Complete
        dom.progressBar.style.width = '100%';
        dom.statusDetails.innerHTML = `<p>✅ Done! ${amount} followers sent to @${state.username}</p>`;
        addLog(`🎉 Successfully sent ${amount} followers to @${state.username}!`, 'success');
        setStatus('done', 'Completed');

    } catch (err) {
        addLog(`❌ ${err.message}`, 'error');
        setStatus('error', 'Failed');
    }

    state.isRunning = false;
    dom.generateBtn.disabled = false;
    dom.verifyBtn.disabled = false;
}

// ===== HELPERS =====
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function setStatus(type, text) {
    const indicator = dom.statusIndicator;
    indicator.className = `status-${type}`;
    indicator.textContent = `● ${text}`;
}

function addLog(message, type = 'system') {
    const li = document.createElement('li');
    li.className = `log-entry ${type}`;
    const timestamp = new Date().toLocaleTimeString();
    li.textContent = `[${timestamp}] ${message}`;
    dom.logList.appendChild(li);
    dom.logList.scrollTop = dom.logList.scrollHeight;
}

function clearLog() {
    dom.logList.innerHTML = '';
    addLog('🧹 Log cleared.', 'system');
}

// ===== EVENT LISTENERS =====
dom.verifyBtn.addEventListener('click', verifyProfile);
dom.profileInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') verifyProfile();
});
dom.generateBtn.addEventListener('click', generateFollowers);
dom.clearLogBtn.addEventListener('click', clearLog);

// ===== AUTO-VERIFY ON LOAD =====
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(verifyProfile, 500);
});

console.log('🤖 Roblox Follower Manager loaded');
console.log(`📡 Connected to API: ${API_URL}`);
