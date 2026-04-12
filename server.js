const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const session = require('express-session');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// SESSION
app.use(session({
    secret: 'secret123',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        sameSite: 'lax'
    }
}));

// DATABASE CONNECTION
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.MYSQLPORT
});

db.connect(err => {
    if (err) {
        console.log("❌ DB ERROR:", err);
    } else {
        console.log("✅ Connected to Railway DB");
    }
});

// CAESAR CIPHER
function caesarEncrypt(text, shift = 3) {
    return text.split('').map(c => {
        if (/[a-z]/i.test(c)) {
            const base = c === c.toUpperCase() ? 65 : 97;
            return String.fromCharCode((c.charCodeAt(0) - base + shift) % 26 + base);
        }
        return c;
    }).join('');
}

// 🔥 LOGIN (FINAL WORKING)
app.post('/login', (req, res) => {
    let { username, password } = req.body;

    console.log("📥 RAW INPUT:", req.body);

    if (!username || !password) {
        return res.json({ success: false });
    }

    username = username.trim();
    password = password.trim();

    const encrypted = caesarEncrypt(password, 3);

    console.log("🔐 CHECKING:", username, encrypted);

    // GET ALL USERS (avoid SQL mismatch issues)
    db.query("SELECT * FROM users", (err, results) => {

        if (err) {
            console.log("❌ DB ERROR:", err);
            return res.json({ success: false });
        }

        console.log("📦 USERS IN DB:", results);

        const user = results.find(u =>
            u.username.trim() === username &&
            u.password.trim() === encrypted
        );

        if (user) {
            console.log("✅ LOGIN SUCCESS");

            req.session.user = username;
            req.session.role = user.role;

            return res.json({ success: true });
        } else {
            console.log("❌ LOGIN FAILED");
            return res.json({ success: false });
        }
    });
});

// SIGNUP
app.post('/signup', (req, res) => {
    let { username, password } = req.body;

    if (!username || !password) {
        return res.json({ success: false });
    }

    username = username.trim();
    password = password.trim();

    const encrypted = caesarEncrypt(password, 3);

    db.query(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, encrypted],
        (err) => {
            if (err) {
                console.log("❌ SIGNUP ERROR:", err);
                return res.json({ success: false });
            }

            console.log("✅ USER CREATED");
            res.json({ success: true });
        }
    );
});

// SESSION CHECK
app.get('/session', (req, res) => {
    if (req.session.user) {
        res.json({
            loggedIn: true,
            user: req.session.user,
            role: req.session.role
        });
    } else {
        res.json({ loggedIn: false });
    }
});

// LOGOUT
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true });
    });
});

// HOME
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Running on port " + PORT));