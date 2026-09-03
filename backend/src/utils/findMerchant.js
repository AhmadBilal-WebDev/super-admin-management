import mongoose from "mongoose";
import Merchant from "../models/bussiness/merchant.js";

const findMerchant = async (lookup, bussinessId = null) => {
    if (!lookup) {
        return null;
    }

    const value = String(lookup).trim();
    const filter = {};

    if (bussinessId) {
        filter.bussinessId = bussinessId;
    }

    if (mongoose.Types.ObjectId.isValid(value)) {
        const byId = await Merchant.findOne({ ...filter, _id: value });
        if (byId) {
            return byId;
        }
    }

    return Merchant.findOne({
        ...filter,
        $or: [{ nameKey: value.toLowerCase() }, { slug: value.toLowerCase() }],
    });
};

export default findMerchant;
