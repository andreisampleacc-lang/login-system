const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 10000;

// ✅ USE DATABASE_URL (THIS IS THE FIX)
const db = mysql.createConnection(process.env.DATABASE_URL);

db.connect(err => {
    if (err) {
        console.log("❌ DB connection failed:", err);
    } else {
        console.log("✅ Connected to Railway MySQL");
    }
});

// TEST ROUTE
app.get('/test-db', (req, res) => {
    db.query("SELECT * FROM users", (err, results) => {
        if (err) return res.json({ error: err });
        res.json(results);
    });
});

// SIGNUP
app.post('/signup', (req, res) => {
    const { username, password } = req.body;

    db.query(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, password],
        (err) => {
            if (err) return res.json({ success: false });
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
            if (err) return res.json({ success: false });

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