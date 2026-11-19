import http from "http";
import express from "express";
import dotenv from "dotenv";
dotenv.config();
import db from "./src/config/db.js";
import authRouter from "./src/routers/superadminRouter/authRouter.js";
import bussinessRoute from "./src/routers/superadminRouter/bussinessRoute.js";
import ownerRouter from "./src/routers/tenantRouter/ownerLogin.js";
import restaurantRoute from "./src/routers/restaurantRouter/restaurantRouters.js";
import userRoute from "./src/routers/restaurantRouter/userRouters.js";
import errorHandler from "./src/middlewares/superAdminMiddleware/errorHandler.js";
import cors from "cors";
import { initRestaurantSocket } from "./src/socket/restaurantSocket.js";

const app = express();
const server = http.createServer(app);

app.use(cors());

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/", (req, res) => {
  res.send("Server Deployed Successfully!");
});

app.use("/api/auth", authRouter);
app.use("/api/auth", bussinessRoute);
app.use("/api/tenant", ownerRouter);
app.use("/api/restaurant", restaurantRoute);
app.use("/api/restaurant/user", userRoute);

app.use(errorHandler);

// Real-time owner dashboard notifications (web + mobile)
initRestaurantSocket(server);

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
