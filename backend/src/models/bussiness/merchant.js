import mongoose from "mongoose";

const merchantSchema = new mongoose.Schema(
    {
        bussinessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "bussiness",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        nameKey: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        ownerFirstName: {
            type: String,
            required: true,
            trim: true,
        },
        ownerLastName: {
            type: String,
            required: true,
            trim: true,
        },
        ownerEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        frontendDomainUrl: {
            type: String,
            required: true,
            trim: true,
        },
        gender: {
            type: String,
            enum: ["male", "female"],
            required: true,
            set: (value) => String(value).toLowerCase(),
        },
        countryCode: {
            type: String,
            required: true,
            trim: true,
        },
        contactNumber: {
            type: String,
            required: true,
            trim: true,
        },
        headAddress: {
            type: String,
            required: true,
            trim: true,
        },
        country: {
            type: String,
            required: true,
            trim: true,
        },
        province: {
            type: String,
            required: true,
            trim: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
        },
        district: {
            type: String,
            required: true,
            trim: true,
        },
        businessType: {
            type: String,
            required: true,
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

merchantSchema.index({ bussinessId: 1, nameKey: 1 }, { unique: true });
merchantSchema.index({ bussinessId: 1, slug: 1 }, { unique: true });
merchantSchema.index({ ownerEmail: 1 }, { unique: true });
merchantSchema.index({ frontendDomainUrl: 1 }, { unique: true });

const Merchant = mongoose.model("merchant", merchantSchema);
export default Merchant;
