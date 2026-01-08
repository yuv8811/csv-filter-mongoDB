const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/store-visits", async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: "Database not connected" });
        }

        const analyticsDb = mongoose.connection.useDb("Custlo_Analytics_Events");
        const collections = await analyticsDb.db.listCollections().toArray();

        const stats = await Promise.all(
            collections
                .filter(col => !col.name.startsWith("system."))
                .map(async ({ name }) => {
                    const collection = analyticsDb.db.collection(name);

                    const [result] = await collection
                        .aggregate([
                            {
                                $group: {
                                    _id: null,
                                    totalCount: {
                                        $sum: {
                                            $ifNull: ["$events.customer_portal.count", 0],
                                        },
                                    },
                                },
                            },
                        ])
                        .toArray();

                    return {
                        shopDomain: name,
                        totalCount: result?.totalCount || 0,
                    };
                })
        );

        res.json(stats);
    } catch (err) {
        console.error("Error fetching store visits:", err);
        res.status(500).json({ error: "Error fetching store visits" });
    }
});

module.exports = router;
