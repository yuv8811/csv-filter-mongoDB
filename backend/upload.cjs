const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const csv = require("csv-parser");
const { CsvData, UploadHistory } = require("./db.cjs");

/* ----------------------------------
   CONFIG
---------------------------------- */

const upload = multer({
    dest: "uploads/",
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB hard cap
    fileFilter: (_, file, cb) =>
        cb(null, file.originalname.endsWith(".csv"))
});

const norm = v => (v || "").trim();

/* ----------------------------------
   CORE LOGIC
---------------------------------- */

async function processCsvFile(file) {
    const shopMap = new Map();

    const stream = fs.createReadStream(file.path).pipe(
        csv({ mapHeaders: ({ header }) => header.trim() })
    );

    for await (const row of stream) {
        const shopDomain = norm(row.shop_domain || row["Shop domain"]);
        if (!shopDomain) continue;

        const eventData = {
            date: norm(row.date || row.Date),
            event: norm(row.event || row.Event),
            details: norm(
                row.details ||
                row.Details ||
                row.additional_info ||
                row["Additional info"]
            ),
            billingDate: norm(
                row["Billing on"] ||
                row.billing_date ||
                row["Billing date"]
            )
        };

        const shopInfo = {
            shopName: norm(row.shop_name || row["Shop name"]),
            shopCountry: norm(row.shop_country || row["Shop country"]),
            shopEmail: norm(row.email || row["Shop email"])
        };

        if (!shopMap.has(shopDomain)) {
            shopMap.set(shopDomain, {
                info: shopInfo,
                events: []
            });
        }

        shopMap.get(shopDomain).events.push(eventData);
    }

    const bulkOps = [];
    let inserted = 0;
    let updated = 0;

    for (const [shopDomain, { info, events }] of shopMap.entries()) {
        // Deduplicate events
        const eventMap = new Map();
        for (const ev of events) {
            const key = `${ev.date}|${ev.event}`;
            const prev = eventMap.get(key);
            eventMap.set(key, {
                ...prev,
                ...ev,
                details: ev.details || prev?.details,
                billingDate: ev.billingDate || prev?.billingDate
            });
        }

        const finalEvents = Array.from(eventMap.values())
            .filter(e => e.date && e.event)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (!finalEvents.length) continue;

        const mainEvent = finalEvents[0];

        bulkOps.push({
            updateOne: {
                filter: { shopDomain },
                update: {
                    $set: {
                        shopDomain,
                        shopName: info.shopName,
                        shopCountry: info.shopCountry,
                        shopEmail: info.shopEmail,
                        date: mainEvent.date,
                        event: mainEvent.event,
                        additionalInfo: finalEvents
                    }
                },
                upsert: true
            }
        });
    }

    if (bulkOps.length) {
        const result = await CsvData.bulkWrite(bulkOps, { ordered: false });
        inserted = result.upsertedCount || 0;
        updated = result.modifiedCount || 0;
    }

    return {
        totalShops: shopMap.size,
        inserted,
        updated
    };
}

/* ----------------------------------
   ROUTES
---------------------------------- */

router.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
    }

    try {
        const result = await processCsvFile(req.file);

        fs.unlinkSync(req.file.path);

        const response = {
            status: "success",
            serverVersion: "2.0",
            totalShops: result.totalShops,
            newShops: result.inserted,
            updatedShops: result.updated
        };

        await UploadHistory.create({
            fileName: req.file.originalname,
            totalShops: result.totalShops,
            newShops: result.inserted,
            updatedShops: result.updated,
            status: "Success"
        });

        res.json(response);

    } catch (err) {
        console.error("Upload failed:", err);

        if (req.file && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (_) { }
        }

        await UploadHistory.create({
            fileName: req.file?.originalname || "unknown",
            status: "Failed",
            error: err.message
        });

        res.status(500).json({
            error: "Internal error",
            details: err.message
        });
    }
});

router.get("/api/upload-history", async (_, res) => {
    try {
        const history = await UploadHistory.find().sort({ date: -1 });
        res.json(history);
    } catch {
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

module.exports = router;
