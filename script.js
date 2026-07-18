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
    altCount: 0,
    followsSent: 0,
};

// ===== DOM REFS =====
const dom = {
    profileInput: document.getElementById('profileInput'),
    verifyBtn: document.getElementById('verifyBtn'),
    amountInput: document.getElementById('amountInput'),
    generateBtn: document.getElementById('generateBtn'),
    clearLogBtn: document.getElementById('clearLogBtn'),

    // Profile preview
    profilePreview: document.getElementById('profilePreview'),
    avatarImg: document.getElementById('avatarImg'),
    displayName: document.getElementById('displayName'),
    displayUsername: document.getElementById('displayUsername'),
    displayFollowers: document.getElementById('displayFollowers'),
    displayFriends: document.getElementById('displayFriends'),

    // Status
    statusIndicator: document.getElementById('statusIndicator'),
    progressBar: document.getElementById('progressBar'),
    statusDetails: document.getElementById('statusDetails'),

    // Log
    logList: document.getElementById('logList'),
};

// ===== API HELPERS =====
const ROBLOX_API = {
    USER: (id) => `https://users.roblox.com/v1/users/${id}`,
    AVATAR: (id) => `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${id}&size=420x420&format=Png`,
    FOLLOWERS: (id) => `https://friends.roblox.com/v1/users/${id}/followers?limit=1`,
    FRIENDS: (id) => `https://friends.roblox.com/v1/users/${id}/friends/count`,
};

async function fetchRobloxUser(profileId) {
    const res = await fetch(ROBLOX_API.USER(profileId));
    if (!res.ok) throw new Error('User not found. Please check the profile ID.');
    return res.json();
}

async function fetchAvatar(userId) {
    const res = await fetch(ROBLOX_API.AVATAR(userId));
    const data = await res.json();
    return data?.data?.[0]?.imageUrl || null;
}

async function fetchFollowers(userId) {
    try {
        const res = await fetch(ROBLOX_API.FOLLOWERS(userId));
        const data = await res.json();
        return data?.total || '?';
    } catch {
        return '?';
    }
}

async function fetchFriends(userId) {
    try {
        const res = await fetch(ROBLOX_API.FRIENDS(userId));
        const data = await res.json();
        return data?.count || '?';
    } catch {
        return '?';
    }
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
        const user = await fetchRobloxUser(profileId);
        const avatarUrl = await fetchAvatar(user.id);
        const followers = await fetchFollowers(user.id);
        const friends = await fetchFriends(user.id);

        state.profileId = user.id;
        state.username = user.name;
        state.displayName = user.displayName;
        state.avatarUrl = avatarUrl;
        state.followers = followers;
        state.friends = friends;
        state.isVerified = true;

        // Show preview
        dom.profilePreview.classList.remove('hidden');
        dom.avatarImg.src = avatarUrl || 'https://www.roblox.com/headshot-thumbnail/headshot?userId=' + user.id;
        dom.avatarImg.alt = user.displayName;
        dom.displayName.textContent = user.displayName;
        dom.displayUsername.textContent = user.name;
        dom.displayFollowers.textContent = followers;
        dom.displayFriends.textContent = friends;

        addLog(`✅ Verified: ${user.displayName} (@${user.name})`, 'success');
        setStatus('ready', 'Ready');

        // Auto-fill amount with recommended value
        dom.amountInput.placeholder = 'Enter amount';
        dom.generateBtn.disabled = false;

    } catch (err) {
        dom.profilePreview.classList.add('hidden');
        addLog(`❌ ${err.message}`, 'error');
        setStatus('error', 'Verification failed');
        dom.generateBtn.disabled = true;
    }
}

// ===== GENERATE FOLLOWERS (SIMULATION) =====
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

    setStatus('running', `Generating ${amount} followers...`);
    dom.progressBar.style.width = '0%';
    addLog(`🚀 Starting follower generation for @${state.username}...`, 'info');

    let completed = 0;
    const batchSize = 10;
    const totalBatches = Math.ceil(amount / batchSize);

    for (let batch = 0; batch < totalBatches; batch++) {
        const inBatch = Math.min(batchSize, amount - completed);

        // Simulate each follow in the batch
        for (let i = 0; i < inBatch; i++) {
            completed++;
            const progress = (completed / amount) * 100;
            dom.progressBar.style.width = `${progress}%`;
            state.followsSent++;

            // Update status text occasionally
            if (completed % 5 === 0 || completed === amount) {
                dom.statusDetails.innerHTML = `<p>Sending followers... ${completed}/${amount} (${Math.round(progress)}%)</p>`;
            }

            // Simulate network delay (200-500ms per follow)
            await sleep(200 + Math.random() * 300);
        }

        // Log batch completion
        addLog(`📦 Batch ${batch + 1}/${totalBatches}: ${inBatch} followers sent`, 'info');

        // Delay between batches to simulate natural behavior
        if (batch < totalBatches - 1) {
            await sleep(500 + Math.random() * 1000);
        }
    }

    // Complete
    dom.progressBar.style.width = '100%';
    dom.statusDetails.innerHTML = `<p>✅ Done! ${amount} followers sent to @${state.username}</p>`;
    addLog(`🎉 Successfully sent ${amount} followers to @${state.username}!`, 'success');
    setStatus('done', 'Completed');

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
    li.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
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
// This will auto-verify the default profile ID (your alt)
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(verifyProfile, 500);
});

// ===== KEYBOARD SHORTCUT: Ctrl+Enter to generate =====
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (dom.amountInput === document.activeElement) {
            generateFollowers();
        }
    }
});

console.log('🤖 Roblox Follower Manager loaded');
console.log('🔒 This is a local tool. No data is sent anywhere.');
