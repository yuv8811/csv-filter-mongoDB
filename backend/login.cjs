const express = require('express');
const router = express.Router();
const { User } = require('./db.cjs');

const accessConfig = require('../src/config/access.json');

// const bcrypt = require('bcryptjs'); // Removed for Base64

router.post("/login", async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
        return res.status(400).json({ error: "Username/Email and Password are required" });
    }

    try {
        const user = await User.findOne({
            $or: [{ username: identifier }, { email: identifier }]
        });
        
        if (!user) {
             return res.status(401).json({ error: "Invalid credentials" });
        }

        // Verify password (Base64 decode comparison)
        // const isMatch = await bcrypt.compare(password, user.password);
        const encodedInput = Buffer.from(password).toString('base64');
        
        if (encodedInput !== user.password) {
             return res.status(401).json({ error: "Invalid credentials" });
        }

        // Determine role: Check JSON assignment first, then DB, then default
        const assignedRole = accessConfig.user_assignments[user.username] || 
                           accessConfig.user_assignments[user.email] || 
                           user.role || 
                           'merchant';

        res.json({ success: true, message: "Login successful", user: { email: user.email, _id: user._id, role: assignedRole } });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: "Username or Email already exists" });
        }

        // Simple Base64 encoding as requested
        const encodedPassword = Buffer.from(password).toString('base64');

        const newUser = new User({
            username,
            email,
            password: encodedPassword,
            role: 'merchant' // Default role
        });

        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/verify-user", async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ valid: false });

    try {
        const user = await User.findById(userId).select('-password');
        if (user) {
            const assignedRole = accessConfig.user_assignments[user.username] || 
                               accessConfig.user_assignments[user.email] || 
                               user.role || 
                               'merchant';
            res.json({ valid: true, role: assignedRole });
        } else {
            res.json({ valid: false });
        }
    } catch (err) {
        console.error("Verification error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;