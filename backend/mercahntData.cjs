const express = require('express');
const router = express.Router();
const { MerchantData } = require('./db.cjs');

router.get('/merchant-data', async (req, res) => {
    try {
        const data = await MerchantData.find({}, {
            storeName: 1,
            analytics: 1
        });
        res.json(data);
    } catch (err) {
        console.error("Error fetching merchant data:", err);
        res.status(500).json({ error: "Error fetching merchant data" });
    }
});

module.exports = router;
