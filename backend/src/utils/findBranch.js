import mongoose from "mongoose";
import Branch from "../models/bussiness/branch.js";

const findBranch = async (lookup, merchantId = null, bussinessId = null) => {
    if (!lookup) {
        return null;
    }

    const value = String(lookup).trim();
    const filter = {};

    if (merchantId) {
        filter.merchantId = merchantId;
    }

    if (bussinessId) {
        filter.bussinessId = bussinessId;
    }

    if (mongoose.Types.ObjectId.isValid(value)) {
        const byId = await Branch.findOne({ ...filter, _id: value });
        if (byId) {
            return byId;
        }
    }

    return Branch.findOne({
        ...filter,
        $or: [
            { nameKey: value.toLowerCase() },
            { slug: value.toLowerCase() },
            { branchCode: value.toUpperCase() },
        ],
    });
};

export default findBranch;
