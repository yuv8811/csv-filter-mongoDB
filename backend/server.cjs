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

const upload = multer({
    dest: "uploads/",
    fileFilter: (_, file, cb) =>
        cb(null, file.originalname.endsWith(".csv"))
});

const norm = v => (v || "").trim();

app.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file" });

    let inserted = 0, updated = 0;

    try {
        const shopData = {};

        for await (const row of fs.createReadStream(req.file.path).pipe(csv())) {
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
                // Merge with existing additionalInfo and avoid duplicates
                allEvents = [...doc.additionalInfo, ...allEvents];
            }

            const eventMap = new Map();
            allEvents.forEach(ev => {
                const key = `${ev.date}|${ev.event}`;
                if (!eventMap.has(key)) {
                    eventMap.set(key, ev);
                } else {
                    const existing = eventMap.get(key);
                    // Crucial: Update if we have more info (details or billing date)
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
            const additionalInfo = allEvents;

            // Extract the most complete data for the first row properties
            const firstRowData = rows[0];

            const data = {
                shopDomain,
                shopName: firstRowData.shopName,
                shopCountry: firstRowData.shopCountry,
                shopEmail: firstRowData.shopEmail,
                date: mainEvent.date,
                event: mainEvent.event,
                additionalInfo
            };

            if (doc) {
                Object.assign(doc, data);
                await doc.save();
                updated++;
            } else {
                await CsvData.create(data);
                inserted++;
            }
        }

        fs.unlinkSync(req.file.path);
        res.json({ message: "Processed", inserted, updated });

    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ error: "Internal error" });
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

app.listen(3000, () => console.log("🚀 http://localhost:3000"));