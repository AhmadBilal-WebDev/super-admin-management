import fs from "fs";
import cloudinary from "../../utils/cloudinary.js";
import LoginSuperAdmin from "../../models/auth/login.js";
import getPublicUser from "../../utils/getPublicUser.js";
import getCloudinaryPublicId from "../../utils/getCloudinaryPublicId.js";

const updateProfile = async (req, res) => {
    try {
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
            countryCode,
            contactNumber,
            gender,
            dateOfBirth,
            nationalId,
            profilePitcher,
        } = req.body;

        const profilePitcherFile = req.file;

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
                _id: { $ne: req.user._id },
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "Email is already registered",
                });
            }

            update.email = normalizedEmail;
        }

        if (profilePitcherFile) {
            const currentUser = await LoginSuperAdmin.findById(req.user._id);
            const oldPublicId = getCloudinaryPublicId(currentUser.profilePitcher);

            if (oldPublicId) {
                await cloudinary.uploader.destroy(oldPublicId);
            }

            const result = await cloudinary.uploader.upload(profilePitcherFile.path, {
                folder: "superadmin/profile-pitcher",
            });

            fs.unlink(profilePitcherFile.path, () => {});
            update.profilePitcher = result.secure_url;
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No profile fields provided to update",
            });
        }

        const user = await LoginSuperAdmin.findByIdAndUpdate(
            req.user._id,
            update,
            { new: true, runValidators: true }
        ).select("-password -otp");

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: getPublicUser(user),
        });
    } catch (error) {
        if (req.file?.path) {
            fs.unlink(req.file.path, () => {});
        }

        console.error("Update profile error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

export default updateProfile;
