import bcrypt from "bcryptjs";
import crypto from "crypto";
import Staff from "../../../models/restaurantModels/staff.js";
import Merchant from "../../../models/superadminModels/bussiness/merchant.js";
import hasRestaurantSidebarButton from "../../../utils/restaurantUtils/hasSidebarButton.js";
import { assertPermissionsWithinOwner } from "../../../utils/restaurantUtils/assertPermissionsWithinOwner.js";
import getPublicStaff from "../../../utils/restaurantUtils/getPublicStaff.js";
import sendOtpEmail from "../../../utils/superadminUtils/sendOtpEmail.js";
import { normalizeCnic, isValidCnic } from "../../../utils/superadminUtils/cnic.js";
import {
    STAFF_INVITE_OTP_EXPIRY_MS,
    STAFF_INVITE_OTP_VALIDITY_TEXT,
} from "../../../constants/tenantConstants/otpExpiry.js";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const createStaffRole = async (req, res) => {
    try {
        const owner = req.owner;

        if (!hasRestaurantSidebarButton(owner, "staffroles", "create-staff")) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to create staff roles",
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

        const requiredFields = {
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

        const normalizedEmail = String(email).toLowerCase().trim();

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email",
            });
        }

        const normalizedCnic = normalizeCnic(cnic);

        if (!isValidCnic(normalizedCnic)) {
            return res.status(400).json({
                success: false,
                message: "CNIC must be a valid 13-digit number",
            });
        }

        if (!Array.isArray(permissions) || permissions.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Select at least one sidebar permission",
            });
        }

        let allowedSidebar;
        try {
            allowedSidebar = assertPermissionsWithinOwner(owner, permissions);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Invalid permissions",
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

        const existingStaffEmail = await Staff.findOne({ email: normalizedEmail });

        if (existingStaffEmail) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered for a staff role",
            });
        }

        const existingCnic = await Staff.findOne({ cnic: normalizedCnic });

        if (existingCnic) {
            return res.status(409).json({
                success: false,
                message: "CNIC is already registered for a staff role",
            });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const hashedOtp = await bcrypt.hash(otp, 10);
        const tempPassword = await bcrypt.hash(
            crypto.randomBytes(16).toString("hex"),
            10
        );

        const staff = await Staff.create({
            merchantId: owner._id,
            bussinessId: owner.bussinessId,
            roleName: String(roleName).trim(),
            firstName: String(firstName).trim(),
            lastName: String(lastName).trim(),
            fatherName: String(fatherName).trim(),
            email: normalizedEmail,
            cnic: normalizedCnic,
            address: String(address).trim(),
            country: String(country).trim(),
            province: String(province).trim(),
            district: String(district).trim(),
            city: String(city).trim(),
            countryCode: String(countryCode).trim(),
            contactNumber: String(contactNumber).trim(),
            gender: String(gender).toLowerCase(),
            dateOfBirth: dateOfBirth || null,
            password: tempPassword,
            allowedSidebar,
            otp: hashedOtp,
            otpExpiresAt: new Date(Date.now() + STAFF_INVITE_OTP_EXPIRY_MS),
            isEmailVerified: false,
            isPasswordSet: false,
            isActive: true,
            createdBy: owner._id,
        });

        await sendOtpEmail({
            to: staff.email,
            otp,
            name: staff.firstName,
            subject: `${owner.name} - Verify Your Staff Account`,
            subtitle: "Staff Role Invitation",
            message: `You have been invited as <strong>${staff.roleName}</strong> for <strong>${owner.name}</strong>. Use this 6-digit OTP to verify your email on the restaurant login page (same as owner). After verification set your password and login with the restaurant domain. This code is valid for <strong>${STAFF_INVITE_OTP_VALIDITY_TEXT}</strong>.`,
        });

        return res.status(201).json({
            success: true,
            message: "Staff role created successfully. OTP sent to email",
            staff: getPublicStaff(staff),
            otpExpiresAt: staff.otpExpiresAt,
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Staff with this email or CNIC already exists",
            });
        }

        console.error("Create staff role error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create staff role",
        });
    }
};

export default createStaffRole;
