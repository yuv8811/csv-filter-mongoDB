const express = require('express');
const router = express.Router();
const { ShopifySession } = require('./db.cjs');

router.get("/shopify/metafields", async (req, res) => {
    const { shop } = req.query;
    if (!shop) return res.status(400).json({ error: "Shop domain is required" });

    try {
        
        // Try finding session in the new collection first
        let accessToken = null;
        // Search by 'shop' field OR 'id' field (common in Shopify session storage)
        const session = await ShopifySession.findOne({ 
            $or: [
                { shop: shop }, 
                { id: shop },
                { shopName: shop } // Covering another possibility
            ] 
        });
        

        if (session && session.accessToken) {
            accessToken = session.accessToken;
        } else if (session && session._doc && session._doc.accessToken) {
             // Sometimes mongoose result structure might vary slightly depending on version/setup
             accessToken = session._doc.accessToken;
        }
        
        if (!accessToken) {
             console.log("No access token found in session object.");
             return res.status(404).json({ error: "No Access Token found for this shop in session_data. Please reinstall or re-authenticate." });
        }

        const query = `
        {
          shop {
            name
            email
            myshopifyDomain
            plan {
              displayName
            }
            metafields(first: 100) {
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

        const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": accessToken,
            },
            body: JSON.stringify({ query }),
        });

        const data = await response.json();

        if (data.errors) {
            const errorDetails = JSON.stringify(data.errors);
            return res.status(500).json({ 
                error: `Shopify API Error: ${errorDetails}`, 
                details: data.errors 
            });
        }
        
        res.json(data);
    } catch (err) {
        console.error("Error fetching metafields:", err);
        res.status(500).json({ error: `Failed to fetch from Shopify: ${err.message}`, details: err.message });
    }
});

module.exports = router;