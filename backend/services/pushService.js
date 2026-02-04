/**
 * Push Notification Service for GreenTrace
 * Handles push notifications via Firebase Cloud Messaging (FCM)
 */

const admin = require("firebase-admin")
const logger = require("../utils/logger")

class PushService {
  constructor() {
    this.initialized = false
  }

  /**
   * Initialize Firebase Admin SDK
   */
  initialize() {
    if (this.initialized) return

    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      logger.warn("Firebase credentials not configured, push notifications disabled")
      return
    }

    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      })

      this.messaging = admin.messaging()
      this.initialized = true
      logger.info("Push notification service initialized")
    } catch (error) {
      logger.error("Failed to initialize Firebase:", error)
    }
  }

  /**
   * Send push notification to single device
   */
  async send({ tokens, title, body, data = {}, imageUrl = null, badge = null }) {
    this.initialize()

    if (!this.messaging) {
      logger.warn("Push service not available, skipping")
      return { skipped: true, reason: "service_unavailable" }
    }

    // Build notification payload
    const notification = {
      title,
      body,
    }

    if (imageUrl) {
      notification.imageUrl = imageUrl
    }

    // Build message
    const message = {
      notification,
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: {
        priority: "high",
        notification: {
          sound: "default",
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
          channelId: "greentrace_notifications",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: badge,
            "content-available": 1,
          },
        },
      },
      webpush: {
        notification: {
          icon: "/icons/notification-icon.png",
          badge: "/icons/badge-icon.png",
        },
        fcmOptions: {
          link: data.actionUrl || process.env.FRONTEND_URL,
        },
      },
    }

    try {
      // Send to multiple tokens
      if (Array.isArray(tokens) && tokens.length > 1) {
        const response = await this.messaging.sendEachForMulticast({
          tokens,
          ...message,
        })

        // Handle failed tokens
        const failedTokens = []
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push({
              token: tokens[idx],
              error: resp.error?.message,
            })
          }
        })

        return {
          success: true,
          successCount: response.successCount,
          failureCount: response.failureCount,
          failedTokens,
        }
      }

      // Send to single token
      const token = Array.isArray(tokens) ? tokens[0] : tokens
      const response = await this.messaging.send({
        token,
        ...message,
      })

      return {
        success: true,
        messageId: response,
      }
    } catch (error) {
      logger.error("Push notification failed:", error)
      throw error
    }
  }

  /**
   * Send to topic
   */
  async sendToTopic({ topic, title, body, data = {} }) {
    this.initialize()

    if (!this.messaging) {
      return { skipped: true, reason: "service_unavailable" }
    }

    const message = {
      topic,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    }

    const response = await this.messaging.send(message)

    return {
      success: true,
      messageId: response,
    }
  }

  /**
   * Subscribe tokens to topic
   */
  async subscribeToTopic(tokens, topic) {
    this.initialize()

    if (!this.messaging) {
      return { skipped: true, reason: "service_unavailable" }
    }

    const tokenArray = Array.isArray(tokens) ? tokens : [tokens]
    const response = await this.messaging.subscribeToTopic(tokenArray, topic)

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    }
  }

  /**
   * Unsubscribe tokens from topic
   */
  async unsubscribeFromTopic(tokens, topic) {
    this.initialize()

    if (!this.messaging) {
      return { skipped: true, reason: "service_unavailable" }
    }

    const tokenArray = Array.isArray(tokens) ? tokens : [tokens]
    const response = await this.messaging.unsubscribeFromTopic(tokenArray, topic)

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    }
  }

  /**
   * Send data-only message (silent notification)
   */
  async sendDataMessage({ tokens, data }) {
    this.initialize()

    if (!this.messaging) {
      return { skipped: true, reason: "service_unavailable" }
    }

    const token = Array.isArray(tokens) ? tokens[0] : tokens

    const response = await this.messaging.send({
      token,
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: {
        priority: "high",
      },
      apns: {
        payload: {
          aps: {
            "content-available": 1,
          },
        },
      },
    })

    return {
      success: true,
      messageId: response,
    }
  }

  // ===========================================
  // SPECIFIC NOTIFICATION METHODS
  // ===========================================

  /**
   * Send order notification
   */
  async sendOrderNotification({ tokens, orderNumber, status, actionUrl }) {
    const titles = {
      confirmed: "Order Confirmed!",
      shipped: "Your Order is on the Way!",
      delivered: "Order Delivered!",
      cancelled: "Order Cancelled",
    }

    const bodies = {
      confirmed: `Order #${orderNumber} has been confirmed`,
      shipped: `Order #${orderNumber} has been shipped`,
      delivered: `Order #${orderNumber} has been delivered`,
      cancelled: `Order #${orderNumber} has been cancelled`,
    }

    return this.send({
      tokens,
      title: titles[status] || "Order Update",
      body: bodies[status] || `Order #${orderNumber} status: ${status}`,
      data: { type: "order", orderNumber, status, actionUrl },
    })
  }

  /**
   * Send price alert notification
   */
  async sendPriceAlertNotification({ tokens, cropName, mandiName, price, condition, actionUrl }) {
    return this.send({
      tokens,
      title: "📈 Price Alert Triggered",
      body: `${cropName} is now ${condition} ₹${price} at ${mandiName}`,
      data: { type: "price_alert", cropName, mandiName, price: String(price), actionUrl },
    })
  }

  /**
   * Send chat message notification
   */
  async sendChatNotification({ tokens, senderName, message, conversationId, actionUrl }) {
    return this.send({
      tokens,
      title: senderName,
      body: message.length > 100 ? message.substring(0, 100) + "..." : message,
      data: { type: "chat", conversationId, actionUrl },
    })
  }
}

module.exports = new PushService()
