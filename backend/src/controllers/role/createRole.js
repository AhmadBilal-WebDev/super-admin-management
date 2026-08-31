import bcrypt from "bcryptjs";
import crypto from "crypto";
import LoginSuperAdmin from "../../models/auth/login.js";
import { normalizePermissions } from "../../constants/sidebarCatalog.js";
import sendOtpEmail from "../../utils/sendOtpEmail.js";
import getPublicUser from "../../utils/getPublicUser.js";
import {
    INVITE_OTP_EXPIRY_MS,
    INVITE_OTP_VALIDITY_TEXT,
} from "../../constants/otpExpiry.js";

const createRole = async (req, res) => {
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
            contactNumber,
            gender,
            countryCode,
            dateOfBirth,
            nationalId,
            permissions,
        } = req.body;

        const requiredFields = {
            firstName,
            lastName,
            email,
            bio,
            country,
            province,
            city,
            district,
            contactNumber,
            gender,
            countryCode,
        };

        const missingField = Object.entries(requiredFields).find(
            ([, value]) => !value || !String(value).trim()
        );

        if (missingField) {
            return res.status(400).json({
                success: false,
                message: `${missingField[0]} is required`,
            });
        }

        if (!["male", "female"].includes(String(gender).toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: "Gender must be male or female",
            });
        }

        if (!Array.isArray(permissions) || permissions.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Select at least one sidebar permission",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedPermissions = normalizePermissions(permissions);

        const existingUser = await LoginSuperAdmin.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered",
            });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const hashedOtp = await bcrypt.hash(otp, 10);
        const tempPassword = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10);

        const newAdmin = await LoginSuperAdmin.create({
            firstName: String(firstName).trim(),
            lastName: String(lastName).trim(),
            email: normalizedEmail,
            password: tempPassword,
            bio: String(bio).trim(),
            designation: designation ? String(designation).trim() : "",
            country: String(country).trim(),
            province: String(province).trim(),
            city: String(city).trim(),
            district: String(district).trim(),
            address: address ? String(address).trim() : "",
            countryCode: String(countryCode).trim(),
            contactNumber: String(contactNumber).trim(),
            gender: String(gender).toLowerCase(),
            dateOfBirth: dateOfBirth || null,
            nationalId: nationalId ? String(nationalId).trim() : "",
            accountType: "role",
            createdBy: req.user._id,
            allowedSidebar: normalizedPermissions,
            isActive: true,
            isEmailVerified: false,
            isPasswordSet: false,
            otp: hashedOtp,
            otpExpiresAt: new Date(Date.now() + INVITE_OTP_EXPIRY_MS),
        });

        await sendOtpEmail({
            to: newAdmin.email,
            otp,
            name: newAdmin.firstName,
            subject: "Super Admin Management - Verify Your Email",
            subtitle: "Temporary Access Verification",
            message: `You have been invited with a new role. Use this 6-digit OTP to verify your email in the app. After verification set your new password and login. This code is valid for <strong>${INVITE_OTP_VALIDITY_TEXT}</strong>.`,
        });

        return res.status(201).json({
            success: true,
            message: "Role created successfully. Temporary OTP sent to email",
            user: getPublicUser(newAdmin),
        });
    } catch (error) {
        console.error("Create role error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to create role",
        });
    }
};

export default createRole;
