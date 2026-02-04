/**
 * SMS Service for GreenTrace
 * Handles SMS notifications via Twilio
 */

const twilio = require("twilio")
const logger = require("../utils/logger")

class SMSService {
  constructor() {
    this.client = null
    this.initialized = false
  }

  /**
   * Initialize Twilio client
   */
  initialize() {
    if (this.initialized) return

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      logger.warn("Twilio credentials not configured, SMS disabled")
      return
    }

    this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

    this.fromNumber = process.env.TWILIO_PHONE_NUMBER
    this.initialized = true
    logger.info("SMS service initialized")
  }

  /**
   * Format phone number to E.164 format
   */
  formatPhoneNumber(phone) {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, "")

    // Handle Indian numbers
    if (cleaned.length === 10) {
      cleaned = "91" + cleaned
    }

    // Add + prefix
    if (!cleaned.startsWith("+")) {
      cleaned = "+" + cleaned
    }

    return cleaned
  }

  /**
   * Send SMS
   */
  async send({ to, message, mediaUrl = null }) {
    this.initialize()

    if (!this.client) {
      logger.warn("SMS service not available, skipping")
      return { skipped: true, reason: "service_unavailable" }
    }

    try {
      const formattedNumber = this.formatPhoneNumber(to)

      const messageOptions = {
        body: message,
        from: this.fromNumber,
        to: formattedNumber,
      }

      // Add media URL for MMS if provided
      if (mediaUrl) {
        messageOptions.mediaUrl = [mediaUrl]
      }

      const result = await this.client.messages.create(messageOptions)

      logger.info(`SMS sent: ${result.sid}`)

      return {
        success: true,
        messageId: result.sid,
        status: result.status,
      }
    } catch (error) {
      logger.error("SMS send failed:", error)
      throw error
    }
  }

  /**
   * Send bulk SMS
   */
  async sendBulk(messages) {
    const results = await Promise.allSettled(messages.map(({ to, message }) => this.send({ to, message })))

    return {
      sent: results.filter((r) => r.status === "fulfilled").length,
      failed: results.filter((r) => r.status === "rejected").length,
      results,
    }
  }

  /**
   * Send OTP via SMS
   */
  async sendOTP({ to, otp, expiresIn = "10 minutes" }) {
    const message = `Your GreenTrace verification code is: ${otp}. Valid for ${expiresIn}. Do not share this code with anyone.`

    return this.send({ to, message })
  }

  /**
   * Send order update SMS
   */
  async sendOrderUpdate({ to, orderNumber, status, trackingUrl = null }) {
    const statusMessages = {
      confirmed: `Your GreenTrace order #${orderNumber} is confirmed!`,
      shipped: `Your order #${orderNumber} has been shipped.${trackingUrl ? ` Track: ${trackingUrl}` : ""}`,
      out_for_delivery: `Your order #${orderNumber} is out for delivery today!`,
      delivered: `Your order #${orderNumber} has been delivered. Thank you!`,
    }

    const message = statusMessages[status] || `Order #${orderNumber} status: ${status}`

    return this.send({ to, message })
  }

  /**
   * Send price alert SMS
   */
  async sendPriceAlert({ to, cropName, mandiName, price, condition }) {
    const message = `GreenTrace Alert: ${cropName} is now ${condition} ₹${price}/quintal at ${mandiName}. Check app for details.`

    return this.send({ to, message })
  }

  /**
   * Get message status
   */
  async getMessageStatus(messageId) {
    this.initialize()

    if (!this.client) {
      return { error: "Service unavailable" }
    }

    const message = await this.client.messages(messageId).fetch()

    return {
      status: message.status,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
    }
  }

  /**
   * Verify Twilio webhook signature
   */
  validateWebhook(signature, url, params) {
    return twilio.validateRequest(process.env.TWILIO_AUTH_TOKEN, signature, url, params)
  }
}

module.exports = new SMSService()
