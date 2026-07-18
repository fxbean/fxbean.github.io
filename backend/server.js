const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'https://yourusername.github.io'],
    credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// ===== ROBLOX API PROXY =====
const ROBLOX_API = {
    USER: (id) => `https://users.roblox.com/v1/users/${id}`,
    AVATAR: (id) => `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${id}&size=420x420&format=Png`,
    FOLLOWERS: (id) => `https://friends.roblox.com/v1/users/${id}/followers?limit=1`,
    FRIENDS: (id) => `https://friends.roblox.com/v1/users/${id}/friends/count`,
    FOLLOW: (id) => `https://friends.roblox.com/v1/users/${id}/follow`,
};

// ===== ENDPOINTS =====

// Get user profile
app.get('/api/user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.get(ROBLOX_API.USER(id));
        res.json(response.data);
    } catch (error) {
        console.error('User fetch error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ 
            error: 'User not found',
            details: error.response?.data || error.message 
        });
    }
});

// Get avatar
app.get('/api/avatar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.get(ROBLOX_API.AVATAR(id));
        res.json(response.data);
    } catch (error) {
        console.error('Avatar fetch error:', error.message);
        res.status(500).json({ error: 'Failed to fetch avatar' });
    }
});

// Get follower count
app.get('/api/followers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.get(ROBLOX_API.FOLLOWERS(id));
        res.json(response.data);
    } catch (error) {
        console.error('Followers fetch error:', error.message);
        res.json({ total: '?' });
    }
});

// Get friend count
app.get('/api/friends/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.get(ROBLOX_API.FRIENDS(id));
        res.json(response.data);
    } catch (error) {
        console.error('Friends fetch error:', error.message);
        res.json({ count: '?' });
    }
});

// Get all profile data in one call
app.get('/api/profile/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [userRes, avatarRes, followersRes, friendsRes] = await Promise.all([
            axios.get(ROBLOX_API.USER(id)).catch(e => ({ data: null })),
            axios.get(ROBLOX_API.AVATAR(id)).catch(e => ({ data: null })),
            axios.get(ROBLOX_API.FOLLOWERS(id)).catch(e => ({ data: { total: '?' } })),
            axios.get(ROBLOX_API.FRIENDS(id)).catch(e => ({ data: { count: '?' } })),
        ]);

        const avatarUrl = avatarRes.data?.data?.[0]?.imageUrl || null;

        res.json({
            user: userRes.data,
            avatar: avatarUrl,
            followers: followersRes.data?.total || '?',
            friends: friendsRes.data?.count || '?',
        });
    } catch (error) {
        console.error('Profile fetch error:', error.message);
        res.status(500).json({ error: 'Failed to fetch profile data' });
    }
});

// Simulate following (this is where actual bot logic would go)
app.post('/api/follow', async (req, res) => {
    const { targetUserId, amount } = req.body;
    
    if (!targetUserId || !amount) {
        return res.status(400).json({ error: 'Missing targetUserId or amount' });
    }

    console.log(`📥 Received follow request for user ${targetUserId}: ${amount} followers`);

    // For now, simulate the process
    // In a real implementation, you'd use alt accounts here
    res.json({ 
        success: true, 
        message: `Started generating ${amount} followers for user ${targetUserId}`,
        simulated: true,
        estimatedTime: `${Math.ceil(amount * 0.3)} seconds`
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Roblox proxy API ready`);
});
