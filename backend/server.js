import express from "express";
import dotenv from "dotenv";
dotenv.config();
import db from "./src/config/db.js";
import authRouter from "./src/routers/superadminRouter/authRouter.js";
import bussinessRoute from "./src/routers/superadminRouter/bussinessRoute.js";
import ownerRouter from "./src/routers/tenantRouter/ownerLogin.js";
import errorHandler from "./src/middlewares/superAdminMiddleware/errorHandler.js";
import cors from "cors";

const app = express();

const corsOrigin = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};

app.use(cors());

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/", (req, res) => {
  res.send("Server Deployed Successfully!");
});

app.use("/api/auth", authRouter);
app.use("/api/auth", bussinessRoute);
app.use("/api/tenant", ownerRouter);

app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
