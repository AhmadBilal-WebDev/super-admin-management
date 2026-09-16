import mongoose from "mongoose";

const bussinessSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        nameKey: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: 500,
        },
        slug: {
            type: String,
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "superadmin",
            default: null,
        },
    },
    { timestamps: true }
);

const Bussiness = mongoose.model("bussiness", bussinessSchema);
export default Bussiness;
