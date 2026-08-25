import LoginSuperAdmin from "../../models/auth/login.js";
import { normalizePermissions } from "../../constants/sidebarCatalog.js";
import getPublicUser from "../../utils/getPublicUser.js";

const updateRole = async (req, res) => {
    try {
        const { id } = req.params;

        const roleUser = await LoginSuperAdmin.findById(id);

        if (!roleUser) {
            return res.status(404).json({
                success: false,
                message: "Role not found",
            });
        }

        if (roleUser.accountType !== "role") {
            return res.status(400).json({
                success: false,
                message: "This account is not a role. Only created roles can be updated",
            });
        }

        const isOwner = req.user.accountType !== "role";
        const isCreator = String(roleUser.createdBy) === String(req.user._id);

        if (!isOwner && !isCreator) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to update this role",
            });
        }

        const {
            firstName,
            lastName,
            email,
            bio,
            designation,
            country,
            province,
            city,
            district,
            address,
            contactNumber,
            gender,
            countryCode,
            dateOfBirth,
            nationalId,
            isActive,
            permissions,
        } = req.body;

        const update = {};

        if (firstName !== undefined) update.firstName = String(firstName).trim();
        if (lastName !== undefined) update.lastName = String(lastName).trim();
        if (bio !== undefined) update.bio = String(bio).trim();
        if (designation !== undefined) update.designation = String(designation).trim();
        if (country !== undefined) update.country = String(country).trim();
        if (province !== undefined) update.province = String(province).trim();
        if (city !== undefined) update.city = String(city).trim();
        if (district !== undefined) update.district = String(district).trim();
        if (address !== undefined) update.address = String(address).trim();
        if (countryCode !== undefined) update.countryCode = String(countryCode).trim();
        if (contactNumber !== undefined) update.contactNumber = String(contactNumber).trim();
        if (nationalId !== undefined) update.nationalId = String(nationalId).trim();
        if (dateOfBirth !== undefined) update.dateOfBirth = dateOfBirth || null;
        if (isActive !== undefined) update.isActive = Boolean(isActive);

        if (gender !== undefined) {
            const normalizedGender = String(gender).toLowerCase().trim();
            if (normalizedGender && !["male", "female"].includes(normalizedGender)) {
                return res.status(400).json({
                    success: false,
                    message: "Gender must be male or female",
                });
            }
            update.gender = normalizedGender;
        }

        if (email !== undefined) {
            const normalizedEmail = String(email).toLowerCase().trim();
            const existingUser = await LoginSuperAdmin.findOne({
                email: normalizedEmail,
                _id: { $ne: roleUser._id },
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "Email is already registered",
                });
            }

            update.email = normalizedEmail;
        }

        if (permissions !== undefined) {
            if (!Array.isArray(permissions) || permissions.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Select at least one sidebar permission",
                });
            }

            update.allowedSidebar = normalizePermissions(permissions);
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No role fields provided to update",
            });
        }

        const updatedRole = await LoginSuperAdmin.findByIdAndUpdate(
            roleUser._id,
            update,
            { new: true, runValidators: true }
        ).select("-password -otp");

        return res.status(200).json({
            success: true,
            message: "Role updated successfully",
            user: getPublicUser(updatedRole),
        });
    } catch (error) {
        console.error("Update role error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to update role",
        });
    }
};

export default updateRole;
