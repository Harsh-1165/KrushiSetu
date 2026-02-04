/**
 * Email Utility
 * Handles sending transactional emails
 */

const nodemailer = require("nodemailer")

// ============================================
// EMAIL TRANSPORTER
// ============================================

let transporter

/**
 * Initialize email transporter
 */
const initializeTransporter = () => {
  // Allow fully disabling email in development/testing
  if (process.env.USE_MOCK_EMAIL === "true") {
    transporter = null
    return
  }

  // Prefer real SMTP if provided (works in dev too)
  const hasRealSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

  if (process.env.NODE_ENV === "production" || hasRealSmtp) {
    // Use actual SMTP service
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: String(process.env.SMTP_PASS || "").replace(/\s+/g, ""),
      },
    })
  } else {
    // Development: Use Ethereal (fake SMTP)
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER || "ethereal.user@ethereal.email",
        pass: process.env.ETHEREAL_PASS || "ethereal_password",
      },
    })
  }
}

// Initialize on first import
initializeTransporter()

// ============================================
// EMAIL TEMPLATES
// ============================================

const templates = {
  emailVerification: (data) => ({
    subject: "GreenTrace - Verify Your Email",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2E7D32; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 30px; background: #2E7D32; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>GreenTrace</h1>
          </div>
          <div class="content">
            <h2>Welcome, ${data.name}!</h2>
            <p>Thank you for registering with GreenTrace. Please verify your email address to complete your registration.</p>
            <a href="${data.verificationUrl}" class="button">Verify Email</a>
            <p>This link will expire in ${data.expiresIn}.</p>
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 GreenTrace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to GreenTrace, ${data.name}!
      
      Please verify your email by clicking this link: ${data.verificationUrl}
      
      This link will expire in ${data.expiresIn}.
      
      If you didn't create an account, please ignore this email.
    `,
  }),

  passwordReset: (data) => ({
    subject: "GreenTrace - Password Reset Request",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2E7D32; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 30px; background: #D32F2F; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .warning { background: #FFF3E0; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>GreenTrace</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hi ${data.name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${data.resetUrl}" class="button">Reset Password</a>
            <p>This link will expire in ${data.expiresIn}.</p>
            <div class="warning">
              <strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email or contact support if you have concerns.
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2025 GreenTrace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Password Reset Request
      
      Hi ${data.name},
      
      We received a request to reset your password. Click this link to create a new password: ${data.resetUrl}
      
      This link will expire in ${data.expiresIn}.
      
      If you didn't request this, please ignore this email.
    `,
  }),

  passwordChanged: (data) => ({
    subject: "GreenTrace - Password Changed Successfully",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2E7D32; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .alert { background: #E8F5E9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2E7D32; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>GreenTrace</h1>
          </div>
          <div class="content">
            <h2>Password Changed</h2>
            <p>Hi ${data.name},</p>
            <div class="alert">
              <p>Your password was successfully changed on ${new Date(data.timestamp).toLocaleString()}.</p>
            </div>
            <p>If you did not make this change, please contact our support team immediately and secure your account.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 GreenTrace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Password Changed Successfully
      
      Hi ${data.name},
      
      Your password was successfully changed on ${new Date(data.timestamp).toLocaleString()}.
      
      If you did not make this change, please contact support immediately.
    `,
  }),
}

// ============================================
// SEND EMAIL FUNCTION
// ============================================

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject (optional if using template)
 * @param {string} options.template - Template name
 * @param {Object} options.data - Template data
 * @param {string} options.html - Custom HTML (if not using template)
 * @param {string} options.text - Custom text (if not using template)
 */
const sendEmail = async (options) => {
  const { to, template, data, subject, html, text } = options

  if (process.env.USE_MOCK_EMAIL === "true") {
    // No-op mode (useful for local dev)
    return { mock: true, to, template, subject }
  }

  let emailContent

  if (template && templates[template]) {
    emailContent = templates[template](data)
  } else {
    emailContent = { subject, html, text }
  }

  const mailOptions = {
    from: `"GreenTrace" <${process.env.SMTP_FROM || "noreply@greentrace.com"}>`,
    to,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  }

  try {
    if (!transporter) {
      throw new Error("Email transporter not initialized (USE_MOCK_EMAIL=true)")
    }
    const info = await transporter.sendMail(mailOptions)

    // Log preview URL in development (Ethereal)
    if (process.env.NODE_ENV !== "production") {
      console.log("Email Preview URL:", nodemailer.getTestMessageUrl(info))
    }

    return info
  } catch (error) {
    console.error("Email sending failed:", error)
    throw new Error("Failed to send email")
  }
}

module.exports = {
  sendEmail,
  initializeTransporter,
}
