const mongoose = require("mongoose");

const connectDB = async (retryCount = 5) => {
    const mongoURI = process.env.MONGO_URI;
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

const ShopInfoSchema = new mongoose.Schema({
    shop: String,
    phone: String,
    customer: Number,
    shop_owner: String,
    shop_type: String
}, { collection: 'shop_info', strict: false });

const ShopInfo = mongoose.model("ShopInfo", ShopInfoSchema);

const CsvSchema = new mongoose.Schema({
    shopDomain: { type: String, unique: true, required: true },
    shopName: String,
    shopCountry: String,
    shopEmail: String,
    date: String,
    event: String,
    phone: String,
    customer: Number,
    shop_owner: String,
    shop_type: String,
    additionalInfo: [{
        date: String,
        event: String,
        details: String,
        billingDate: String
    }]
}, { versionKey: false });

const CsvData = mongoose.model("installations", CsvSchema);

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true }
}, { collection: 'user', versionKey: false });

const User = mongoose.model("User", UserSchema);

const AccessTokenSchema = new mongoose.Schema({
    "Access token": String
}, { collection: 'accessToken', versionKey: false });

const AccessToken = mongoose.model("AccessToken", AccessTokenSchema);

const UploadHistorySchema = new mongoose.Schema({
    fileName: String,
    date: { type: Date, default: Date.now },
    totalShops: Number,
    newShops: Number,
    updatedShops: Number,
    status: { type: String, enum: ['Success', 'Failed'], default: 'Success' },
    error: String
}, { collection: 'upload_history', versionKey: false });

const UploadHistory = mongoose.model("UploadHistory", UploadHistorySchema);

const SessionDataSchema = new mongoose.Schema({
    key: String,
    value: mongoose.Schema.Types.Mixed
}, { collection: 'session_data', strict: false, timestamps: true });
const SessionData = mongoose.model("SessionData", SessionDataSchema);

const MerchantDataSchema = new mongoose.Schema({}, { collection: 'merchantData', strict: false });
const MerchantData = mongoose.model("MerchantData", MerchantDataSchema);

module.exports = {
    connectDB,
    ShopInfo,
    CsvData,
    User,
    AccessToken,
    UploadHistory,
    SessionData,
    MerchantData
};
