
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const mongoURI = "mongodb://localhost:27017/csv-filter";

const connectDB = async (retryCount = 5) => {
    try {
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("✅ Mongo connected successfully");
    } catch (err) {
        console.error(`❌ Mongo connection error (Retries left: ${retryCount}):`, err.message);
        if (retryCount > 0) {
            console.log("🔄 Retrying in 5 seconds...");
            setTimeout(() => connectDB(retryCount - 1), 5000);
        } else {
            console.error("💀 Max retries reached. Please check your internet connection or DNS settings.");
        }
    }
};

connectDB();

const CsvSchema = new mongoose.Schema({
    shopDomain: { type: String, unique: true, required: true },
    shopName: String,
    shopCountry: String,
    shopEmail: String,
    date: String,
    event: String,
    additionalInfo: [{
        date: String,
        event: String,
        details: String,
        billingDate: String
    }]
}, { versionKey: false });

const CsvData = mongoose.model("csvdatas", CsvSchema);

const AccessTokenSchema = new mongoose.Schema({
    "Access token": String
}, { collection: 'accessToken', versionKey: false });

const AccessToken = mongoose.model("AccessToken", AccessTokenSchema);


const upload = multer({
    dest: "uploads/",
    fileFilter: (_, file, cb) =>
        cb(null, file.originalname.endsWith(".csv"))
});

const norm = v => (v || "").trim();

app.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file" });

    let insertedCount = 0;
    let updatedCount = 0;

    try {
        const shopData = {};

        const stream = fs.createReadStream(req.file.path).pipe(csv());
        for await (const row of stream) {
            const shopDomain = norm(row.shop_domain || row["Shop domain"]);
            if (!shopDomain) continue;

            const date = norm(row.date || row.Date);
            const event = norm(row.event || row.Event);
            const details = norm(row.details || row.Details || row.additional_info || row["Additional info"]);
            const billingDate = norm(row["Billing on"] || row.billing_date || row["Billing date"]);

            const rowData = {
                shopName: norm(row.shop_name || row["Shop name"]),
                shopCountry: norm(row.shop_country || row["Shop country"]),
                shopEmail: norm(row.email || row["Shop email"]),
                date,
                event,
                details,
                billingDate
            };

            if (!shopData[shopDomain]) shopData[shopDomain] = { rows: [] };
            shopData[shopDomain].rows.push(rowData);
        }

        const totalUniqueShops = Object.keys(shopData).length;
        console.log(`[CSV Processing] Unique Shops: ${totalUniqueShops}`);

        for (const shopDomain in shopData) {
            const rows = shopData[shopDomain].rows;
            const doc = await CsvData.findOne({ shopDomain });

            let allEvents = rows.map(r => ({
                date: r.date,
                event: r.event,
                details: r.details,
                billingDate: r.billingDate
            }));

            if (doc) {
                allEvents = [...doc.additionalInfo, ...allEvents];
            }

            const eventMap = new Map();
            allEvents.forEach(ev => {
                const key = `${ev.date}|${ev.event}`;
                if (!eventMap.has(key)) {
                    eventMap.set(key, ev);
                } else {
                    const existing = eventMap.get(key);
                    eventMap.set(key, {
                        ...existing,
                        details: ev.details || existing.details,
                        billingDate: ev.billingDate || existing.billingDate
                    });
                }
            });
            allEvents = Array.from(eventMap.values());
            allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

            if (allEvents.length === 0) continue;

            const mainEvent = allEvents[0];
            const data = {
                shopDomain,
                shopName: rows[0].shopName || "",
                shopCountry: rows[0].shopCountry || "",
                shopEmail: rows[0].shopEmail || "",
                date: mainEvent.date,
                event: mainEvent.event,
                additionalInfo: allEvents
            };

            if (doc) {
                Object.assign(doc, data);
                await doc.save();
                updatedCount++;
            } else {
                await CsvData.create(data);
                insertedCount++;
            }
        }

        fs.unlinkSync(req.file.path);

        const finalResponse = {
            status: "success",
            serverVersion: "1.3",
            totalShops: totalUniqueShops,
            newShops: insertedCount,
            updatedShops: updatedCount
        };

        console.log("[Final Response]", finalResponse);
        res.json(finalResponse);

    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ error: "Internal error", details: err.message });
    }
});

app.get("/", async (req, res) => {
    try {
        const data = await CsvData.find().sort({ _id: -1 });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "DB Error" });
    }
});

app.get("/shopify/metafields", async (req, res) => {
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
        console.error("Shopify API Error:", err);
        res.status(500).json({ error: "Failed to fetch from Shopify", details: err.message });
    }
});

app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));