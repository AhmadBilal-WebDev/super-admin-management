import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        merchantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "merchant",
            required: true,
            index: true,
        },
        bussinessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "bussiness",
            required: true,
            index: true,
        },
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "branch",
            default: null,
            index: true,
        },
        branchName: {
            type: String,
            default: "",
            trim: true,
        },
        showAllBranches: {
            type: Boolean,
            default: false,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        slug: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: 1000,
        },
        image: {
            type: String,
            default: "",
        },
        displayOrder: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        tags: {
            type: [String],
            default: [],
        },
        products: {
            type: [
                {
                    productId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "restaurantproduct",
                        required: true,
                    },
                    name: {
                        type: String,
                        required: true,
                        trim: true,
                    },
                    sku: {
                        type: String,
                        default: "",
                        trim: true,
                    },
                },
            ],
            default: [],
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        createdByType: {
            type: String,
            enum: ["owner", "staff"],
            default: "owner",
        },
    },
    { timestamps: true }
);

categorySchema.index(
    { merchantId: 1, slug: 1, showAllBranches: 1, branchId: 1 },
    { unique: true }
);

const Category = mongoose.model("restaurantcategory", categorySchema);
export default Category;
