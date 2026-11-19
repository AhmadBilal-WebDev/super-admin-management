import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Merchant from "../models/superadminModels/bussiness/merchant.js";
import Staff from "../models/restaurantModels/staff.js";
import RevokedOwnerToken from "../models/restaurantModels/revokedOwnerToken.js";
import { getOwnerTokenKey } from "../utils/tenantUtils/ownerAuthToken.js";

let io = null;

const merchantRoom = (merchantId) => `merchant:${String(merchantId)}`;
const branchRoom = (merchantId, branchId) =>
    `merchant:${String(merchantId)}:branch:${String(branchId)}`;

const getTokenFromHandshake = (socket) => {
    const authToken = socket.handshake?.auth?.token;
    if (authToken) return String(authToken).replace(/^Bearer\s+/i, "").trim();

    const header = socket.handshake?.headers?.authorization;
    if (header && String(header).startsWith("Bearer ")) {
        return String(header).split(" ")[1];
    }

    const queryToken = socket.handshake?.query?.token;
    if (queryToken) return String(queryToken).trim();

    return "";
};

const authenticateSocket = async (socket) => {
    const token = getTokenFromHandshake(socket);
    if (!token) {
        throw new Error("Unauthorized. Token required");
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        const isExpired = error?.name === "TokenExpiredError";
        throw new Error(
            isExpired
                ? "Session expired. Please login again"
                : "Unauthorized. Invalid or expired token"
        );
    }

    const accountType = decoded.accountType || "owner";
    if (!["owner", "staff"].includes(accountType)) {
        throw new Error("Unauthorized. Restaurant access only");
    }

    const isRevoked = await RevokedOwnerToken.exists({
        jti: getOwnerTokenKey(token, decoded),
    });

    if (isRevoked) {
        throw new Error("Unauthorized. Token is logged out. Please login again");
    }

    if (accountType === "staff") {
        const staff = await Staff.findById(decoded.id || decoded.staffId).select(
            "-password -otp"
        );

        if (!staff || staff.isActive === false) {
            throw new Error("Unauthorized. Staff not found or inactive");
        }

        if (decoded.tokenVersion !== (staff.tokenVersion || 0)) {
            throw new Error("Unauthorized. Token is no longer valid");
        }

        const merchant = await Merchant.findById(staff.merchantId).select(
            "-password -otp"
        );

        if (!merchant || merchant.isActive === false) {
            throw new Error("Merchant account is inactive");
        }

        return {
            accountType: "staff",
            merchantId: merchant._id,
            actorId: staff._id,
            accessAllBranches: staff.accessAllBranches === true,
            branchIds: Array.isArray(staff.branchIds) ? staff.branchIds : [],
        };
    }

    const merchant = await Merchant.findById(
        decoded.id || decoded.merchantId
    ).select("-password -otp");

    if (!merchant || merchant.isActive === false) {
        throw new Error("Unauthorized. Owner not found or inactive");
    }

    if (decoded.tokenVersion !== (merchant.tokenVersion || 0)) {
        throw new Error("Unauthorized. Token is no longer valid");
    }

    return {
        accountType: "owner",
        merchantId: merchant._id,
        actorId: merchant._id,
        accessAllBranches: true,
        branchIds: [],
    };
};

const initRestaurantSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: true,
            credentials: true,
            methods: ["GET", "POST"],
        },
        // Works well for web + React Native / Flutter socket clients
        transports: ["websocket", "polling"],
        path: "/socket.io",
    });

    io.use(async (socket, next) => {
        try {
            const session = await authenticateSocket(socket);
            socket.data.session = session;
            next();
        } catch (error) {
            next(new Error(error.message || "Unauthorized"));
        }
    });

    io.on("connection", (socket) => {
        const session = socket.data.session;
        const room = merchantRoom(session.merchantId);

        socket.join(room);

        // Staff with limited branches also join branch rooms
        if (
            session.accountType === "staff" &&
            session.accessAllBranches !== true &&
            Array.isArray(session.branchIds)
        ) {
            session.branchIds.forEach((id) => {
                socket.join(branchRoom(session.merchantId, id));
            });
        }

        socket.emit("socket:ready", {
            success: true,
            accountType: session.accountType,
            merchantId: session.merchantId,
            room,
        });

        socket.on("notifications:subscribe", () => {
            socket.join(room);
            socket.emit("notifications:subscribed", { room });
        });

        socket.on("disconnect", () => {
            // no-op
        });
    });

    return io;
};

const getIO = () => io;

/**
 * Emit new order to owner/staff dashboards (web + mobile).
 * Owner/all-branch staff listen on merchant room.
 * Limited staff should also listen on branch room events if needed —
 * we emit both merchant + branch rooms.
 */
const emitNewOrderToOwner = ({ merchantId, branchId, payload }) => {
    if (!io || !merchantId) return;

    const eventPayload = {
        type: "new_order",
        ...payload,
        emittedAt: new Date().toISOString(),
    };

    io.to(merchantRoom(merchantId)).emit("order:new", eventPayload);
    io.to(merchantRoom(merchantId)).emit("notification:new", eventPayload);

    if (branchId) {
        io.to(branchRoom(merchantId, branchId)).emit("order:new", eventPayload);
        io.to(branchRoom(merchantId, branchId)).emit(
            "notification:new",
            eventPayload
        );
    }
};

export {
    initRestaurantSocket,
    getIO,
    emitNewOrderToOwner,
    merchantRoom,
    branchRoom,
};

export default initRestaurantSocket;
