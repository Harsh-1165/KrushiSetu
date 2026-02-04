/**
 * Email Service for GreenTrace Agricultural Marketplace
 * Handles all email sending with queue system, retry logic, and templates
 */

const nodemailer = require("nodemailer")
const handlebars = require("handlebars")
const path = require("path")
const fs = require("fs").promises
const Queue = require("bull")
const logger = require("../utils/logger")

// ===========================================
// EMAIL CONFIGURATION
// ===========================================

const emailConfig = {
  // Provider options: 'gmail', 'sendgrid', 'ses', 'smtp'
  provider: process.env.EMAIL_PROVIDER || "smtp",

  // Gmail configuration
  gmail: {
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
    },
  },

  // SendGrid configuration
  sendgrid: {
    host: "smtp.sendgrid.net",
    port: 587,
    auth: {
      user: "apikey",
      pass: process.env.SENDGRID_API_KEY,
    },
  },

  // AWS SES configuration
  ses: {
    host: process.env.AWS_SES_SMTP_HOST || "email-smtp.us-east-1.amazonaws.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.AWS_SES_SMTP_USER,
      pass: process.env.AWS_SES_SMTP_PASSWORD,
    },
  },

  // Generic SMTP configuration
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number.parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  },
}

// ===========================================
// TRANSPORTER SETUP
// ===========================================

class EmailService {
  constructor() {
    this.transporter = null
    this.templateCache = new Map()
    this.queue = null
    this.initialized = false
  }

  /**
   * Initialize email service with transporter and queue
   */
  async initialize() {
    if (this.initialized) return

    // Create transporter based on provider
    const config = emailConfig[emailConfig.provider]

    this.transporter = nodemailer.createTransport({
      ...config,
      pool: true, // Use pooled connections
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 10, // 10 messages per second
    })

    // Verify connection
    try {
      await this.transporter.verify()
      logger.info("Email service connected successfully")
    } catch (error) {
      logger.error("Email service connection failed:", error)
      throw error
    }

    // Initialize email queue with Redis - ONLY if explicitly configured
    // FORCE DISABLED FOR STABILITY DEBUGGING
    if (false && process.env.REDIS_URL && process.env.REDIS_URL.startsWith("redis://")) {
      logger.info(`Initializing email queue with Redis at ${process.env.REDIS_URL.split("@")[1] || "..."}`)
      try {
        this.queue = new Queue("email-queue", process.env.REDIS_URL, {
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 5000, // Start with 5 seconds
            },
            removeOnComplete: 100, // Keep last 100 completed jobs
            removeOnFail: 50, // Keep last 50 failed jobs
          },
          // Prevent ioredis from crashing the app on connection failure
          redis: {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
              if (times > 3) {
                logger.error("Redis connection failed too many times. Disabling queue.")
                return null // Stop retrying
              }
              return Math.min(times * 50, 2000)
            }
          }
        })

        // Process queue
        this.queue.process(5, async (job) => {
          return this.processEmailJob(job)
        })

        // Queue event handlers
        this.queue.on("completed", (job) => {
          logger.info(`Email sent successfully: ${job.id}`)
        })

        this.queue.on("failed", (job, err) => {
          logger.error(`Email failed: ${job.id}`, err)
        })

        this.queue.on("error", (err) => {
          logger.error("Queue error:", err)
        })

        logger.info("Email queue initialized")
      } catch (err) {
        logger.error("Failed to initialize email queue:", err)
        this.queue = null
      }
    } else {
      logger.info("Redis not configured. Email queue disabled (Direct sending mode).")
    }

    // Register Handlebars helpers
    this.registerHelpers()

    this.initialized = true
  }

  /**
   * Register Handlebars template helpers
   */
  registerHelpers() {
    handlebars.registerHelper("formatDate", (date) => {
      return new Date(date).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    })

    handlebars.registerHelper("formatCurrency", (amount) => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount)
    })

    handlebars.registerHelper("ifEquals", function (arg1, arg2, options) {
      return arg1 === arg2 ? options.fn(this) : options.inverse(this)
    })

    handlebars.registerHelper("statusColor", (status) => {
      const colors = {
        pending: "#f59e0b",
        confirmed: "#3b82f6",
        processing: "#8b5cf6",
        shipped: "#06b6d4",
        delivered: "#10b981",
        cancelled: "#ef4444",
      }
      return colors[status] || "#6b7280"
    })
  }

  /**
   * Load and compile email template
   */
  async getTemplate(templateName) {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)
    }

    const templatePath = path.join(__dirname, "../templates/emails", `${templateName}.hbs`)
    const templateContent = await fs.readFile(templatePath, "utf-8")
    const compiled = handlebars.compile(templateContent)

    this.templateCache.set(templateName, compiled)
    return compiled
  }

  /**
   * Process email job from queue
   */
  async processEmailJob(job) {
    const { to, subject, template, data, attachments } = job.data

    const compiledTemplate = await this.getTemplate(template)
    const html = compiledTemplate(data)

    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || "GreenTrace",
        address: process.env.EMAIL_FROM_ADDRESS || "noreply@greentrace.com",
      },
      to,
      subject,
      html,
      attachments,
    }

    const result = await this.transporter.sendMail(mailOptions)
    return result
  }

  /**
   * Send email (queued or direct)
   */
  async sendEmail({ to, subject, template, data, attachments, priority = "normal", delay = 0 }) {
    await this.initialize()

    const emailData = { to, subject, template, data, attachments }

    // Use queue if available
    if (this.queue) {
      const jobOptions = {
        priority: priority === "high" ? 1 : priority === "low" ? 3 : 2,
        delay,
      }

      const job = await this.queue.add(emailData, jobOptions)
      return { queued: true, jobId: job.id }
    }

    // Direct send if no queue
    return this.processEmailJob({ data: emailData })
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(emails) {
    await this.initialize()

    const jobs = emails.map((email) => ({
      data: email,
      opts: { priority: 2 },
    }))

    if (this.queue) {
      await this.queue.addBulk(jobs)
      return { queued: true, count: emails.length }
    }

    // Direct send without queue
    const results = await Promise.allSettled(emails.map((email) => this.processEmailJob({ data: email })))

    return {
      sent: results.filter((r) => r.status === "fulfilled").length,
      failed: results.filter((r) => r.status === "rejected").length,
    }
  }

  /**
   * Schedule email for later
   */
  async scheduleEmail({ to, subject, template, data, sendAt }) {
    const delay = new Date(sendAt).getTime() - Date.now()

    if (delay < 0) {
      throw new Error("Scheduled time must be in the future")
    }

    return this.sendEmail({ to, subject, template, data, delay })
  }

  // ===========================================
  // SPECIFIC EMAIL METHODS
  // ===========================================

  /**
   * Send signup confirmation email
   */
  async sendSignupConfirmation(user) {
    return this.sendEmail({
      to: user.email,
      subject: "Welcome to GreenTrace - Account Created Successfully!",
      template: "signup-confirmation",
      data: {
        userName: user.fullName,
        userRole: user.role,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
        supportEmail: process.env.SUPPORT_EMAIL,
        year: new Date().getFullYear(),
      },
      priority: "high",
    })
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(user, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`

    return this.sendEmail({
      to: user.email,
      subject: "Verify Your Email - GreenTrace",
      template: "email-verification",
      data: {
        userName: user.fullName,
        verificationUrl,
        expiresIn: "24 hours",
        supportEmail: process.env.SUPPORT_EMAIL,
        year: new Date().getFullYear(),
      },
      priority: "high",
    })
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`

    return this.sendEmail({
      to: user.email,
      subject: "Reset Your Password - GreenTrace",
      template: "password-reset",
      data: {
        userName: user.fullName,
        resetUrl,
        expiresIn: "1 hour",
        ipAddress: user.lastLoginIP || "Unknown",
        supportEmail: process.env.SUPPORT_EMAIL,
        year: new Date().getFullYear(),
      },
      priority: "high",
    })
  }

  /**
   * Send order confirmation
   */
  async sendOrderConfirmation(order, user) {
    return this.sendEmail({
      to: user.email,
      subject: `Order Confirmed - #${order.orderNumber}`,
      template: "order-confirmation",
      data: {
        userName: user.fullName,
        orderNumber: order.orderNumber,
        orderDate: order.createdAt,
        items: order.items,
        subtotal: order.pricing.subtotal,
        shipping: order.pricing.shipping,
        tax: order.pricing.tax,
        total: order.pricing.total,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.payment.method,
        estimatedDelivery: order.estimatedDelivery,
        trackingUrl: `${process.env.FRONTEND_URL}/orders/${order._id}`,
        supportEmail: process.env.SUPPORT_EMAIL,
        year: new Date().getFullYear(),
      },
    })
  }

  /**
   * Send order status update
   */
  async sendOrderStatusUpdate(order, user, previousStatus) {
    const statusMessages = {
      confirmed: "Your order has been confirmed and is being processed.",
      processing: "Your order is being prepared for shipment.",
      shipped: "Great news! Your order has been shipped.",
      out_for_delivery: "Your order is out for delivery today!",
      delivered: "Your order has been delivered successfully.",
      cancelled: "Your order has been cancelled.",
    }

    return this.sendEmail({
      to: user.email,
      subject: `Order Update - #${order.orderNumber} is now ${order.status}`,
      template: "order-status-update",
      data: {
        userName: user.fullName,
        orderNumber: order.orderNumber,
        previousStatus,
        currentStatus: order.status,
        statusMessage: statusMessages[order.status],
        trackingNumber: order.delivery?.trackingNumber,
        trackingUrl: order.delivery?.trackingUrl,
        orderUrl: `${process.env.FRONTEND_URL}/orders/${order._id}`,
        items: order.items.slice(0, 3), // Show first 3 items
        itemCount: order.items.length,
        supportEmail: process.env.SUPPORT_EMAIL,
        year: new Date().getFullYear(),
      },
    })
  }

  /**
   * Send question answered notification
   */
  async sendQuestionAnswered(question, answer, user, expert) {
    return this.sendEmail({
      to: user.email,
      subject: `Your Question Has Been Answered - GreenTrace Advisory`,
      template: "question-answered",
      data: {
        userName: user.fullName,
        questionTitle: question.title,
        questionExcerpt: question.description.substring(0, 150) + "...",
        expertName: expert.fullName,
        expertSpecialization: expert.expertProfile?.specializations?.join(", "),
        expertRating: expert.rating?.average?.toFixed(1),
        answerExcerpt: answer.content.substring(0, 300) + "...",
        questionUrl: `${process.env.FRONTEND_URL}/advisory/questions/${question._id}`,
        supportEmail: process.env.SUPPORT_EMAIL,
        year: new Date().getFullYear(),
      },
    })
  }

  /**
   * Send product review notification to seller
   */
  async sendProductReviewNotification(review, product, reviewer, seller) {
    return this.sendEmail({
      to: seller.email,
      subject: `New Review on Your Product - ${product.name}`,
      template: "product-review",
      data: {
        sellerName: seller.fullName,
        productName: product.name,
        productImage: product.images?.[0]?.url,
        reviewerName: reviewer.fullName,
        rating: review.rating,
        reviewTitle: review.title,
        reviewContent: review.comment,
        productUrl: `${process.env.FRONTEND_URL}/products/${product._id}`,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/reviews`,
        supportEmail: process.env.SUPPORT_EMAIL,
        year: new Date().getFullYear(),
      },
    })
  }

  /**
   * Send price alert notification
   */
  async sendPriceAlert(alert, priceData, user) {
    return this.sendEmail({
      to: user.email,
      subject: `Price Alert: ${priceData.cropName} - ${alert.condition} ₹${alert.targetPrice}`,
      template: "price-alert",
      data: {
        userName: user.fullName,
        cropName: priceData.cropName,
        mandiName: priceData.mandiName,
        currentPrice: priceData.modalPrice,
        targetPrice: alert.targetPrice,
        condition: alert.condition,
        priceChange: priceData.priceChange,
        priceChangePercent: priceData.priceChangePercent,
        trend: priceData.trend,
        mandiUrl: `${process.env.FRONTEND_URL}/mandi/${priceData.mandiId}`,
        alertsUrl: `${process.env.FRONTEND_URL}/dashboard/alerts`,
        supportEmail: process.env.SUPPORT_EMAIL,
        year: new Date().getFullYear(),
      },
      priority: "high",
    })
  }

  /**
   * Send new product notification to followers
   */
  async sendNewProductNotification(product, farmer, followers) {
    const emails = followers.map((follower) => ({
      to: follower.email,
      subject: `New Product from ${farmer.fullName} - ${product.name}`,
      template: "new-product",
      data: {
        userName: follower.fullName,
        farmerName: farmer.fullName,
        farmerRating: farmer.rating?.average?.toFixed(1),
        productName: product.name,
        productImage: product.images?.[0]?.url,
        productPrice: product.pricing.basePrice,
        productUnit: product.pricing.unit,
        productDescription: product.description.substring(0, 200) + "...",
        isOrganic: product.specifications?.organic,
        productUrl: `${process.env.FRONTEND_URL}/products/${product._id}`,
        farmerUrl: `${process.env.FRONTEND_URL}/farmers/${farmer._id}`,
        unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?type=farmer&id=${farmer._id}`,
        supportEmail: process.env.SUPPORT_EMAIL,
        year: new Date().getFullYear(),
      },
    }))

    return this.sendBulkEmails(emails)
  }

  /**
   * Send expert activity digest
   */
  async sendExpertActivityDigest(expert, stats) {
    return this.sendEmail({
      to: expert.email,
      subject: "Your Weekly Activity Summary - GreenTrace Advisory",
      template: "expert-activity-digest",
      data: {
        expertName: expert.fullName,
        period: "This Week",
        questionsAnswered: stats.questionsAnswered,
        helpfulVotes: stats.helpfulVotes,
        acceptedAnswers: stats.acceptedAnswers,
        newFollowers: stats.newFollowers,
        totalEarnings: stats.earnings,
        topQuestions: stats.topQuestions,
        pendingQuestions: stats.pendingQuestions,
        dashboardUrl: `${process.env.FRONTEND_URL}/expert/dashboard`,
        supportEmail: process.env.SUPPORT_EMAIL,
        year: new Date().getFullYear(),
      },
    })
  }

  /**
   * Send KYC verification status update
   */
  async sendKYCStatusUpdate(user, status, reason = null) {
    return this.sendEmail({
      to: user.email,
      subject: `KYC Verification ${status === "verified" ? "Approved" : "Update"} - GreenTrace`,
      template: "kyc-status",
      data: {
        userName: user.fullName,
        status,
        isApproved: status === "verified",
        isRejected: status === "rejected",
        isPending: status === "pending",
        rejectionReason: reason,
        resubmitUrl: `${process.env.FRONTEND_URL}/dashboard/kyc`,
        supportEmail: process.env.SUPPORT_EMAIL,
        year: new Date().getFullYear(),
      },
      priority: "high",
    })
  }

  // ===========================================
  // QUEUE MANAGEMENT
  // ===========================================

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    if (!this.queue) {
      return { message: "Queue not initialized" }
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ])

    return { waiting, active, completed, failed, delayed }
  }

  /**
   * Retry failed jobs
   */
  async retryFailedJobs() {
    if (!this.queue) return { message: "Queue not initialized" }

    const failed = await this.queue.getFailed()
    let retried = 0

    for (const job of failed) {
      await job.retry()
      retried++
    }

    return { retried }
  }

  /**
   * Clean old jobs
   */
  async cleanOldJobs(olderThanMs = 7 * 24 * 60 * 60 * 1000) {
    if (!this.queue) return { message: "Queue not initialized" }

    await this.queue.clean(olderThanMs, "completed")
    await this.queue.clean(olderThanMs, "failed")

    return { cleaned: true }
  }

  /**
   * Pause queue
   */
  async pauseQueue() {
    if (!this.queue) return { message: "Queue not initialized" }
    await this.queue.pause()
    return { paused: true }
  }

  /**
   * Resume queue
   */
  async resumeQueue() {
    if (!this.queue) return { message: "Queue not initialized" }
    await this.queue.resume()
    return { resumed: true }
  }
}

// Export singleton instance
module.exports = new EmailService()
