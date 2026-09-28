import Staff from "../../../models/restaurantModels/staff.js";
import Merchant from "../../../models/superadminModels/bussiness/merchant.js";
import findManageableStaff from "../../../utils/restaurantUtils/findManageableStaff.js";
import { assertPermissionsWithinOwner } from "../../../utils/restaurantUtils/assertPermissionsWithinOwner.js";
import getPublicStaff from "../../../utils/restaurantUtils/getPublicStaff.js";
import { normalizeCnic, isValidCnic } from "../../../utils/superadminUtils/cnic.js";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const updateStaffRole = async (req, res) => {
    try {
        const { staff, error } = await findManageableStaff(req, req.params.id);

        if (error) {
            return res.status(error.status).json({
                success: false,
                message: error.message,
            });
        }

        const {
            roleName,
            firstName,
            lastName,
            fatherName,
            email,
            cnic,
            address,
            country,
            province,
            district,
            city,
            countryCode,
            contactNumber,
            gender,
            dateOfBirth,
            permissions,
        } = req.body;

        const update = {};
        let shouldInvalidateSessions = false;

        if (roleName !== undefined) {
            const trimmed = String(roleName).trim();
            if (!trimmed) {
                return res.status(400).json({
                    success: false,
                    message: "Role name is required",
                });
            }
            update.roleName = trimmed;
        }

        if (firstName !== undefined) {
            const trimmed = String(firstName).trim();
            if (!trimmed) {
                return res.status(400).json({
                    success: false,
                    message: "First name is required",
                });
            }
            update.firstName = trimmed;
        }

        if (lastName !== undefined) {
            const trimmed = String(lastName).trim();
            if (!trimmed) {
                return res.status(400).json({
                    success: false,
                    message: "Last name is required",
                });
            }
            update.lastName = trimmed;
        }

        if (fatherName !== undefined) {
            const trimmed = String(fatherName).trim();
            if (!trimmed) {
                return res.status(400).json({
                    success: false,
                    message: "Father name is required",
                });
            }
            update.fatherName = trimmed;
        }

        if (address !== undefined) update.address = String(address).trim();
        if (country !== undefined) update.country = String(country).trim();
        if (province !== undefined) update.province = String(province).trim();
        if (district !== undefined) update.district = String(district).trim();
        if (city !== undefined) update.city = String(city).trim();
        if (countryCode !== undefined) update.countryCode = String(countryCode).trim();
        if (contactNumber !== undefined) {
            update.contactNumber = String(contactNumber).trim();
        }
        if (dateOfBirth !== undefined) update.dateOfBirth = dateOfBirth || null;

        if (gender !== undefined) {
            const normalizedGender = String(gender).toLowerCase().trim();
            if (!["male", "female"].includes(normalizedGender)) {
                return res.status(400).json({
                    success: false,
                    message: "Gender must be male or female",
                });
            }
            update.gender = normalizedGender;
        }

        if (email !== undefined) {
            const normalizedEmail = String(email).toLowerCase().trim();

            if (!isValidEmail(normalizedEmail)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid email",
                });
            }

            const existingOwnerEmail = await Merchant.findOne({
                ownerEmail: normalizedEmail,
            });

            if (existingOwnerEmail) {
                return res.status(409).json({
                    success: false,
                    message: "This email is already registered as a merchant owner",
                });
            }

            const existingStaffEmail = await Staff.findOne({
                email: normalizedEmail,
                _id: { $ne: staff._id },
            });

            if (existingStaffEmail) {
                return res.status(409).json({
                    success: false,
                    message: "Email is already registered for a staff role",
                });
            }

            update.email = normalizedEmail;

            if (normalizedEmail !== staff.email) {
                update.isEmailVerified = false;
                shouldInvalidateSessions = true;
            }
        }

        if (cnic !== undefined) {
            const normalizedCnic = normalizeCnic(cnic);

            if (!isValidCnic(normalizedCnic)) {
                return res.status(400).json({
                    success: false,
                    message: "CNIC must be a valid 13-digit number",
                });
            }

            const existingCnic = await Staff.findOne({
                cnic: normalizedCnic,
                _id: { $ne: staff._id },
            });

            if (existingCnic) {
                return res.status(409).json({
                    success: false,
                    message: "CNIC is already registered for a staff role",
                });
            }

            update.cnic = normalizedCnic;
        }

        if (permissions !== undefined) {
            if (!Array.isArray(permissions) || permissions.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Select at least one sidebar permission",
                });
            }

            try {
                update.allowedSidebar = assertPermissionsWithinOwner(
                    req.owner,
                    permissions
                );
                shouldInvalidateSessions = true;
            } catch (permissionError) {
                return res.status(400).json({
                    success: false,
                    message: permissionError.message || "Invalid permissions",
                });
            }
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No staff role fields provided to update",
            });
        }

        if (shouldInvalidateSessions) {
            update.tokenVersion = (staff.tokenVersion || 0) + 1;
        }

        const updatedStaff = await Staff.findByIdAndUpdate(staff._id, update, {
            new: true,
            runValidators: true,
        }).select("-password -otp");

        return res.status(200).json({
            success: true,
            message: "Staff role updated successfully",
            staff: getPublicStaff(updatedStaff),
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Staff with this email or CNIC already exists",
            });
        }

        console.error("Update staff role error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update staff role",
        });
    }
};

export default updateStaffRole;
