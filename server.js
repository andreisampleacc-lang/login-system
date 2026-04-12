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
    saveUninitialized: false
}));

// DATABASE
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
        console.log("✅ Connected to DB");
    }
});

// CAESAR
function caesarEncrypt(text, shift = 3) {
    return text.split('').map(c => {
        if (/[a-z]/i.test(c)) {
            const base = c === c.toUpperCase() ? 65 : 97;
            return String.fromCharCode((c.charCodeAt(0) - base + shift) % 26 + base);
        }
        return c;
    }).join('');
}

// LOGIN
app.post('/login', (req, res) => {
    let { username, password } = req.body;

    if (!username || !password) {
        return res.json({ success: false });
    }

    username = username.trim();
    password = password.trim();

    const encrypted = caesarEncrypt(password, 3);

    db.query("SELECT * FROM users", (err, results) => {
        if (err) {
            console.log("❌ LOGIN DB ERROR:", err);
            return res.json({ success: false });
        }

        console.log("📦 USERS:", results);
        console.log("🔍 CHECK:", username, encrypted);

        const user = results.find(u =>
            u.username.trim() === username &&
            u.password.trim() === encrypted
        );

        if (user) {
            req.session.user = user.username;
            req.session.role = user.role;
            return res.json({ success: true });
        } else {
            return res.json({ success: false });
        }
    });
});

// SIGNUP
app.post('/signup', (req, res) => {
    let { username, password } = req.body;

    username = username.trim();
    password = password.trim();

    const encrypted = caesarEncrypt(password, 3);

    db.query(
        "INSERT INTO users (username, password, role) VALUES (?, ?, 'user')",
        [username, encrypted],
        (err) => {
            if (err) return res.json({ success: false });
            res.json({ success: true });
        }
    );
});

// 🔥 TEST ROUTE 1
app.get('/ping', (req, res) => {
    res.send("SERVER WORKING");
});

// 🔥 TEST ROUTE 2 (DATABASE)
app.get('/test-db', (req, res) => {
    db.query("SELECT * FROM users", (err, results) => {
        if (err) {
            console.log("❌ TEST DB ERROR:", err);
            return res.json({ error: err });
        }
        console.log("📦 TEST DB:", results);
        res.json(results);
    });
});

// HOME
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Running on port " + PORT));