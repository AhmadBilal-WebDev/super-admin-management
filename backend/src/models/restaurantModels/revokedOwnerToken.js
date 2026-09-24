import mongoose from "mongoose";

const revokedOwnerTokenSchema = new mongoose.Schema(
    {
        jti: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "merchant",
            default: null,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

// Auto-delete after token expiry so DB does not keep growing
revokedOwnerTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RevokedOwnerToken = mongoose.model(
    "revokedownertoken",
    revokedOwnerTokenSchema
);

export default RevokedOwnerToken;
