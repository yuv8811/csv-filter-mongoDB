const express = require('express');
const router = express.Router();
const { User } = require('./db.cjs');

router.post("/login", async (req, res) => {
    const { identifier } = req.body;
    if (!identifier) {
        return res.status(400).json({ error: "Username/Email is required" });
    }

    try {
        const user = await User.findOne({
            $or: [{ username: identifier }, { email: identifier }]
        }).select('-password');
        if (user) {
            res.json({ success: true, message: "Login successful", user: { email: user.email, _id: user._id } });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/verify-user", async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ valid: false });

    try {
        const user = await User.findById(userId).select('-password');
        if (user) {
            res.json({ valid: true });
        } else {
            res.json({ valid: false });
        }
    } catch (err) {
        console.error("Verification error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;