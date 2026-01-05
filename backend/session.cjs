const express = require('express');
const router = express.Router();
const { SessionData } = require('./db.cjs');

// GET all session data
router.get("/api/session-data", async (req, res) => {
    try {
        const fields = 'navigationMetafields profileMetafield settingMetafield registerSettingMetafield registerMetafield';
        const data = await SessionData.find({}, fields).sort({ createdAt: -1 });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch session data", details: err.message });
    }
});

// POST new session data
router.post("/api/session-data", async (req, res) => {
    try {
        const newData = await SessionData.create(req.body);
        res.status(201).json(newData);
    } catch (err) {
        res.status(500).json({ error: "Failed to create session data", details: err.message });
    }
});

// PUT update session data
router.put("/api/session-data/:id", async (req, res) => {
    try {
        const updatedData = await SessionData.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedData);
    } catch (err) {
        res.status(500).json({ error: "Failed to update session data", details: err.message });
    }
});

// DELETE session data
router.delete("/api/session-data/:id", async (req, res) => {
    try {
        await SessionData.findByIdAndDelete(req.params.id);
        res.json({ success: true, id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete session data", details: err.message });
    }
});

module.exports = router;
