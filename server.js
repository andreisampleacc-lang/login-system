const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const session = require('express-session');

const app = express();

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ================= SESSION =================
app.use(session({
    secret: 'secret123',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // will still work on Render
}));

// ================= DATABASE (ENV READY) =================
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'login_db'
});

// ================= CONNECT DB =================
db.connect((err) => {
    if (err) {
        console.log("❌ DB Connection Failed:", err);
    } else {
        console.log("✅ Connected to MySQL");
    }
});

// ================= CAESAR CIPHER =================
function caesarEncrypt(text, shift = 3) {
    return text.split('').map(c => {
        if (/[a-z]/i.test(c)) {
            const base = c === c.toUpperCase() ? 65 : 97;
            return String.fromCharCode((c.charCodeAt(0) - base + shift) % 26 + base);
        }
        return c;
    }).join('');
}

// ================= LOGIN =================
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const encrypted = caesarEncrypt(password, 3);

    db.query(
        "SELECT * FROM users WHERE username=? AND password=?",
        [username, encrypted],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.json({ success: false });
            }

            if (result.length > 0) {
                req.session.user = username;
                req.session.role = result[0].role;

                res.json({ success: true, role: result[0].role });
            } else {
                res.json({ success: false });
            }
        }
    );
});

// ================= SIGNUP =================
app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    const encrypted = caesarEncrypt(password, 3);

    db.query(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, encrypted],
        (err) => {
            if (err) {
                console.log(err);
                return res.json({ success: false });
            }
            res.json({ success: true });
        }
    );
});

// ================= SESSION CHECK =================
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

// ================= ADMIN USERS =================
app.get('/users', (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).json([]);
    }

    db.query("SELECT username, password FROM users", (err, result) => {
        if (err) {
            console.log(err);
            return res.json([]);
        }
        res.json(result);
    });
});

// ================= LOGOUT =================
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true });
    });
});

// ================= DEFAULT ROUTE =================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ================= SERVER START =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});