/**
 * Notification Service for GreenTrace
 * Handles in-app, push, SMS, and email notifications
 */

const Notification = require("../models/Notification")
const emailService = require("./emailService")
const smsService = require("./smsService")
const pushService = require("./pushService")
const logger = require("../utils/logger")

// ===========================================
// NOTIFICATION TYPES & TEMPLATES
// ===========================================

const NOTIFICATION_TYPES = {
  // Account notifications
  WELCOME: "welcome",
  EMAIL_VERIFIED: "email_verified",
  PASSWORD_CHANGED: "password_changed",
  KYC_STATUS: "kyc_status",

  // Order notifications
  ORDER_PLACED: "order_placed",
  ORDER_CONFIRMED: "order_confirmed",
  ORDER_SHIPPED: "order_shipped",
  ORDER_DELIVERED: "order_delivered",
  ORDER_CANCELLED: "order_cancelled",

  // Advisory notifications
  QUESTION_ANSWERED: "question_answered",
  ANSWER_ACCEPTED: "answer_accepted",
  ANSWER_HELPFUL: "answer_helpful",

  // Product notifications
  NEW_PRODUCT: "new_product",
  PRODUCT_REVIEW: "product_review",
  LOW_STOCK: "low_stock",

  // Price notifications
  PRICE_ALERT: "price_alert",
  PRICE_DROP: "price_drop",

  // Social notifications
  NEW_FOLLOWER: "new_follower",
  NEW_MESSAGE: "new_message",

  // System notifications
  SYSTEM_UPDATE: "system_update",
  PROMOTION: "promotion",
}

const NOTIFICATION_TEMPLATES = {
  [NOTIFICATION_TYPES.WELCOME]: {
    title: "Welcome to GreenTrace!",
    message: "Your account has been created successfully. Start exploring!",
    icon: "user-plus",
    channels: ["in_app", "email"],
  },
  [NOTIFICATION_TYPES.ORDER_PLACED]: {
    title: "Order Placed Successfully",
    message: "Your order #{{orderNumber}} has been placed.",
    icon: "shopping-cart",
    channels: ["in_app", "email", "push"],
  },
  [NOTIFICATION_TYPES.ORDER_SHIPPED]: {
    title: "Order Shipped!",
    message: "Your order #{{orderNumber}} is on its way.",
    icon: "truck",
    channels: ["in_app", "email", "push", "sms"],
  },
  [NOTIFICATION_TYPES.QUESTION_ANSWERED]: {
    title: "Your Question Was Answered",
    message: '{{expertName}} answered your question: "{{questionTitle}}"',
    icon: "message-circle",
    channels: ["in_app", "email", "push"],
  },
  [NOTIFICATION_TYPES.PRICE_ALERT]: {
    title: "Price Alert Triggered",
    message: "{{cropName}} is now {{condition}} ₹{{targetPrice}} at {{mandiName}}",
    icon: "trending-up",
    channels: ["in_app", "email", "push", "sms"],
  },
  [NOTIFICATION_TYPES.NEW_PRODUCT]: {
    title: "New Product Available",
    message: "{{farmerName}} listed a new product: {{productName}}",
    icon: "package",
    channels: ["in_app", "email"],
  },
  [NOTIFICATION_TYPES.PRODUCT_REVIEW]: {
    title: "New Review on Your Product",
    message: "{{reviewerName}} left a {{rating}}-star review on {{productName}}",
    icon: "star",
    channels: ["in_app", "email"],
  },
}

class NotificationService {
  constructor() {
    this.io = null // Socket.io instance for real-time notifications
  }

  /**
   * Initialize with Socket.io instance
   */
  initialize(io) {
    this.io = io
    logger.info("Notification service initialized with Socket.io")
  }

  /**
   * Interpolate template variables
   */
  interpolate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match
    })
  }

  /**
   * Create and send notification
   */
  async send({ userId, type, data = {}, channels = null, priority = "normal", actionUrl = null, metadata = {} }) {
    const template = NOTIFICATION_TEMPLATES[type]

    if (!template) {
      throw new Error(`Unknown notification type: ${type}`)
    }

    // Use template channels or custom channels
    const activeChannels = channels || template.channels

    // Interpolate title and message
    const title = this.interpolate(template.title, data)
    const message = this.interpolate(template.message, data)

    // Create notification record
    const notification = await Notification.create({
      recipient: userId,
      type,
      category: this.getCategory(type),
      title,
      message,
      data,
      actionUrl,
      priority,
      channels: activeChannels.reduce((acc, channel) => {
        acc[channel] = { enabled: true }
        return acc
      }, {}),
      metadata,
    })

    // Send to each channel
    const results = await Promise.allSettled(
      activeChannels.map((channel) => this.sendToChannel(channel, notification, data)),
    )

    // Update delivery status
    for (let i = 0; i < activeChannels.length; i++) {
      const channel = activeChannels[i]
      const result = results[i]

      notification.channels[channel] = {
        enabled: true,
        sentAt: result.status === "fulfilled" ? new Date() : null,
        deliveredAt: null,
        error: result.status === "rejected" ? result.reason.message : null,
      }
    }

    await notification.save()

    return notification
  }

  /**
   * Send notification to specific channel
   */
  async sendToChannel(channel, notification, data) {
    const user = await this.getUser(notification.recipient)

    switch (channel) {
      case "in_app":
        return this.sendInApp(notification, user)

      case "email":
        return this.sendEmail(notification, user, data)

      case "push":
        return this.sendPush(notification, user)

      case "sms":
        return this.sendSMS(notification, user)

      default:
        throw new Error(`Unknown channel: ${channel}`)
    }
  }

  /**
   * Send in-app notification via Socket.io
   */
  async sendInApp(notification, user) {
    if (!this.io) {
      logger.warn("Socket.io not initialized, skipping in-app notification")
      return
    }

    // Emit to user's room
    this.io.to(`user:${user._id}`).emit("notification", {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
      createdAt: notification.createdAt,
    })

    // Update unread count
    const unreadCount = await Notification.countDocuments({
      recipient: user._id,
      read: false,
    })

    this.io.to(`user:${user._id}`).emit("unread_count", unreadCount)

    return { sent: true }
  }

  /**
   * Send email notification
   */
  async sendEmail(notification, user, data) {
    // Check user email preferences
    if (!user.notificationPreferences?.email?.[notification.category]) {
      logger.info(`User ${user._id} has disabled email for ${notification.category}`)
      return { skipped: true, reason: "user_preference" }
    }

    // Map notification type to email template
    const emailTemplateMap = {
      [NOTIFICATION_TYPES.WELCOME]: "signup-confirmation",
      [NOTIFICATION_TYPES.ORDER_PLACED]: "order-confirmation",
      [NOTIFICATION_TYPES.ORDER_SHIPPED]: "order-status-update",
      [NOTIFICATION_TYPES.ORDER_DELIVERED]: "order-status-update",
      [NOTIFICATION_TYPES.QUESTION_ANSWERED]: "question-answered",
      [NOTIFICATION_TYPES.PRICE_ALERT]: "price-alert",
      [NOTIFICATION_TYPES.NEW_PRODUCT]: "new-product",
      [NOTIFICATION_TYPES.PRODUCT_REVIEW]: "product-review",
    }

    const template = emailTemplateMap[notification.type] || "generic-notification"

    return emailService.sendEmail({
      to: user.email,
      subject: notification.title,
      template,
      data: {
        userName: user.fullName,
        ...data,
        notificationTitle: notification.title,
        notificationMessage: notification.message,
        actionUrl: notification.actionUrl,
      },
    })
  }

  /**
   * Send push notification
   */
  async sendPush(notification, user) {
    // Check user push preferences
    if (!user.notificationPreferences?.push?.[notification.category]) {
      return { skipped: true, reason: "user_preference" }
    }

    if (!user.pushTokens || user.pushTokens.length === 0) {
      return { skipped: true, reason: "no_push_token" }
    }

    return pushService.send({
      tokens: user.pushTokens.map((t) => t.token),
      title: notification.title,
      body: notification.message,
      data: {
        notificationId: notification._id.toString(),
        type: notification.type,
        actionUrl: notification.actionUrl,
      },
    })
  }

  /**
   * Send SMS notification
   */
  async sendSMS(notification, user) {
    // Check user SMS preferences
    if (!user.notificationPreferences?.sms?.[notification.category]) {
      return { skipped: true, reason: "user_preference" }
    }

    if (!user.phone) {
      return { skipped: true, reason: "no_phone" }
    }

    return smsService.send({
      to: user.phone,
      message: `${notification.title}: ${notification.message}`,
    })
  }

  /**
   * Get user with notification preferences
   */
  async getUser(userId) {
    const User = require("../models/User")
    return User.findById(userId).select("fullName email phone notificationPreferences pushTokens")
  }

  /**
   * Get notification category from type
   */
  getCategory(type) {
    const categoryMap = {
      [NOTIFICATION_TYPES.WELCOME]: "account",
      [NOTIFICATION_TYPES.EMAIL_VERIFIED]: "account",
      [NOTIFICATION_TYPES.PASSWORD_CHANGED]: "account",
      [NOTIFICATION_TYPES.KYC_STATUS]: "account",
      [NOTIFICATION_TYPES.ORDER_PLACED]: "orders",
      [NOTIFICATION_TYPES.ORDER_CONFIRMED]: "orders",
      [NOTIFICATION_TYPES.ORDER_SHIPPED]: "orders",
      [NOTIFICATION_TYPES.ORDER_DELIVERED]: "orders",
      [NOTIFICATION_TYPES.ORDER_CANCELLED]: "orders",
      [NOTIFICATION_TYPES.QUESTION_ANSWERED]: "advisory",
      [NOTIFICATION_TYPES.ANSWER_ACCEPTED]: "advisory",
      [NOTIFICATION_TYPES.ANSWER_HELPFUL]: "advisory",
      [NOTIFICATION_TYPES.NEW_PRODUCT]: "products",
      [NOTIFICATION_TYPES.PRODUCT_REVIEW]: "products",
      [NOTIFICATION_TYPES.LOW_STOCK]: "products",
      [NOTIFICATION_TYPES.PRICE_ALERT]: "prices",
      [NOTIFICATION_TYPES.PRICE_DROP]: "prices",
      [NOTIFICATION_TYPES.NEW_FOLLOWER]: "social",
      [NOTIFICATION_TYPES.NEW_MESSAGE]: "social",
      [NOTIFICATION_TYPES.SYSTEM_UPDATE]: "system",
      [NOTIFICATION_TYPES.PROMOTION]: "marketing",
    }

    return categoryMap[type] || "general"
  }

  // ===========================================
  // BULK NOTIFICATIONS
  // ===========================================

  /**
   * Send notification to multiple users
   */
  async sendBulk({ userIds, type, data, channels }) {
    const results = await Promise.allSettled(userIds.map((userId) => this.send({ userId, type, data, channels })))

    return {
      sent: results.filter((r) => r.status === "fulfilled").length,
      failed: results.filter((r) => r.status === "rejected").length,
    }
  }

  /**
   * Send notification to all users with specific role
   */
  async sendToRole({ role, type, data, channels }) {
    const User = require("../models/User")
    const users = await User.find({ role, isActive: true }).select("_id")
    const userIds = users.map((u) => u._id)

    return this.sendBulk({ userIds, type, data, channels })
  }

  // ===========================================
  // NOTIFICATION MANAGEMENT
  // ===========================================

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true, readAt: new Date() },
      { new: true },
    )

    // Update unread count via Socket.io
    if (this.io) {
      const unreadCount = await Notification.countDocuments({
        recipient: userId,
        read: false,
      })
      this.io.to(`user:${userId}`).emit("unread_count", unreadCount)
    }

    return notification
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    await Notification.updateMany({ recipient: userId, read: false }, { read: true, readAt: new Date() })

    if (this.io) {
      this.io.to(`user:${userId}`).emit("unread_count", 0)
    }

    return { success: true }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, options = {}) {
    const { page = 1, limit = 20, category = null, unreadOnly = false } = options

    const query = { recipient: userId }

    if (category) query.category = category
    if (unreadOnly) query.read = false

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(query),
    ])

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false,
    })

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    return Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    })
  }

  /**
   * Clear old notifications
   */
  async clearOldNotifications(daysOld = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      read: true,
    })

    return { deleted: result.deletedCount }
  }
}

// Export singleton and types
module.exports = new NotificationService()
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES
