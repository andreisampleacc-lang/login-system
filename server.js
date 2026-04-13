const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// =======================
// MIDDLEWARE
// =======================
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 10000;

// =======================
// DATABASE
// =======================
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "", // change if you have password
    database: "MySQL",
    port: 3306
});

db.connect(err => {
    if (err) console.log("❌ DB ERROR:", err);
    else console.log("✅ Connected to DB");
});

// =======================
// ROOT
// =======================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =======================
// SIGNUP
// =======================
app.post('/signup', (req, res) => {
    const { username, password, face, fingerprint } = req.body;

    if (!username || !password || !face || !fingerprint) {
        return res.json({ success: false });
    }

    db.query(
        "INSERT INTO users (username, password, face_data, fingerprint_data) VALUES (?, ?, ?, ?)",
        [username, password, JSON.stringify(face), fingerprint],
        (err) => {
            if (err) return res.json({ success: false });
            res.json({ success: true });
        }
    );
});

// =======================
// LOGIN (CHECK USER)
// =======================
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE username=? AND password=?",
        [username, password],
        (err, results) => {
            if (err || results.length === 0) {
                return res.json({ exists: false });
            }
            res.json({ exists: true });
        }
    );
});

// =======================
// FACE CHECK
// =======================
app.post('/login-face', (req, res) => {
    const { username, face } = req.body;

    db.query(
        "SELECT face_data FROM users WHERE username=?",
        [username],
        (err, results) => {
            if (err || results.length === 0) {
                return res.json({ success: false });
            }

            const storedFace = JSON.parse(results[0].face_data);
            const distance = faceDistance(face, storedFace);

            res.json({ success: distance < 0.4 });
        }
    );
});

// =======================
// FINGERPRINT CHECK
// =======================
app.post('/login-fingerprint', (req, res) => {
    const { username, fingerprint } = req.body;

    db.query(
        "SELECT fingerprint_data FROM users WHERE username=?",
        [username],
        (err, results) => {
            if (err || results.length === 0) {
                return res.json({ success: false });
            }

            if (
                results[0].fingerprint_data === fingerprint ||
                fingerprint === "phone_verified"
            ) {
                res.json({ success: true });
            } else {
                res.json({ success: false });
            }
        }
    );
});

// =======================
// GET USERS (ADMIN)
// =======================
app.get('/users', (req, res) => {
    db.query("SELECT username, password FROM users", (err, results) => {
        if (err) return res.json([]);
        res.json(results);
    });
});

// =======================
// DELETE USER (ADMIN)
// =======================
app.post('/delete-user', (req, res) => {
    const { username } = req.body;

    db.query(
        "DELETE FROM users WHERE username=?",
        [username],
        (err) => {
            if (err) return res.json({ success: false });
            res.json({ success: true });
        }
    );
});

// =======================
// FACE DISTANCE
// =======================
function faceDistance(face1, face2) {
    let sum = 0;
    for (let i = 0; i < face1.length; i++) {
        sum += Math.pow(face1[i] - face2[i], 2);
    }
    return Math.sqrt(sum);
}

// =======================
app.listen(PORT, () => {
    console.log("🚀 Running on port " + PORT);
});