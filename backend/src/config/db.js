import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI);

const db = mongoose.connection;

db.on("connected", () => {
    console.log("MongoDB Connected Successfully!");
});

db.on("error", (error) => {
    console.log("MongoDB Connection Error:", error.message);
});

db.on("disconnected", () => {
    console.log("MongoDB Disconnected!");
});

export default db;
