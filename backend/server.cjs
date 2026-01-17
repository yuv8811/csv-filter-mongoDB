
const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const {
    connectDB,
    ShopInfo,
    CsvData,
    User,
    AccessToken,
    UploadHistory
} = require("./db.cjs");

connectDB();



const uploadRouter = require("./upload.cjs");
const loginRouter = require("./login.cjs");

const storeVisitRouter = require("./storeVisit.cjs");
const merchantStoreRouter = require("./merchantStore.cjs");

app.use(uploadRouter);
app.use(loginRouter);

app.use(storeVisitRouter);
app.use(merchantStoreRouter);



app.get("/", async (req, res) => {
    try {
        const data = await CsvData.find().sort({ _id: -1 });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "DB Error" });
    }
});

app.get("/shop-details/:domain", async (req, res) => {
    try {
        const { domain } = req.params;
        const installationData = await CsvData.findOne({ shopDomain: domain });
        const shopInfoData = await ShopInfo.findOne({ shop: domain });

        let mergedData = {};

        if (installationData) {
            mergedData = { ...installationData.toObject() };
        }

        if (shopInfoData) {
            mergedData.shop_owner = shopInfoData.shop_owner || mergedData.shop_owner;
            mergedData.phone = shopInfoData.phone || mergedData.phone;
            mergedData.shop_type = shopInfoData.shop_type || mergedData.shop_type;
            mergedData.customer = shopInfoData.customer || mergedData.customer;
        }

        res.json(mergedData);
    } catch (err) {
        console.error("Error fetching shop details:", err);
        res.status(500).json({ error: "Error fetching shop details" });
    }
});

app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));