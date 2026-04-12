const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 10000;

// ✅ DATABASE CONNECTION (FROM DATABASE_URL)
const url = new URL(process.env.DATABASE_URL);

const db = mysql.createConnection({
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', ''),
    port: url.port
});

// connect
db.connect(err => {
    if (err) {
        console.log("❌ DB ERROR:", err);
    } else {
        console.log("✅ Connected to DB");
    }
});

// ✅ ROOT PAGE
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ TEST DB
app.get('/test-db', (req, res) => {
    db.query("SELECT * FROM users", (err, results) => {
        if (err) {
            console.log("❌ TEST ERROR:", err);
            return res.json({ error: err });
        }
        res.json(results);
    });
});

// ✅ SIGNUP (WITH ERROR LOGGING)
app.post('/signup', (req, res) => {
    const { username, password } = req.body;

    console.log("SIGNUP:", username, password);

    db.query(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, password],
        (err) => {
            if (err) {
                console.log("❌ SIGNUP ERROR:", err);
                return res.json({ success: false, error: err.message });
            }

            console.log("✅ USER CREATED");
            res.json({ success: true });
        }
    );
});

// ✅ LOGIN
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE username=? AND password=?",
        [username, password],
        (err, results) => {
            if (err) {
                console.log("❌ LOGIN ERROR:", err);
                return res.json({ success: false });
            }

            if (results.length > 0) {
                res.json({ success: true });
            } else {
                res.json({ success: false });
            }
        }
    );
});

app.listen(PORT, () => {
    console.log("🚀 Running on port " + PORT);
});