import Merchant from "../../models/bussiness/merchant.js";
import formatMerchant from "../../utils/formatMerchant.js";
import findBussiness from "../../utils/findBussiness.js";
import hasSidebarButton from "../../utils/hasSidebarButton.js";
import toBussinessSlug from "../../utils/toBussinessSlug.js";
import { normalizeCnic, isValidCnic } from "../../utils/cnic.js";
import { getSidebarForUser } from "../../constants/sidebarCatalog.js";
import { grantSidebarPath } from "../../utils/grantSidebarPath.js";
import bcrypt from "bcryptjs";
import sendOtpEmail from "../../utils/sendOtpEmail.js";
import {
    MERCHANT_OTP_EXPIRY_MS,
    MERCHANT_OTP_VALIDITY_TEXT,
} from "../../constants/otpExpiry.js";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidUrl = (url) => {
    try {
        const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
        return Boolean(parsed.hostname);
    } catch {
        return false;
    }
};

const normalizeDomainUrl = (url) => {
    const trimmed = String(url).trim();
    return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
};

const addMerchant = async (req, res) => {
    try {
        if (!hasSidebarButton(req.user, "merchantdirectory", "createbussiness")) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to add a merchant",
            });
        }

        const parentBussiness = await findBussiness(req.params.bussinessId);

        if (!parentBussiness) {
            return res.status(404).json({
                success: false,
                message: "Business category not found",
            });
        }

        if (parentBussiness.isActive === false) {
            return res.status(400).json({
                success: false,
                message: "This business category is inactive",
            });
        }

        const {
            name,
            description,
            ownerFirstName,
            ownerLastName,
            ownerEmail,
            ownerCnic,
            frontendDomainUrl,
            gender,
            dateOfBirth,
            countryCode,
            contactNumber,
            secondaryContactNumber,
            headAddress,
            country,
            province,
            city,
            district,
            postalCode,
            businessType,
        } = req.body;

        const requiredFields = {
            name,
            ownerFirstName,
            ownerLastName,
            ownerEmail,
            ownerCnic,
            frontendDomainUrl,
            gender,
            countryCode,
            contactNumber,
            headAddress,
            country,
            province,
            city,
            district,
            businessType,
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

        const trimmedName = String(name).trim();
        const normalizedEmail = String(ownerEmail).toLowerCase().trim();
        const normalizedCnic = normalizeCnic(ownerCnic);
        const normalizedGender = String(gender).toLowerCase().trim();
        const normalizedDomainUrl = normalizeDomainUrl(frontendDomainUrl);

        if (!["male", "female"].includes(normalizedGender)) {
            return res.status(400).json({
                success: false,
                message: "Gender must be male or female",
            });
        }

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Invalid owner email",
            });
        }

        if (!isValidCnic(normalizedCnic)) {
            return res.status(400).json({
                success: false,
                message: "Owner CNIC must be a valid 13-digit number",
            });
        }

        if (!isValidUrl(normalizedDomainUrl)) {
            return res.status(400).json({
                success: false,
                message: "Invalid frontend domain URL",
            });
        }

        const nameKey = trimmedName.toLowerCase();
        const slug = toBussinessSlug(trimmedName);

        if (!slug) {
            return res.status(400).json({
                success: false,
                message: "Merchant name must contain letters or numbers",
            });
        }

        const existingInCategory = await Merchant.findOne({
            bussinessId: parentBussiness._id,
            $or: [{ nameKey }, { slug }],
        });

        if (existingInCategory) {
            return res.status(409).json({
                success: false,
                message: "Merchant name already exists in this business category",
            });
        }

        const existingEmail = await Merchant.findOne({ ownerEmail: normalizedEmail });
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: "Owner email is already registered for another merchant",
            });
        }

        const existingCnic = await Merchant.findOne({ ownerCnic: normalizedCnic });
        if (existingCnic) {
            return res.status(409).json({
                success: false,
                message: "Owner CNIC is already registered for another merchant",
            });
        }

        const existingDomain = await Merchant.findOne({
            frontendDomainUrl: normalizedDomainUrl,
        });
        if (existingDomain) {
            return res.status(409).json({
                success: false,
                message: "Frontend domain URL is already in use",
            });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const hashedOtp = await bcrypt.hash(otp, 10);
        const otpExpiresAt = new Date(Date.now() + MERCHANT_OTP_EXPIRY_MS);

        const merchant = await Merchant.create({
            bussinessId: parentBussiness._id,
            name: trimmedName,
            nameKey,
            slug,
            description: description ? String(description).trim() : "",
            ownerFirstName: String(ownerFirstName).trim(),
            ownerLastName: String(ownerLastName).trim(),
            ownerEmail: normalizedEmail,
            ownerCnic: normalizedCnic,
            profilePitcher: "",
            frontendDomainUrl: normalizedDomainUrl,
            gender: normalizedGender,
            dateOfBirth: dateOfBirth || null,
            countryCode: String(countryCode).trim(),
            contactNumber: String(contactNumber).trim(),
            secondaryContactNumber: secondaryContactNumber
                ? String(secondaryContactNumber).trim()
                : "",
            headAddress: String(headAddress).trim(),
            country: String(country).trim(),
            province: String(province).trim(),
            city: String(city).trim(),
            district: String(district).trim(),
            postalCode: postalCode ? String(postalCode).trim() : "",
            businessType: String(businessType).trim(),
            isActive: true,
            otp: hashedOtp,
            otpExpiresAt,
            isOwnerEmailVerified: false,
            createdBy: req.user._id,
        });

        await grantSidebarPath(req.user, [
            "viewbussiness",
            parentBussiness._id,
            merchant._id,
        ]);

        await sendOtpEmail({
            to: merchant.ownerEmail,
            otp,
            name: merchant.ownerFirstName,
            subject: "Super Admin Management - Merchant Owner Verification OTP",
            subtitle: "Merchant Account Verification",
            message: `Your merchant <strong>${merchant.name}</strong> has been created under <strong>${parentBussiness.name}</strong>. Use this 6-digit OTP to verify your owner email. This code is valid for <strong>${MERCHANT_OTP_VALIDITY_TEXT}</strong>.`,
        });

        return res.status(201).json({
            success: true,
            message: "Merchant added successfully. OTP sent to owner email",
            bussiness: {
                id: parentBussiness._id,
                name: parentBussiness.name,
                slug: parentBussiness.slug || "",
            },
            merchant: formatMerchant(merchant),
            otpExpiresAt,
            sidebar: await getSidebarForUser(req.user),
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Merchant with this name, email, CNIC, or domain already exists",
            });
        }

        console.error("Add merchant error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to add merchant",
        });
    }
};

export default addMerchant;
