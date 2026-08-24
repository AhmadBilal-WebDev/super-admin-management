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

const getOtpEmailTemplate = ({
    otp,
    name = "Super Admin",
    subtitle = "Password Reset Verification",
    message = "Use the 6-digit OTP below to reset your Super Admin password. This code is valid for <strong>5 minutes</strong>.",
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Super Admin Management</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6fb;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fb;padding:32px 12px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:0.4px;">Super Admin Management</h1>
              <p style="margin:8px 0 0;color:#dbeafe;font-size:14px;">${subtitle}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 12px;color:#0f172a;font-size:16px;">Hello ${name},</p>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
                ${message}
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:12px 0 24px;">
                    <div style="display:inline-block;background:#eff6ff;border:1px dashed #2563eb;border-radius:12px;padding:16px 28px;letter-spacing:10px;font-size:32px;font-weight:700;color:#1e3a8a;">
                      ${otp}
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#64748b;font-size:13px;line-height:1.6;">
                If you did not expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:16px 32px;text-align:center;color:#94a3b8;font-size:12px;">
              © ${new Date().getFullYear()} Super Admin Management. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const sendOtpEmail = async ({
    to,
    otp,
    name,
    subject = "Super Admin Management - Password Reset OTP",
    subtitle,
    message,
}) => {
    await transporter.sendMail({
        from: `"Super Admin Management" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: getOtpEmailTemplate({ otp, name, subtitle, message }),
    });
};

export default sendOtpEmail;
