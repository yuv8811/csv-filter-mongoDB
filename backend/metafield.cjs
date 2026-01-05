const express = require('express');
const router = express.Router();
const { AccessToken } = require('./db.cjs');

router.get("/shopify/metafields", async (req, res) => {
    const { shop } = req.query;
    if (!shop) return res.status(400).json({ error: "Shop domain is required" });

    const tokenDoc = await AccessToken.findOne();
    const accessToken = tokenDoc ? tokenDoc["Access token"] : null;

    const query = `
        {
        shop {
            name
            email
            myshopifyDomain
            plan {
              displayName
            }
            metafields(first: 50) {
            edges {
                node {
                id
                namespace
                key
                value
                type
                }
            }
            }
        }
        }
    `;


    try {
        const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": accessToken,
            },
            body: JSON.stringify({ query }),
        });

        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch from Shopify", details: err.message });
    }
});

module.exports = router;