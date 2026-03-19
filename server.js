const express = require('express');
const session = require('express-session');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

// YOUR DISCORD CREDENTIALS
const CLIENT_ID = '1484189679762014352';
const CLIENT_SECRET = 'kb7Ff6JrQzLQKYJyn1OLssu9NGwOONQr';
const REDIRECT_URI = 'http://ijscamengl.github.io/ijscamengl/auth/callback';

app.use(session({
    secret: 'tiktok-clone-secret',
    resave: false,
    saveUninitialized: true
}));

app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

// 1. DISCORD LOGIN ROUTE
app.get('/login', (req, res) => {
    const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
    res.redirect(url);
});

// 2. DISCORD CALLBACK
app.get('/auth/callback', async (req, res) => {
    const code = req.query.code;
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
    });

    try {
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', params);
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
        });
        req.session.user = userResponse.data;
        res.redirect('/');
    } catch (err) {
        res.send('Login Failed');
    }
});

// 3. VIDEO UPLOAD
let db = []; // Temporary in-memory database
app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.session.user) return res.status(401).send('Login required');
    
    const videoData = {
        url: `/uploads/${req.file.filename}`,
        username: req.session.user.username,
        avatar: `https://cdn.discordapp.com/avatars/${req.session.user.id}/${req.session.user.avatar}.png`
    };
    db.unshift(videoData); // Add to top of FYP
    res.redirect('/');
});

app.get('/videos', (req, res) => res.json({ videos: db, user: req.session.user }));

app.listen(3000, () => console.log('Server running at http://localhost:3000'));
