
const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/merchant-store/:storeName", async (req, res) => {
    try {
        const { storeName } = req.params;
        if (!storeName) {
            return res.status(400).json({ error: "Store name is required" });
        }

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: "Database not connected" });
        }

        // Switch to 'Merchant_Store_Data' database
        const merchantDb = mongoose.connection.useDb("Merchant_Store_Data");
        
        // Access the collection dynamically
        const collection = merchantDb.db.collection(storeName);

        // Fetch all documents from the collection
        const data = await collection.find({}).toArray();

        res.json(data);
    } catch (err) {
        console.error("Error fetching merchant store data:", err);
        res.status(500).json({ error: "Error fetching merchant store data" });
    }
});

module.exports = router;
