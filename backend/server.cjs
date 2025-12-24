const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/csv-filter")
    .then(() => console.log("✅ Mongo connected"))
    .catch(() => process.exit(1));

const CsvSchema = new mongoose.Schema({
    shopDomain: { type: String, unique: true, required: true },
    shopName: String,
    shopCountry: String,
    shopEmail: String,
    date: String,
    event: String,
    additionalInfo: [{ date: String, event: String, details: String }]
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

            const rowData = {
                shopName: norm(row.shop_name || row["Shop name"]),
                shopCountry: norm(row.shop_country || row["Shop country"]),
                shopEmail: norm(row.email || row["Shop email"]),
                date,
                event,
                details
            };

            if (!shopData[shopDomain]) shopData[shopDomain] = { rows: [] };
            shopData[shopDomain].rows.push(rowData);
        }

        for (const shopDomain in shopData) {
            const rows = shopData[shopDomain].rows;
            const doc = await CsvData.findOne({ shopDomain });

            let allEvents = rows.map(r => ({ date: r.date, event: r.event, details: r.details }));
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
                    // If we have details now but didn't before, update it
                    const existing = eventMap.get(key);
                    if (!existing.details && ev.details) {
                        eventMap.set(key, ev);
                    }
                }
            });
            allEvents = Array.from(eventMap.values());

            allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

            if (allEvents.length === 0) continue;

            const mainEvent = allEvents[0];
            const additionalInfo = allEvents;

            let mainRow = rows.find(r => r.date === mainEvent.date && r.event === mainEvent.event);
            if (!mainRow && doc) {
                mainRow = {
                    shopName: doc.shopName,
                    shopCountry: doc.shopCountry,
                    shopEmail: doc.shopEmail,
                    details: mainEvent.details
                };
            }
            if (!mainRow) mainRow = rows[0];

            const data = {
                shopDomain,
                shopName: mainRow.shopName,
                shopCountry: mainRow.shopCountry,
                shopEmail: mainRow.shopEmail,
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

        res.json({ message: "CSV processed", inserted, updated });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/", async (_, res) =>
    res.json(await CsvData.find())
);

app.listen(3000, () =>
    console.log("🚀 http://localhost:3000")
);