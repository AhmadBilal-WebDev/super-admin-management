import mongoose from "mongoose";
import Bussiness from "../models/bussiness/bussiness.js";

const findBussiness = async (lookup) => {
    if (!lookup) {
        return null;
    }

    const value = String(lookup).trim();

    if (mongoose.Types.ObjectId.isValid(value)) {
        const byId = await Bussiness.findById(value);
        if (byId) {
            return byId;
        }
    }

    return Bussiness.findOne({
        $or: [{ nameKey: value.toLowerCase() }, { slug: value.toLowerCase() }],
    });
};

export default findBussiness;
