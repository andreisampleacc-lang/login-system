const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 10000;

// ✅ PARSE DATABASE_URL CORRECTLY
const url = new URL(process.env.DATABASE_URL);

const db = mysql.createConnection({
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', ''),
    port: url.port
});

// CONNECT
db.connect(err => {
    if (err) {
        console.log("❌ DB ERROR:", err);
    } else {
        console.log("✅ Connected to Railway DB");
    }
});

// TEST
app.get('/test-db', (req, res) => {
    db.query("SELECT 1", (err, result) => {
        if (err) return res.json({ error: err });
        res.json({ success: true });
    });
});

// SIGNUP
app.post('/signup', (req, res) => {
    const { username, password } = req.body;

    db.query(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, password],
        (err) => {
            if (err) {
                console.log(err);
                return res.json({ success: false });
            }
            res.json({ success: true });
        }
    );
});

// LOGIN
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE username=? AND password=?",
        [username, password],
        (err, results) => {
            if (err) {
                console.log(err);
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