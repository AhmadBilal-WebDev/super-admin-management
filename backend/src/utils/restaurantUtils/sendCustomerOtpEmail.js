import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const getCustomerOtpTemplate = ({
    otp,
    name,
    restaurantName,
    validityText,
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${restaurantName} Login OTP</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6fb;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fb;padding:32px 12px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#0f766e,#14b8a6);padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:0.4px;">${restaurantName}</h1>
              <p style="margin:8px 0 0;color:#ccfbf1;font-size:14px;">Login Verification</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 12px;color:#0f172a;font-size:16px;">Hello ${name},</p>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
                Use this 6-digit OTP to log in to <strong>${restaurantName}</strong>.
                This code is valid for <strong>${validityText}</strong>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:12px 0 24px;">
                    <div style="display:inline-block;background:#f0fdfa;border:1px dashed #0f766e;border-radius:12px;padding:16px 28px;letter-spacing:10px;font-size:32px;font-weight:700;color:#115e59;">
                      ${otp}
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#64748b;font-size:13px;line-height:1.6;">
                If you did not request this login, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:16px 32px;text-align:center;color:#94a3b8;font-size:12px;">
              © ${new Date().getFullYear()} ${restaurantName}. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Sends customer OTP ONLY from branch.otpEmail (noreply).
 * Never uses superadmin EMAIL_USER as From.
 * SMTP still authenticates with EMAIL_USER (server mail account).
 */
const sendCustomerOtpEmail = async ({
    to,
    otp,
    name,
    restaurantName,
    otpEmail,
    validityText = "5 minutes",
}) => {
    const safeRestaurant =
        String(restaurantName || "Restaurant").trim() || "Restaurant";
    const normalizedFrom = String(otpEmail || "")
        .trim()
        .toLowerCase();

    if (!normalizedFrom) {
        throw new Error(
            "Branch otpEmail is required. Customer OTP cannot use superadmin email"
        );
    }

    await transporter.sendMail({
        from: `"${safeRestaurant}" <${normalizedFrom}>`,
        replyTo: normalizedFrom,
        to,
        subject: `${safeRestaurant} - Login OTP`,
        html: getCustomerOtpTemplate({
            otp,
            name: name || "Guest",
            restaurantName: safeRestaurant,
            validityText,
        }),
    });
};

export default sendCustomerOtpEmail;
