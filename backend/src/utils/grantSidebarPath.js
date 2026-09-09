import LoginSuperAdmin from "../models/auth/login.js";
import Bussiness from "../models/bussiness/bussiness.js";
import Merchant from "../models/bussiness/merchant.js";
import Branch from "../models/bussiness/branch.js";
import { toPermissionNodes, mergePermissionNodes } from "./permissionNode.js";

const toPathNode = (keys = []) => {
    if (!keys.length) {
        return null;
    }

    const [key, ...rest] = keys;

    return {
        key: String(key),
        buttons: rest.length ? [toPathNode(rest)] : [],
    };
};

const getCreatedSidebarPermissions = async (userId) => {
    if (!userId) {
        return [];
    }

    const [businesses, merchants, branches] = await Promise.all([
        Bussiness.find({ createdBy: userId, isActive: { $ne: false } }).select("_id"),
        Merchant.find({ createdBy: userId, isActive: { $ne: false } }).select(
            "_id bussinessId"
        ),
        Branch.find({ createdBy: userId, isActive: { $ne: false } }).select(
            "_id bussinessId merchantId"
        ),
    ]);

    const nodes = [];

    for (const item of businesses) {
        nodes.push(toPathNode(["viewbussiness", item._id]));
    }

    for (const item of merchants) {
        if (!item.bussinessId) {
            continue;
        }

        nodes.push(toPathNode(["viewbussiness", item.bussinessId, item._id]));
    }

    for (const item of branches) {
        if (!item.bussinessId || !item.merchantId) {
            continue;
        }

        nodes.push(
            toPathNode([
                "viewbussiness",
                item.bussinessId,
                item.merchantId,
                item._id,
            ])
        );
    }

    return mergePermissionNodes(nodes.filter(Boolean));
};

const getEffectiveAllowedSidebar = async (user) => {
    const allowed = toPermissionNodes(user?.allowedSidebar || []);

    if (!allowed.length) {
        return [];
    }

    const created = await getCreatedSidebarPermissions(user._id);
    return mergePermissionNodes([...allowed, ...created]);
};

const attachEffectiveSidebar = async (user) => {
    if (!user) {
        return user;
    }

    user.effectiveAllowedSidebar = await getEffectiveAllowedSidebar(user);
    return user;
};

const grantSidebarPath = async (user, keys = []) => {
    if (!user?._id || !keys.length) {
        return user;
    }

    const allowed = toPermissionNodes(user.allowedSidebar || []);

    if (!allowed.length) {
        return user;
    }

    const pathNode = toPathNode(keys);

    if (!pathNode) {
        return user;
    }

    const merged = mergePermissionNodes([...allowed, pathNode]);
    user.allowedSidebar = merged;

    await LoginSuperAdmin.findByIdAndUpdate(user._id, {
        allowedSidebar: merged,
    });

    return user;
};

export {
    grantSidebarPath,
    getEffectiveAllowedSidebar,
    attachEffectiveSidebar,
};
