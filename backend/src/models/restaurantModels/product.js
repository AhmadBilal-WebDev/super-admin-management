import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        size: { type: String, default: "", trim: true },
        portion: { type: String, default: "", trim: true },
        price: { type: Number, required: true, min: 0 },
        discountPrice: { type: Number, default: null, min: 0 },
        sku: { type: String, default: "", trim: true },
        isActive: { type: Boolean, default: true },
    },
    { _id: true }
);

const addonSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0, default: 0 },
        isActive: { type: Boolean, default: true },
        isRequired: { type: Boolean, default: false },
        maxQuantity: { type: Number, default: 1, min: 1 },
    },
    { _id: true }
);

const ingredientSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        quantity: { type: Number, default: 0, min: 0 },
        unit: { type: String, default: "", trim: true },
    },
    { _id: true }
);

const productSchema = new mongoose.Schema(
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
            type: [String],
            default: [],
        },
        showAllBranches: {
            type: Boolean,
            default: false,
            index: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "restaurantcategory",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 160,
        },
        slug: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        sku: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: 2000,
        },
        image: {
            type: String,
            default: "",
            trim: true,
        },
        tags: {
            type: [String],
            default: [],
            index: true,
        },
        costPrice: {
            type: Number,
            default: 0,
            min: 0,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        discountPrice: {
            type: Number,
            default: null,
            min: 0,
        },
        tax: {
            type: Number,
            default: 0,
            min: 0,
        },
        variants: {
            type: [variantSchema],
            default: [],
        },
        addons: {
            type: [addonSchema],
            default: [],
        },
        availabilityStatus: {
            type: String,
            enum: ["available", "out_of_stock", "unavailable"],
            default: "available",
        },
        availableDays: {
            type: [String],
            default: [],
        },
        availableFrom: {
            type: String,
            default: "",
            trim: true,
        },
        availableTo: {
            type: String,
            default: "",
            trim: true,
        },
        ingredients: {
            type: [ingredientSchema],
            default: [],
        },
        stockQuantity: {
            type: Number,
            default: 0,
            min: 0,
        },
        recipe: {
            type: String,
            default: "",
            trim: true,
            maxlength: 5000,
        },
        calories: {
            type: Number,
            default: null,
            min: 0,
        },
        allergens: {
            type: [String],
            default: [],
        },
        preparationTime: {
            type: Number,
            default: null,
            min: 0,
        },
        notes: {
            type: String,
            default: "",
            trim: true,
            maxlength: 1000,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        isRecommended: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        displayOrder: {
            type: Number,
            default: 0,
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

productSchema.index(
    { merchantId: 1, sku: 1, showAllBranches: 1, branchId: 1 },
    { unique: true }
);
productSchema.index(
    { merchantId: 1, slug: 1, showAllBranches: 1, branchId: 1 },
    { unique: true }
);
productSchema.index({ merchantId: 1, categoryId: 1, displayOrder: 1 });

const Product = mongoose.model("restaurantproduct", productSchema);
export default Product;
