
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
const metafieldRouter = require("./metafield.cjs");

app.use(uploadRouter);
app.use(loginRouter);
app.use(metafieldRouter);



app.get("/", async (req, res) => {
    try {
        const data = await CsvData.find().sort({ _id: -1 });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "DB Error" });
    }
});




app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));