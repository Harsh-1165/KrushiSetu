# GreenTrace - Complete MongoDB Schema Design

## Overview

This document contains production-ready Mongoose schemas for the GreenTrace agricultural marketplace platform. All schemas include comprehensive validation, indexing strategies, and relationship definitions.

---

## Table of Contents

1. [User Schema](#1-user-schema)
2. [Product Schema](#2-product-schema)
3. [Order Schema](#3-order-schema)
4. [Question Schema](#4-question-schema)
5. [Answer Schema](#5-answer-schema)
6. [Article Schema](#6-article-schema)
7. [MandiPrice Schema](#7-mandiprice-schema)
8. [Review Schema](#8-review-schema)
9. [Transaction Schema](#9-transaction-schema)
10. [Notification Schema](#10-notification-schema)
11. [Supporting Schemas](#11-supporting-schemas)
12. [Index Strategy Summary](#12-index-strategy-summary)

---

## 1. User Schema

### Purpose
Stores all user data including farmers, agricultural experts, and consumers with role-based access control.

### Schema Definition

\`\`\`javascript
// backend/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Sub-schema for address
const AddressSchema = new mongoose.Schema({
  street: {
    type: String,
    trim: true,
    maxlength: [200, 'Street address cannot exceed 200 characters']
  },
  village: {
    type: String,
    trim: true,
    maxlength: [100, 'Village name cannot exceed 100 characters']
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true,
    maxlength: [100, 'District name cannot exceed 100 characters']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [100, 'State name cannot exceed 100 characters']
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    match: [/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit pincode']
  },
  country: {
    type: String,
    default: 'India',
    trim: true
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  }
}, { _id: false });

// Sub-schema for farmer-specific details
const FarmerDetailsSchema = new mongoose.Schema({
  farmSize: {
    value: {
      type: Number,
      min: [0, 'Farm size cannot be negative']
    },
    unit: {
      type: String,
      enum: ['acres', 'hectares', 'bigha', 'guntha'],
      default: 'acres'
    }
  },
  primaryCrops: [{
    type: String,
    trim: true
  }],
  farmingType: {
    type: String,
    enum: ['organic', 'conventional', 'mixed', 'hydroponic', 'vertical'],
    default: 'conventional'
  },
  irrigationType: {
    type: String,
    enum: ['rainfed', 'canal', 'tubewell', 'drip', 'sprinkler', 'mixed'],
  },
  soilType: {
    type: String,
    enum: ['alluvial', 'black', 'red', 'laterite', 'desert', 'mountain', 'other']
  },
  farmPhotos: [{
    url: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  certifications: [{
    name: String,
    issuedBy: String,
    certificateNumber: String,
    issuedDate: Date,
    expiryDate: Date,
    documentUrl: String,
    verified: { type: Boolean, default: false }
  }],
  bankDetails: {
    accountHolderName: String,
    accountNumber: {
      type: String,
      select: false // Hidden by default for security
    },
    ifscCode: String,
    bankName: String,
    branchName: String,
    upiId: String
  }
}, { _id: false });

// Sub-schema for expert-specific details
const ExpertDetailsSchema = new mongoose.Schema({
  qualification: {
    type: String,
    required: [true, 'Qualification is required for experts'],
    trim: true
  },
  specialization: [{
    type: String,
    trim: true
  }],
  experience: {
    years: {
      type: Number,
      min: [0, 'Experience cannot be negative'],
      max: [70, 'Please enter valid experience']
    },
    description: String
  },
  organization: {
    name: String,
    designation: String,
    joinedDate: Date
  },
  credentials: [{
    title: String,
    institution: String,
    year: Number,
    documentUrl: String,
    verified: { type: Boolean, default: false }
  }],
  consultationFee: {
    amount: {
      type: Number,
      min: [0, 'Fee cannot be negative'],
      default: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    per: {
      type: String,
      enum: ['session', 'hour', 'question'],
      default: 'session'
    }
  },
  availableSlots: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    startTime: String, // Format: "HH:MM"
    endTime: String,
    isAvailable: { type: Boolean, default: true }
  }],
  languages: [{
    type: String,
    trim: true
  }],
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  totalAnswers: {
    type: Number,
    default: 0
  },
  verifiedExpert: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Main User Schema
const UserSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
      'Please enter a valid email address'
    ],
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Never return password in queries
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
    index: true
  },
  
  // Profile Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: [100, 'Display name cannot exceed 100 characters']
  },
  avatar: {
    url: {
      type: String,
      default: null
    },
    publicId: String // For cloud storage reference
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    trim: true
  },
  
  // Role & Permissions
  role: {
    type: String,
    enum: {
      values: ['farmer', 'expert', 'consumer', 'admin', 'moderator'],
      message: '{VALUE} is not a valid role'
    },
    required: [true, 'User role is required'],
    index: true
  },
  permissions: [{
    type: String,
    enum: [
      'create_product', 'edit_product', 'delete_product',
      'answer_questions', 'create_articles', 'moderate_content',
      'manage_users', 'view_analytics', 'manage_prices'
    ]
  }],
  
  // Address
  address: AddressSchema,
  
  // Role-specific Details
  farmerDetails: {
    type: FarmerDetailsSchema,
    default: null
  },
  expertDetails: {
    type: ExpertDetailsSchema,
    default: null
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'submitted', 'verified', 'rejected'],
    default: 'pending'
  },
  kycDocuments: [{
    type: {
      type: String,
      enum: ['aadhaar', 'pan', 'voter_id', 'driving_license', 'passport']
    },
    documentNumber: {
      type: String,
      select: false
    },
    documentUrl: {
      type: String,
      select: false
    },
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // Preferences
  preferences: {
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'hi', 'mr', 'gu', 'pa', 'bn', 'ta', 'te', 'kn', 'ml']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      priceAlerts: { type: Boolean, default: true },
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false }
    },
    displayUnits: {
      weight: { type: String, enum: ['kg', 'quintal', 'ton'], default: 'kg' },
      area: { type: String, enum: ['acres', 'hectares', 'bigha'], default: 'acres' }
    }
  },
  
  // Statistics (denormalized for performance)
  stats: {
    totalOrders: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalPurchases: { type: Number, default: 0 },
    totalProducts: { type: Number, default: 0 },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 }
    },
    responseRate: { type: Number, default: 0 }, // For farmers - how quickly they respond
    completionRate: { type: Number, default: 0 } // Order completion rate
  },
  
  // Security
  passwordChangedAt: Date,
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Session Management
  refreshTokens: [{
    token: { type: String, select: false },
    deviceInfo: {
      deviceType: String,
      browser: String,
      os: String,
      ip: String
    },
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date
  }],
  lastLogin: {
    at: Date,
    ip: String,
    deviceInfo: String
  },
  
  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============ INDEXES ============

// Compound indexes for common queries
UserSchema.index({ role: 1, isActive: 1, isDeleted: 1 });
UserSchema.index({ 'address.state': 1, 'address.district': 1, role: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ 'stats.rating.average': -1, role: 1 });

// Text index for search
UserSchema.index({
  firstName: 'text',
  lastName: 'text',
  displayName: 'text',
  'address.district': 'text',
  'address.state': 'text'
}, {
  weights: {
    firstName: 10,
    lastName: 10,
    displayName: 8,
    'address.district': 5,
    'address.state': 3
  },
  name: 'user_text_search'
});

// Geospatial index
UserSchema.index({ 'address.coordinates': '2dsphere' });

// ============ VIRTUALS ============

UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'seller',
  justOne: false
});

UserSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'buyer',
  justOne: false
});

UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ============ PRE-SAVE MIDDLEWARE ============

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();
  
  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  
  // Set passwordChangedAt
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1s to ensure token is created after
  }
  
  next();
});

// Set display name if not provided
UserSchema.pre('save', function(next) {
  if (!this.displayName) {
    this.displayName = `${this.firstName} ${this.lastName}`;
  }
  next();
});

// Filter out deleted users by default
UserSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// ============ METHODS ============

// Compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if password changed after token was issued
UserSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Generate password reset token
UserSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Generate email verification token
UserSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Increment login attempts
UserSchema.methods.incrementLoginAttempts = async function() {
  // Reset if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account if max attempts reached (5 attempts)
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hour lock
  }
  
  return this.updateOne(updates);
};

// ============ STATICS ============

// Find by credentials
UserSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email }).select('+password');
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  if (user.isLocked) {
    throw new Error('Account is temporarily locked. Please try again later.');
  }
  
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    await user.incrementLoginAttempts();
    throw new Error('Invalid email or password');
  }
  
  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.updateOne({
      $set: { loginAttempts: 0 },
      $unset: { lockUntil: 1 }
    });
  }
  
  return user;
};

// Find nearby users (for farmers)
UserSchema.statics.findNearby = function(coordinates, maxDistance = 50000, role = 'farmer') {
  return this.find({
    'address.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance // in meters
      }
    },
    role: role,
    isActive: true
  });
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
\`\`\`

### Example Documents

\`\`\`javascript
// Farmer Example
{
  "_id": ObjectId("64f1a2b3c4d5e6f7a8b9c0d1"),
  "email": "ramesh.kumar@example.com",
  "phone": "9876543210",
  "firstName": "Ramesh",
  "lastName": "Kumar",
  "displayName": "Ramesh Kumar",
  "role": "farmer",
  "avatar": {
    "url": "https://storage.greentrace.com/avatars/ramesh-kumar.jpg",
    "publicId": "avatars/ramesh-kumar"
  },
  "bio": "Organic farmer from Punjab with 15 years of experience in wheat and rice cultivation.",
  "address": {
    "village": "Khanna",
    "district": "Ludhiana",
    "state": "Punjab",
    "pincode": "141401",
    "country": "India",
    "coordinates": {
      "type": "Point",
      "coordinates": [76.2144, 30.6942]
    }
  },
  "farmerDetails": {
    "farmSize": { "value": 25, "unit": "acres" },
    "primaryCrops": ["wheat", "rice", "maize"],
    "farmingType": "organic",
    "irrigationType": "tubewell",
    "soilType": "alluvial",
    "certifications": [
      {
        "name": "India Organic",
        "issuedBy": "APEDA",
        "certificateNumber": "ORG-PB-2023-1234",
        "issuedDate": ISODate("2023-01-15"),
        "expiryDate": ISODate("2026-01-14"),
        "verified": true
      }
    ]
  },
  "isActive": true,
  "isVerified": true,
  "kycStatus": "verified",
  "stats": {
    "totalOrders": 156,
    "totalSales": 2450000,
    "totalProducts": 12,
    "rating": { "average": 4.7, "count": 89 },
    "responseRate": 95,
    "completionRate": 98
  },
  "preferences": {
    "language": "hi",
    "notifications": {
      "email": true,
      "sms": true,
      "push": true,
      "priceAlerts": true
    }
  },
  "createdAt": ISODate("2023-06-15T10:30:00Z"),
  "updatedAt": ISODate("2024-01-10T15:45:00Z")
}

// Expert Example
{
  "_id": ObjectId("64f1a2b3c4d5e6f7a8b9c0d2"),
  "email": "dr.sharma@agri-university.edu",
  "phone": "9988776655",
  "firstName": "Priya",
  "lastName": "Sharma",
  "displayName": "Dr. Priya Sharma",
  "role": "expert",
  "bio": "Agricultural scientist specializing in sustainable farming practices and pest management.",
  "address": {
    "district": "Pune",
    "state": "Maharashtra",
    "pincode": "411007"
  },
  "expertDetails": {
    "qualification": "Ph.D. in Agricultural Sciences",
    "specialization": ["pest management", "organic farming", "soil health"],
    "experience": { "years": 12, "description": "Research and extension work" },
    "organization": {
      "name": "ICAR - National Institute of Abiotic Stress Management",
      "designation": "Senior Scientist"
    },
    "consultationFee": { "amount": 500, "currency": "INR", "per": "session" },
    "languages": ["English", "Hindi", "Marathi"],
    "rating": { "average": 4.9, "count": 234 },
    "totalAnswers": 1567,
    "verifiedExpert": true
  },
  "isActive": true,
  "isVerified": true
}

// Consumer Example
{
  "_id": ObjectId("64f1a2b3c4d5e6f7a8b9c0d3"),
  "email": "amit.consumer@gmail.com",
  "phone": "9123456789",
  "firstName": "Amit",
  "lastName": "Patel",
  "role": "consumer",
  "address": {
    "street": "123, Green Valley Apartments",
    "district": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "stats": {
    "totalOrders": 23,
    "totalPurchases": 45000
  },
  "preferences": {
    "language": "en",
    "notifications": {
      "orderUpdates": true,
      "promotions": true
    }
  }
}
\`\`\`

---

## 2. Product Schema

### Purpose
Stores agricultural product listings with comprehensive details including pricing, inventory, and specifications.

### Schema Definition

\`\`\`javascript
// backend/models/Product.js

const mongoose = require('mongoose');
const slugify = require('slugify');

// Sub-schema for pricing
const PricingSchema = new mongoose.Schema({
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR'
  },
  unit: {
    type: String,
    required: [true, 'Price unit is required'],
    enum: ['kg', 'quintal', 'ton', 'piece', 'dozen', 'bunch', 'litre', 'packet']
  },
  minOrderQuantity: {
    type: Number,
    default: 1,
    min: [1, 'Minimum order quantity must be at least 1']
  },
  maxOrderQuantity: {
    type: Number,
    default: null
  },
  bulkPricing: [{
    minQuantity: {
      type: Number,
      required: true
    },
    maxQuantity: Number,
    pricePerUnit: {
      type: Number,
      required: true
    },
    discountPercentage: Number
  }],
  negotiable: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Sub-schema for inventory
const InventorySchema = new mongoose.Schema({
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'quintal', 'ton', 'piece', 'dozen', 'bunch', 'litre', 'packet']
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  trackInventory: {
    type: Boolean,
    default: true
  },
  allowBackorder: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Sub-schema for product specifications
const SpecificationsSchema = new mongoose.Schema({
  variety: String,
  grade: {
    type: String,
    enum: ['A', 'B', 'C', 'premium', 'standard', 'economy']
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large', 'extra-large', 'mixed']
  },
  color: String,
  moisture: {
    value: Number,
    unit: { type: String, default: '%' }
  },
  purity: {
    value: Number,
    unit: { type: String, default: '%' }
  },
  foreignMatter: {
    value: Number,
    unit: { type: String, default: '%' }
  },
  damaged: {
    value: Number,
    unit: { type: String, default: '%' }
  },
  shelfLife: {
    value: Number,
    unit: { type: String, enum: ['days', 'weeks', 'months'], default: 'days' }
  },
  storageConditions: String,
  packagingType: {
    type: String,
    enum: ['loose', 'bag', 'box', 'crate', 'carton', 'vacuum-packed']
  },
  packagingWeight: {
    value: Number,
    unit: { type: String, enum: ['kg', 'g'], default: 'kg' }
  },
  customSpecs: [{
    key: String,
    value: String,
    unit: String
  }]
}, { _id: false });

// Sub-schema for harvest/production info
const HarvestInfoSchema = new mongoose.Schema({
  harvestDate: Date,
  expectedHarvestDate: Date,
  season: {
    type: String,
    enum: ['kharif', 'rabi', 'zaid', 'year-round']
  },
  cropYear: String,
  batchNumber: String,
  farmLocation: {
    type: String
  },
  farmingMethod: {
    type: String,
    enum: ['organic', 'natural', 'conventional', 'hydroponic', 'integrated']
  },
  pesticidesUsed: {
    type: Boolean,
    default: null
  },
  fertilizersUsed: [{
    type: { type: String, enum: ['organic', 'chemical', 'bio'] },
    name: String
  }]
}, { _id: false });

// Main Product Schema
const ProductSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters'],
    index: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  description: {
    short: {
      type: String,
      required: [true, 'Short description is required'],
      maxlength: [300, 'Short description cannot exceed 300 characters']
    },
    full: {
      type: String,
      maxlength: [5000, 'Full description cannot exceed 5000 characters']
    }
  },
  
  // Categorization
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'grains', 'pulses', 'vegetables', 'fruits', 'spices',
      'oilseeds', 'dairy', 'poultry', 'meat', 'fish',
      'flowers', 'seeds', 'fertilizers', 'pesticides',
      'equipment', 'fodder', 'honey', 'processed', 'other'
    ],
    index: true
  },
  subCategory: {
    type: String,
    trim: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Seller Information
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller is required'],
    index: true
  },
  
  // Media
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  videos: [{
    url: String,
    publicId: String,
    thumbnail: String,
    duration: Number // in seconds
  }],
  
  // Pricing & Inventory
  pricing: {
    type: PricingSchema,
    required: true
  },
  inventory: {
    type: InventorySchema,
    required: true
  },
  
  // Product Details
  specifications: SpecificationsSchema,
  harvestInfo: HarvestInfoSchema,
  
  // Certifications
  certifications: [{
    name: {
      type: String,
      enum: ['organic', 'fssai', 'iso', 'haccp', 'gmp', 'agmark', 'india-organic', 'other']
    },
    certificateNumber: String,
    issuedBy: String,
    validUntil: Date,
    documentUrl: String,
    verified: {
      type: Boolean,
      default: false
    }
  }],
  
  // Shipping & Delivery
  shipping: {
    weight: {
      value: Number,
      unit: { type: String, enum: ['kg', 'g'], default: 'kg' }
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, enum: ['cm', 'inch'], default: 'cm' }
    },
    freeShipping: {
      type: Boolean,
      default: false
    },
    freeShippingAbove: Number,
    shippingCost: {
      local: { type: Number, default: 0 },
      state: { type: Number, default: 0 },
      national: { type: Number, default: 0 }
    },
    estimatedDelivery: {
      min: { type: Number, default: 2 }, // days
      max: { type: Number, default: 7 }
    },
    availableRegions: [{
      type: String // State codes or 'all'
    }],
    pickupAvailable: {
      type: Boolean,
      default: true
    }
  },
  
  // Location (for local search)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    district: String,
    state: String,
    pincode: String
  },
  
  // Status & Visibility
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'inactive', 'sold_out', 'discontinued'],
    default: 'draft',
    index: true
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public'
  },
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  featuredUntil: Date,
  
  // Reviews & Ratings
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true
    },
    count: {
      type: Number,
      default: 0
    },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },
  
  // Statistics
  stats: {
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 },
    orders: { type: Number, default: 0 },
    sold: { type: Number, default: 0 }
  },
  
  // SEO
  seo: {
    metaTitle: {
      type: String,
      maxlength: 70
    },
    metaDescription: {
      type: String,
      maxlength: 160
    },
    keywords: [String]
  },
  
  // Moderation
  moderation: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    rejectionReason: String,
    flags: [{
      reason: String,
      reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reportedAt: { type: Date, default: Date.now }
    }]
  },
  
  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============ INDEXES ============

// Compound indexes
ProductSchema.index({ category: 1, status: 1, isDeleted: 1 });
ProductSchema.index({ seller: 1, status: 1 });
ProductSchema.index({ 'pricing.basePrice': 1, category: 1 });
ProductSchema.index({ 'location.state': 1, category: 1, status: 1 });
ProductSchema.index({ featured: 1, status: 1, createdAt: -1 });
ProductSchema.index({ 'rating.average': -1, 'stats.sold': -1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ tags: 1 });

// Text index for search
ProductSchema.index({
  name: 'text',
  'description.short': 'text',
  'description.full': 'text',
  tags: 'text',
  subCategory: 'text'
}, {
  weights: {
    name: 10,
    tags: 8,
    'description.short': 5,
    subCategory: 5,
    'description.full': 2
  },
  name: 'product_text_search'
});

// Geospatial index
ProductSchema.index({ location: '2dsphere' });

// ============ VIRTUALS ============

ProductSchema.virtual('availableQuantity').get(function() {
  return this.inventory.quantity - this.inventory.reservedQuantity;
});

ProductSchema.virtual('isInStock').get(function() {
  return this.availableQuantity > 0 || this.inventory.allowBackorder;
});

ProductSchema.virtual('isLowStock').get(function() {
  return this.availableQuantity <= this.inventory.lowStockThreshold;
});

ProductSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : (this.images[0]?.url || null);
});

ProductSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
  justOne: false
});

// ============ PRE-SAVE MIDDLEWARE ============

// Generate slug
ProductSchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true
    }) + '-' + this._id.toString().slice(-6);
  }
  next();
});

// Set location from seller if not provided
ProductSchema.pre('save', async function(next) {
  if (!this.location?.coordinates && this.seller) {
    const User = mongoose.model('User');
    const seller = await User.findById(this.seller).select('address');
    if (seller?.address?.coordinates) {
      this.location = {
        type: 'Point',
        coordinates: seller.address.coordinates.coordinates,
        district: seller.address.district,
        state: seller.address.state,
        pincode: seller.address.pincode
      };
    }
  }
  next();
});

// Filter out deleted products
ProductSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// ============ METHODS ============

// Check if product can be ordered
ProductSchema.methods.canOrder = function(requestedQuantity) {
  if (!this.inventory.trackInventory) return true;
  if (this.inventory.allowBackorder) return true;
  return this.availableQuantity >= requestedQuantity;
};

// Reserve inventory
ProductSchema.methods.reserveInventory = async function(quantity) {
  if (!this.canOrder(quantity)) {
    throw new Error('Insufficient inventory');
  }
  this.inventory.reservedQuantity += quantity;
  return this.save();
};

// Release reserved inventory
ProductSchema.methods.releaseInventory = async function(quantity) {
  this.inventory.reservedQuantity = Math.max(0, this.inventory.reservedQuantity - quantity);
  return this.save();
};

// Deduct inventory (after successful order)
ProductSchema.methods.deductInventory = async function(quantity) {
  this.inventory.quantity -= quantity;
  this.inventory.reservedQuantity = Math.max(0, this.inventory.reservedQuantity - quantity);
  this.stats.sold += quantity;
  
  // Update status if sold out
  if (this.inventory.quantity <= 0 && !this.inventory.allowBackorder) {
    this.status = 'sold_out';
  }
  
  return this.save();
};

// Calculate price for quantity
ProductSchema.methods.calculatePrice = function(quantity) {
  const bulkPricing = this.pricing.bulkPricing?.sort((a, b) => b.minQuantity - a.minQuantity);
  
  if (bulkPricing?.length > 0) {
    for (const tier of bulkPricing) {
      if (quantity >= tier.minQuantity && (!tier.maxQuantity || quantity <= tier.maxQuantity)) {
        return tier.pricePerUnit * quantity;
      }
    }
  }
  
  return this.pricing.basePrice * quantity;
};

// ============ STATICS ============

// Find products by location
ProductSchema.statics.findNearby = function(coordinates, maxDistance = 50000, filters = {}) {
  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    },
    status: 'active',
    ...filters
  };
  
  return this.find(query);
};

// Search products
ProductSchema.statics.search = function(searchTerm, filters = {}) {
  const query = {
    $text: { $search: searchTerm },
    status: 'active',
    ...filters
  };
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

// Get trending products
ProductSchema.statics.getTrending = function(limit = 10) {
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  return this.find({
    status: 'active',
    updatedAt: { $gte: lastWeek }
  })
  .sort({ 'stats.views': -1, 'stats.orders': -1 })
  .limit(limit);
};

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;
\`\`\`

### Example Document

\`\`\`javascript
{
  "_id": ObjectId("64f2b3c4d5e6f7a8b9c0d1e2"),
  "name": "Premium Organic Basmati Rice",
  "slug": "premium-organic-basmati-rice-d1e2f3",
  "description": {
    "short": "Aged 2-year organic basmati rice from Punjab with extra-long grains and aromatic flavor.",
    "full": "Our premium organic basmati rice is carefully cultivated in the fertile plains of Punjab using traditional farming methods. Each grain is aged for 2 years to achieve the perfect texture and aroma. The rice features extra-long grains that elongate further upon cooking, remaining fluffy and separate. Certified organic by India Organic, our rice is free from pesticides and chemical fertilizers."
  },
  "category": "grains",
  "subCategory": "rice",
  "tags": ["organic", "basmati", "aged", "premium", "punjab", "aromatic"],
  "seller": ObjectId("64f1a2b3c4d5e6f7a8b9c0d1"),
  "images": [
    {
      "url": "https://storage.greentrace.com/products/basmati-1.jpg",
      "publicId": "products/basmati-1",
      "alt": "Premium Organic Basmati Rice - Full View",
      "isPrimary": true,
      "order": 0
    },
    {
      "url": "https://storage.greentrace.com/products/basmati-2.jpg",
      "alt": "Basmati Rice Grains Close-up",
      "order": 1
    }
  ],
  "pricing": {
    "basePrice": 180,
    "currency": "INR",
    "unit": "kg",
    "minOrderQuantity": 5,
    "maxOrderQuantity": 1000,
    "bulkPricing": [
      { "minQuantity": 50, "maxQuantity": 99, "pricePerUnit": 170, "discountPercentage": 5.5 },
      { "minQuantity": 100, "maxQuantity": 499, "pricePerUnit": 160, "discountPercentage": 11 },
      { "minQuantity": 500, "pricePerUnit": 150, "discountPercentage": 16.5 }
    ],
    "negotiable": true
  },
  "inventory": {
    "quantity": 5000,
    "unit": "kg",
    "reservedQuantity": 150,
    "lowStockThreshold": 500,
    "trackInventory": true,
    "allowBackorder": false
  },
  "specifications": {
    "variety": "Pusa 1121",
    "grade": "premium",
    "size": "extra-large",
    "moisture": { "value": 12, "unit": "%" },
    "purity": { "value": 99, "unit": "%" },
    "foreignMatter": { "value": 0.5, "unit": "%" },
    "shelfLife": { "value": 24, "unit": "months" },
    "storageConditions": "Store in a cool, dry place away from direct sunlight",
    "packagingType": "bag",
    "packagingWeight": { "value": 25, "unit": "kg" }
  },
  "harvestInfo": {
    "harvestDate": ISODate("2023-11-15"),
    "season": "kharif",
    "cropYear": "2023",
    "batchNumber": "BT-2023-NOV-001",
    "farmingMethod": "organic",
    "pesticidesUsed": false
  },
  "certifications": [
    {
      "name": "india-organic",
      "certificateNumber": "ORG-PB-2023-1234",
      "issuedBy": "APEDA",
      "validUntil": ISODate("2026-01-14"),
      "verified": true
    },
    {
      "name": "fssai",
      "certificateNumber": "10020091000123",
      "verified": true
    }
  ],
  "shipping": {
    "weight": { "value": 25, "unit": "kg" },
    "freeShipping": false,
    "freeShippingAbove": 5000,
    "shippingCost": { "local": 50, "state": 100, "national": 200 },
    "estimatedDelivery": { "min": 3, "max": 7 },
    "availableRegions": ["all"],
    "pickupAvailable": true
  },
  "location": {
    "type": "Point",
    "coordinates": [76.2144, 30.6942],
    "district": "Ludhiana",
    "state": "Punjab",
    "pincode": "141401"
  },
  "status": "active",
  "visibility": "public",
  "featured": true,
  "featuredUntil": ISODate("2024-03-01"),
  "rating": {
    "average": 4.7,
    "count": 89,
    "distribution": { "1": 2, "2": 3, "3": 5, "4": 15, "5": 64 }
  },
  "stats": {
    "views": 12500,
    "uniqueViews": 8900,
    "favorites": 234,
    "inquiries": 45,
    "orders": 156,
    "sold": 4500
  },
  "moderation": {
    "status": "approved",
    "reviewedBy": ObjectId("64f0a1b2c3d4e5f6a7b8c9d0"),
    "reviewedAt": ISODate("2024-01-02")
  },
  "createdAt": ISODate("2024-01-01T10:00:00Z"),
  "updatedAt": ISODate("2024-01-15T14:30:00Z")
}
\`\`\`

---

## 3. Order Schema

### Purpose
Manages purchase transactions, order lifecycle, payments, and delivery tracking.

### Schema Definition

\`\`\`javascript
// backend/models/Order.js

const mongoose = require('mongoose');
const crypto = require('crypto');

// Sub-schema for order items
const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productSnapshot: {
    name: String,
    slug: String,
    image: String,
    category: String,
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sellerName: String
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unit: {
    type: String,
    required: true
  },
  pricePerUnit: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, { _id: true });

// Sub-schema for shipping address
const ShippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  alternatePhone: String,
  street: String,
  landmark: String,
  village: String,
  district: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    default: 'India'
  },
  coordinates: {
    type: [Number]
  },
  addressType: {
    type: String,
    enum: ['home', 'office', 'farm', 'warehouse', 'other'],
    default: 'home'
  }
}, { _id: false });

// Sub-schema for payment
const PaymentSchema = new mongoose.Schema({
  method: {
    type: String,
    required: true,
    enum: ['cod', 'upi', 'card', 'netbanking', 'wallet', 'bank_transfer']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  transactionId: String,
  gatewayOrderId: String,
  gatewayPaymentId: String,
  gatewaySignature: String,
  paidAmount: {
    type: Number,
    default: 0
  },
  paidAt: Date,
  refundedAmount: {
    type: Number,
    default: 0
  },
  refundedAt: Date,
  refundReason: String,
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    select: false
  }
}, { _id: false });

// Sub-schema for shipping/delivery
const DeliverySchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['standard', 'express', 'pickup', 'self_delivery'],
    default: 'standard'
  },
  partner: {
    name: String,
    trackingId: String,
    trackingUrl: String,
    awbNumber: String
  },
  cost: {
    type: Number,
    default: 0
  },
  estimatedDelivery: {
    from: Date,
    to: Date
  },
  actualDelivery: Date,
  pickupScheduled: Date,
  pickedUpAt: Date,
  dispatchedAt: Date,
  outForDeliveryAt: Date,
  deliveredAt: Date,
  deliveryProof: {
    type: String, // Image URL
  },
  deliveryOtp: {
    code: { type: String, select: false },
    expiresAt: Date,
    verified: { type: Boolean, default: false }
  },
  instructions: String,
  trackingHistory: [{
    status: String,
    location: String,
    timestamp: { type: Date, default: Date.now },
    description: String
  }]
}, { _id: false });

// Main Order Schema
const OrderSchema = new mongoose.Schema({
  // Order Identification
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Parties
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Buyer is required'],
    index: true
  },
  sellers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Order Items
  items: {
    type: [OrderItemSchema],
    validate: [
      {
        validator: function(items) {
          return items.length > 0;
        },
        message: 'Order must have at least one item'
      }
    ]
  },
  
  // Pricing Summary
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      amount: { type: Number, default: 0 },
      code: String,
      type: { type: String, enum: ['percentage', 'fixed'] }
    },
    tax: {
      amount: { type: Number, default: 0 },
      breakdown: [{
        type: { type: String }, // GST, CGST, SGST, etc.
        rate: Number,
        amount: Number
      }]
    },
    shipping: {
      type: Number,
      default: 0
    },
    handlingFee: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  
  // Addresses
  shippingAddress: {
    type: ShippingAddressSchema,
    required: true
  },
  billingAddress: ShippingAddressSchema,
  billingAddressSameAsShipping: {
    type: Boolean,
    default: true
  },
  
  // Payment
  payment: PaymentSchema,
  
  // Delivery
  delivery: DeliverySchema,
  
  // Order Status
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed', 
      'processing',
      'partially_shipped',
      'shipped',
      'out_for_delivery',
      'delivered',
      'completed',
      'cancelled',
      'returned',
      'refunded'
    ],
    default: 'pending',
    index: true
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Order Type
  orderType: {
    type: String,
    enum: ['instant', 'bulk', 'contract', 'auction'],
    default: 'instant'
  },
  
  // Source
  source: {
    type: String,
    enum: ['web', 'mobile_app', 'api', 'phone'],
    default: 'web'
  },
  
  // Notes
  buyerNote: {
    type: String,
    maxlength: 500
  },
  sellerNote: {
    type: String,
    maxlength: 500
  },
  internalNote: {
    type: String,
    maxlength: 1000,
    select: false
  },
  
  // Cancellation
  cancellation: {
    requestedAt: Date,
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: [
        'changed_mind', 'found_better_price', 'wrong_product',
        'delivery_delay', 'seller_cancelled', 'out_of_stock',
        'payment_failed', 'other'
      ]
    },
    reasonDetail: String,
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Return/Refund
  returnRequest: {
    requestedAt: Date,
    reason: {
      type: String,
      enum: [
        'damaged', 'wrong_product', 'quality_issue',
        'not_as_described', 'missing_items', 'other'
      ]
    },
    reasonDetail: String,
    images: [String],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'pickup_scheduled', 'picked_up', 'refund_processed']
    },
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Invoice
  invoice: {
    number: String,
    generatedAt: Date,
    url: String
  },
  
  // Timestamps for key events
  confirmedAt: Date,
  processedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  
  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============ INDEXES ============

// Compound indexes
OrderSchema.index({ buyer: 1, status: 1, createdAt: -1 });
OrderSchema.index({ 'sellers': 1, status: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'payment.status': 1, status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'shippingAddress.state': 1, 'shippingAddress.district': 1 });

// ============ VIRTUALS ============

OrderSchema.virtual('itemCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

OrderSchema.virtual('isPaid').get(function() {
  return this.payment?.status === 'completed';
});

OrderSchema.virtual('canCancel').get(function() {
  return ['pending', 'confirmed'].includes(this.status);
});

OrderSchema.virtual('canReturn').get(function() {
  if (this.status !== 'delivered') return false;
  const deliveredAt = this.deliveredAt || this.delivery?.deliveredAt;
  if (!deliveredAt) return false;
  const returnWindow = 7 * 24 * 60 * 60 * 1000; // 7 days
  return (Date.now() - deliveredAt.getTime()) < returnWindow;
});

// ============ PRE-SAVE MIDDLEWARE ============

// Generate order number
OrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.orderNumber = `GT${year}${month}${day}${random}`;
  }
  next();
});

// Calculate totals
OrderSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.pricing.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Get unique sellers
    this.sellers = [...new Set(this.items.map(item => 
      item.productSnapshot?.seller?.toString() || item.product?.seller?.toString()
    ).filter(Boolean))].map(id => new mongoose.Types.ObjectId(id));
  }
  next();
});

// Add status to history
OrderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
    
    // Set event timestamps
    const now = new Date();
    switch(this.status) {
      case 'confirmed': this.confirmedAt = now; break;
      case 'processing': this.processedAt = now; break;
      case 'shipped': this.shippedAt = now; break;
      case 'delivered': this.deliveredAt = now; break;
      case 'completed': this.completedAt = now; break;
      case 'cancelled': this.cancelledAt = now; break;
    }
  }
  next();
});

// Filter deleted orders
OrderSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// ============ METHODS ============

// Generate delivery OTP
OrderSchema.methods.generateDeliveryOtp = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.delivery.deliveryOtp = {
    code: otp,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    verified: false
  };
  return otp;
};

// Verify delivery OTP
OrderSchema.methods.verifyDeliveryOtp = function(otp) {
  if (!this.delivery?.deliveryOtp?.code) return false;
  if (this.delivery.deliveryOtp.expiresAt < new Date()) return false;
  if (this.delivery.deliveryOtp.code !== otp) return false;
  
  this.delivery.deliveryOtp.verified = true;
  return true;
};

// Update item status
OrderSchema.methods.updateItemStatus = function(itemId, status, note, userId) {
  const item = this.items.id(itemId);
  if (!item) throw new Error('Item not found');
  
  item.status = status;
  item.statusHistory.push({
    status,
    note,
    updatedBy: userId
  });
  
  return this;
};

// ============ STATICS ============

// Get order statistics for a user
OrderSchema.statics.getUserStats = async function(userId, role = 'buyer') {
  const matchField = role === 'buyer' ? 'buyer' : 'sellers';
  
  const stats = await this.aggregate([
    { $match: { [matchField]: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$pricing.total' }
      }
    }
  ]);
  
  return stats.reduce((acc, stat) => {
    acc[stat._id] = { count: stat.count, totalAmount: stat.totalAmount };
    return acc;
  }, {});
};

// Get sales analytics
OrderSchema.statics.getSalesAnalytics = async function(sellerId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        sellers: new mongoose.Types.ObjectId(sellerId),
        status: { $in: ['delivered', 'completed'] },
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        orders: { $sum: 1 },
        revenue: { $sum: '$pricing.total' },
        itemsSold: { $sum: { $size: '$items' } }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
};

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;
\`\`\`

### Example Document

\`\`\`javascript
{
  "_id": ObjectId("64f3c4d5e6f7a8b9c0d1e2f3"),
  "orderNumber": "GT240115A1B2C3",
  "buyer": ObjectId("64f1a2b3c4d5e6f7a8b9c0d3"),
  "sellers": [ObjectId("64f1a2b3c4d5e6f7a8b9c0d1")],
  "items": [
    {
      "_id": ObjectId("64f3c4d5e6f7a8b9c0d1e2f4"),
      "product": ObjectId("64f2b3c4d5e6f7a8b9c0d1e2"),
      "productSnapshot": {
        "name": "Premium Organic Basmati Rice",
        "slug": "premium-organic-basmati-rice-d1e2f3",
        "image": "https://storage.greentrace.com/products/basmati-1.jpg",
        "category": "grains",
        "seller": ObjectId("64f1a2b3c4d5e6f7a8b9c0d1"),
        "sellerName": "Ramesh Kumar"
      },
      "quantity": 50,
      "unit": "kg",
      "pricePerUnit": 170,
      "totalPrice": 8500,
      "discount": 500,
      "tax": 0,
      "status": "delivered",
      "statusHistory": [
        { "status": "pending", "timestamp": ISODate("2024-01-15T10:00:00Z") },
        { "status": "confirmed", "timestamp": ISODate("2024-01-15T10:05:00Z") },
        { "status": "shipped", "timestamp": ISODate("2024-01-16T14:00:00Z") },
        { "status": "delivered", "timestamp": ISODate("2024-01-18T11:30:00Z") }
      ]
    }
  ],
  "pricing": {
    "subtotal": 8500,
    "discount": { "amount": 500, "code": "FIRST50", "type": "fixed" },
    "tax": { "amount": 0, "breakdown": [] },
    "shipping": 100,
    "handlingFee": 0,
    "total": 8100,
    "currency": "INR"
  },
  "shippingAddress": {
    "fullName": "Amit Patel",
    "phone": "9123456789",
    "street": "123, Green Valley Apartments",
    "district": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India",
    "addressType": "home"
  },
  "billingAddressSameAsShipping": true,
  "payment": {
    "method": "upi",
    "status": "completed",
    "transactionId": "TXN240115001234",
    "gatewayOrderId": "order_Nk12345678",
    "gatewayPaymentId": "pay_Nk12345678",
    "paidAmount": 8100,
    "paidAt": ISODate("2024-01-15T10:03:00Z")
  },
  "delivery": {
    "method": "standard",
    "partner": {
      "name": "Delhivery",
      "trackingId": "DL1234567890",
      "awbNumber": "AWB123456"
    },
    "cost": 100,
    "estimatedDelivery": {
      "from": ISODate("2024-01-18"),
      "to": ISODate("2024-01-20")
    },
    "actualDelivery": ISODate("2024-01-18T11:30:00Z"),
    "pickedUpAt": ISODate("2024-01-16T09:00:00Z"),
    "dispatchedAt": ISODate("2024-01-16T14:00:00Z"),
    "deliveredAt": ISODate("2024-01-18T11:30:00Z"),
    "deliveryOtp": { "verified": true },
    "trackingHistory": [
      { "status": "Order Placed", "timestamp": ISODate("2024-01-15T10:05:00Z") },
      { "status": "Picked Up", "location": "Ludhiana, Punjab", "timestamp": ISODate("2024-01-16T09:00:00Z") },
      { "status": "In Transit", "location": "Delhi Hub", "timestamp": ISODate("2024-01-17T06:00:00Z") },
      { "status": "Out for Delivery", "location": "Mumbai", "timestamp": ISODate("2024-01-18T08:00:00Z") },
      { "status": "Delivered", "location": "Mumbai", "timestamp": ISODate("2024-01-18T11:30:00Z") }
    ]
  },
  "status": "completed",
  "statusHistory": [
    { "status": "pending", "timestamp": ISODate("2024-01-15T10:00:00Z") },
    { "status": "confirmed", "timestamp": ISODate("2024-01-15T10:05:00Z") },
    { "status": "processing", "timestamp": ISODate("2024-01-15T14:00:00Z") },
    { "status": "shipped", "timestamp": ISODate("2024-01-16T14:00:00Z") },
    { "status": "delivered", "timestamp": ISODate("2024-01-18T11:30:00Z") },
    { "status": "completed", "timestamp": ISODate("2024-01-18T12:00:00Z") }
  ],
  "orderType": "instant",
  "source": "web",
  "buyerNote": "Please deliver before 12 PM if possible",
  "invoice": {
    "number": "INV-GT240115001",
    "generatedAt": ISODate("2024-01-18T12:00:00Z"),
    "url": "https://storage.greentrace.com/invoices/INV-GT240115001.pdf"
  },
  "confirmedAt": ISODate("2024-01-15T10:05:00Z"),
  "shippedAt": ISODate("2024-01-16T14:00:00Z"),
  "deliveredAt": ISODate("2024-01-18T11:30:00Z"),
  "completedAt": ISODate("2024-01-18T12:00:00Z"),
  "createdAt": ISODate("2024-01-15T10:00:00Z"),
  "updatedAt": ISODate("2024-01-18T12:00:00Z")
}
\`\`\`

---

## 4. Question Schema

### Purpose
Stores crop advisory questions from farmers with categorization, urgency levels, and expert assignment.

### Schema Definition

\`\`\`javascript
// backend/models/Question.js

const mongoose = require('mongoose');
const slugify = require('slugify');

const QuestionSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Question title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    index: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  content: {
    type: String,
    required: [true, 'Question content is required'],
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  
  // Author
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required'],
    index: true
  },
  
  // Categorization
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'crop_disease', 'pest_management', 'soil_health', 'irrigation',
      'fertilizers', 'seeds', 'harvesting', 'post_harvest', 'storage',
      'weather', 'market_price', 'organic_farming', 'equipment',
      'government_schemes', 'finance', 'general'
    ],
    index: true
  },
  subCategory: String,
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Crop Information
  cropInfo: {
    name: String,
    variety: String,
    growthStage: {
      type: String,
      enum: ['germination', 'seedling', 'vegetative', 'flowering', 'fruiting', 'maturity', 'harvest']
    },
    plantedDate: Date,
    affectedArea: {
      value: Number,
      unit: { type: String, enum: ['acres', 'hectares', 'bigha'], default: 'acres' }
    }
  },
  
  // Location Context
  location: {
    district: String,
    state: String,
    pincode: String,
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number]
    }
  },
  
  // Weather Context (auto-populated or user-provided)
  weatherContext: {
    temperature: { min: Number, max: Number },
    humidity: Number,
    rainfall: Number, // mm in last 7 days
    season: String
  },
  
  // Media Attachments
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'video', 'document'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    publicId: String,
    thumbnail: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Urgency & Priority
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  consultationFee: {
    amount: Number,
    currency: { type: String, default: 'INR' },
    paidAt: Date,
    transactionId: String
  },
  
  // Expert Assignment
  assignedExperts: [{
    expert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['assigned', 'accepted', 'declined', 'answered'],
      default: 'assigned'
    }
  }],
  
  // Status
  status: {
    type: String,
    enum: ['open', 'in_progress', 'answered', 'closed', 'spam'],
    default: 'open',
    index: true
  },
  isResolved: {
    type: Boolean,
    default: false,
    index: true
  },
  resolvedAt: Date,
  
  // Accepted Answer
  acceptedAnswer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer'
  },
  
  // Engagement Statistics
  stats: {
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    answers: { type: Number, default: 0 },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
  },
  
  // User Interactions
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  bookmarkedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Visibility & Moderation
  visibility: {
    type: String,
    enum: ['public', 'private', 'experts_only'],
    default: 'public'
  },
  moderation: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'approved'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    rejectionReason: String
  },
  
  // Language
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'hi', 'mr', 'gu', 'pa', 'bn', 'ta', 'te', 'kn', 'ml']
  },
  
  // Follow-up Questions
  followUpTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  },
  
  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============ INDEXES ============

QuestionSchema.index({ category: 1, status: 1, createdAt: -1 });
QuestionSchema.index({ author: 1, status: 1 });
QuestionSchema.index({ tags: 1 });
QuestionSchema.index({ 'location.state': 1, category: 1 });
QuestionSchema.index({ urgency: 1, status: 1 });
QuestionSchema.index({ createdAt: -1 });
QuestionSchema.index({ 'stats.views': -1, 'stats.upvotes': -1 });
QuestionSchema.index({ 'cropInfo.name': 1, category: 1 });

// Text index
QuestionSchema.index({
  title: 'text',
  content: 'text',
  tags: 'text',
  'cropInfo.name': 'text'
}, {
  weights: { title: 10, tags: 8, 'cropInfo.name': 5, content: 2 },
  name: 'question_text_search'
});

// Geospatial
QuestionSchema.index({ 'location.coordinates': '2dsphere' });

// ============ VIRTUALS ============

QuestionSchema.virtual('answers', {
  ref: 'Answer',
  localField: '_id',
  foreignField: 'question',
  justOne: false
});

QuestionSchema.virtual('voteScore').get(function() {
  return this.stats.upvotes - this.stats.downvotes;
});

// ============ PRE-SAVE MIDDLEWARE ============

QuestionSchema.pre('save', function(next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true }) 
      + '-' + this._id.toString().slice(-6);
  }
  next();
});

QuestionSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// ============ METHODS ============

QuestionSchema.methods.vote = async function(userId, voteType) {
  const userIdStr = userId.toString();
  const upvoteIndex = this.upvotedBy.findIndex(id => id.toString() === userIdStr);
  const downvoteIndex = this.downvotedBy.findIndex(id => id.toString() === userIdStr);
  
  if (voteType === 'up') {
    if (upvoteIndex > -1) {
      // Remove upvote
      this.upvotedBy.splice(upvoteIndex, 1);
      this.stats.upvotes--;
    } else {
      // Add upvote, remove downvote if exists
      this.upvotedBy.push(userId);
      this.stats.upvotes++;
      if (downvoteIndex > -1) {
        this.downvotedBy.splice(downvoteIndex, 1);
        this.stats.downvotes--;
      }
    }
  } else if (voteType === 'down') {
    if (downvoteIndex > -1) {
      this.downvotedBy.splice(downvoteIndex, 1);
      this.stats.downvotes--;
    } else {
      this.downvotedBy.push(userId);
      this.stats.downvotes++;
      if (upvoteIndex > -1) {
        this.upvotedBy.splice(upvoteIndex, 1);
        this.stats.upvotes--;
      }
    }
  }
  
  return this.save();
};

QuestionSchema.methods.toggleBookmark = async function(userId) {
  const userIdStr = userId.toString();
  const index = this.bookmarkedBy.findIndex(id => id.toString() === userIdStr);
  
  if (index > -1) {
    this.bookmarkedBy.splice(index, 1);
    this.stats.bookmarks--;
  } else {
    this.bookmarkedBy.push(userId);
    this.stats.bookmarks++;
  }
  
  return this.save();
};

// ============ STATICS ============

QuestionSchema.statics.search = function(searchTerm, filters = {}) {
  return this.find({
    $text: { $search: searchTerm },
    status: { $ne: 'spam' },
    ...filters
  }, { score: { $meta: 'textScore' } })
  .sort({ score: { $meta: 'textScore' } });
};

QuestionSchema.statics.getRelated = async function(questionId, limit = 5) {
  const question = await this.findById(questionId);
  if (!question) return [];
  
  return this.find({
    _id: { $ne: questionId },
    $or: [
      { category: question.category },
      { tags: { $in: question.tags } },
      { 'cropInfo.name': question.cropInfo?.name }
    ],
    status: { $in: ['open', 'answered'] }
  })
  .sort({ 'stats.upvotes': -1, createdAt: -1 })
  .limit(limit);
};

const Question = mongoose.model('Question', QuestionSchema);

module.exports = Question;
\`\`\`

### Example Document

\`\`\`javascript
{
  "_id": ObjectId("64f4d5e6f7a8b9c0d1e2f3a4"),
  "title": "Yellow spots appearing on wheat leaves - What could be the cause?",
  "slug": "yellow-spots-appearing-on-wheat-leaves-f3a4b5",
  "content": "I have noticed yellow spots appearing on my wheat crop leaves over the past week. The spots are about 2-3mm in diameter and seem to be spreading. The crop is in the tillering stage and was planted 45 days ago. I have attached photos for reference. The weather has been humid lately with occasional light rain. What could be causing this and how should I treat it?",
  "author": ObjectId("64f1a2b3c4d5e6f7a8b9c0d1"),
  "category": "crop_disease",
  "subCategory": "fungal_disease",
  "tags": ["wheat", "yellow-spots", "leaf-disease", "fungal", "tillering-stage"],
  "cropInfo": {
    "name": "Wheat",
    "variety": "HD 2967",
    "growthStage": "vegetative",
    "plantedDate": ISODate("2023-11-15"),
    "affectedArea": { "value": 5, "unit": "acres" }
  },
  "location": {
    "district": "Ludhiana",
    "state": "Punjab",
    "pincode": "141401",
    "coordinates": { "type": "Point", "coordinates": [76.2144, 30.6942] }
  },
  "weatherContext": {
    "temperature": { "min": 8, "max": 22 },
    "humidity": 78,
    "rainfall": 15,
    "season": "rabi"
  },
  "attachments": [
    {
      "type": "image",
      "url": "https://storage.greentrace.com/questions/wheat-yellow-spots-1.jpg",
      "thumbnail": "https://storage.greentrace.com/questions/thumb/wheat-yellow-spots-1.jpg",
      "description": "Close-up of affected leaf showing yellow spots"
    },
    {
      "type": "image",
      "url": "https://storage.greentrace.com/questions/wheat-yellow-spots-2.jpg",
      "description": "Overview of affected area in the field"
    }
  ],
  "urgency": "high",
  "isPaid": false,
  "assignedExperts": [
    {
      "expert": ObjectId("64f1a2b3c4d5e6f7a8b9c0d2"),
      "assignedAt": ISODate("2024-01-02T10:30:00Z"),
      "status": "answered"
    }
  ],
  "status": "answered",
  "isResolved": true,
  "resolvedAt": ISODate("2024-01-02T14:45:00Z"),
  "acceptedAnswer": ObjectId("64f5e6f7a8b9c0d1e2f3a4b5"),
  "stats": {
    "views": 1250,
    "uniqueViews": 890,
    "answers": 3,
    "upvotes": 45,
    "downvotes": 2,
    "bookmarks": 67,
    "shares": 12
  },
  "visibility": "public",
  "moderation": { "status": "approved" },
  "language": "en",
  "createdAt": ISODate("2024-01-02T09:00:00Z"),
  "updatedAt": ISODate("2024-01-02T14:45:00Z")
}
\`\`\`

---

## 5. Answer Schema

### Purpose
Stores expert answers to crop advisory questions with verification, voting, and expert credentials.

### Schema Definition

\`\`\`javascript
// backend/models/Answer.js

const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  // References
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: [true, 'Question reference is required'],
    index: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required'],
    index: true
  },
  
  // Content
  content: {
    type: String,
    required: [true, 'Answer content is required'],
    maxlength: [10000, 'Answer cannot exceed 10000 characters']
  },
  
  // Structured Recommendations
  recommendations: {
    immediate: [{
      action: String,
      description: String,
      priority: { type: String, enum: ['high', 'medium', 'low'] }
    }],
    preventive: [{
      action: String,
      description: String
    }],
    products: [{
      name: String,
      type: { type: String, enum: ['pesticide', 'fungicide', 'fertilizer', 'organic', 'other'] },
      dosage: String,
      applicationMethod: String,
      safetyPrecautions: String
    }]
  },
  
  // Media
  attachments: [{
    type: { type: String, enum: ['image', 'video', 'document', 'link'] },
    url: String,
    title: String,
    description: String
  }],
  
  // References & Sources
  references: [{
    title: String,
    source: String,
    url: String
  }],
  
  // Status
  isAccepted: {
    type: Boolean,
    default: false,
    index: true
  },
  acceptedAt: Date,
  
  // Verification (for expert credibility)
  verification: {
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    verificationNote: String
  },
  
  // Engagement
  stats: {
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    helpful: { type: Number, default: 0 },
    notHelpful: { type: Number, default: 0 }
  },
  upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  helpfulBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Moderation
  moderation: {
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'flagged'], default: 'approved' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    rejectionReason: String
  },
  
  // Edit History
  isEdited: { type: Boolean, default: false },
  editHistory: [{
    content: String,
    editedAt: Date,
    editReason: String
  }],
  
  // Language
  language: {
    type: String,
    default: 'en'
  },
  
  // Soft Delete
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============ INDEXES ============

AnswerSchema.index({ question: 1, createdAt: -1 });
AnswerSchema.index({ author: 1, isAccepted: 1 });
AnswerSchema.index({ 'stats.upvotes': -1, isAccepted: -1 });

// ============ VIRTUALS ============

AnswerSchema.virtual('voteScore').get(function() {
  return this.stats.upvotes - this.stats.downvotes;
});

AnswerSchema.virtual('helpfulScore').get(function() {
  const total = this.stats.helpful + this.stats.notHelpful;
  return total > 0 ? (this.stats.helpful / total) * 100 : 0;
});

// ============ MIDDLEWARE ============

AnswerSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Increment answer count on question
    await mongoose.model('Question').findByIdAndUpdate(
      this.question,
      { $inc: { 'stats.answers': 1 } }
    );
    
    // Increment expert's total answers
    await mongoose.model('User').findByIdAndUpdate(
      this.author,
      { $inc: { 'expertDetails.totalAnswers': 1 } }
    );
  }
  next();
});

AnswerSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editHistory.push({
      content: this._original?.content,
      editedAt: new Date(),
      editReason: 'Content updated'
    });
  }
  next();
});

AnswerSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// ============ METHODS ============

AnswerSchema.methods.vote = async function(userId, voteType) {
  const userIdStr = userId.toString();
  const upvoteIndex = this.upvotedBy.findIndex(id => id.toString() === userIdStr);
  const downvoteIndex = this.downvotedBy.findIndex(id => id.toString() === userIdStr);
  
  if (voteType === 'up') {
    if (upvoteIndex > -1) {
      this.upvotedBy.splice(upvoteIndex, 1);
      this.stats.upvotes--;
    } else {
      this.upvotedBy.push(userId);
      this.stats.upvotes++;
      if (downvoteIndex > -1) {
        this.downvotedBy.splice(downvoteIndex, 1);
        this.stats.downvotes--;
      }
    }
  } else if (voteType === 'down') {
    if (downvoteIndex > -1) {
      this.downvotedBy.splice(downvoteIndex, 1);
      this.stats.downvotes--;
    } else {
      this.downvotedBy.push(userId);
      this.stats.downvotes++;
      if (upvoteIndex > -1) {
        this.upvotedBy.splice(upvoteIndex, 1);
        this.stats.upvotes--;
      }
    }
  }
  
  return this.save();
};

AnswerSchema.methods.markHelpful = async function(userId, isHelpful) {
  const userIdStr = userId.toString();
  const helpfulIndex = this.helpfulBy.findIndex(id => id.toString() === userIdStr);
  
  if (helpfulIndex > -1) {
    // User already marked - toggle or change
    this.helpfulBy.splice(helpfulIndex, 1);
    this.stats.helpful--;
  }
  
  if (isHelpful) {
    this.helpfulBy.push(userId);
    this.stats.helpful++;
  } else {
    this.stats.notHelpful++;
  }
  
  return this.save();
};

AnswerSchema.methods.accept = async function() {
  this.isAccepted = true;
  this.acceptedAt = new Date();
  
  // Update the question with accepted answer
  await mongoose.model('Question').findByIdAndUpdate(
    this.question,
    {
      acceptedAnswer: this._id,
      isResolved: true,
      resolvedAt: new Date(),
      status: 'answered'
    }
  );
  
  // Unaccept other answers for this question
  await mongoose.model('Answer').updateMany(
    { question: this.question, _id: { $ne: this._id } },
    { isAccepted: false, acceptedAt: null }
  );
  
  return this.save();
};

const Answer = mongoose.model('Answer', AnswerSchema);

module.exports = Answer;
\`\`\`

### Example Document

\`\`\`javascript
{
  "_id": ObjectId("64f5e6f7a8b9c0d1e2f3a4b5"),
  "question": ObjectId("64f4d5e6f7a8b9c0d1e2f3a4"),
  "author": ObjectId("64f1a2b3c4d5e6f7a8b9c0d2"),
  "content": "Based on the images you've shared, this appears to be Yellow Rust (Puccinia striiformis), a common fungal disease in wheat during the rabi season, especially in humid conditions.\n\n**Identification:**\nThe yellow-orange pustules arranged in stripes on leaves are characteristic of Yellow Rust. The disease thrives in temperatures between 10-15°C with high humidity.\n\n**Immediate Action Required:**\nGiven that the disease is already visible on multiple plants, I recommend immediate fungicide application to prevent further spread.",
  "recommendations": {
    "immediate": [
      {
        "action": "Apply Propiconazole 25% EC",
        "description": "Mix 1ml per litre of water and spray on affected and surrounding plants. Ensure complete coverage of leaves.",
        "priority": "high"
      },
      {
        "action": "Remove severely affected plants",
        "description": "If any plants show more than 50% infection, consider removing them to prevent spore spread.",
        "priority": "medium"
      }
    ],
    "preventive": [
      {
        "action": "Improve air circulation",
        "description": "Avoid dense planting in future seasons to reduce humidity around plants"
      },
      {
        "action": "Use resistant varieties",
        "description": "Consider varieties like PBW 343 or HD 2967 which have moderate resistance to rust"
      }
    ],
    "products": [
      {
        "name": "Propiconazole 25% EC (Tilt)",
        "type": "fungicide",
        "dosage": "1 ml per litre of water",
        "applicationMethod": "Foliar spray with knapsack sprayer",
        "safetyPrecautions": "Wear protective clothing, gloves, and mask. Avoid spraying during windy conditions."
      },
      {
        "name": "Mancozeb 75% WP",
        "type": "fungicide",
        "dosage": "2.5 g per litre of water",
        "applicationMethod": "Foliar spray as preventive measure",
        "safetyPrecautions": "Do not mix with alkaline substances"
      }
    ]
  },
  "attachments": [
    {
      "type": "image",
      "url": "https://storage.greentrace.com/answers/yellow-rust-cycle.jpg",
      "title": "Yellow Rust Disease Cycle",
      "description": "Reference diagram showing the disease progression"
    }
  ],
  "references": [
    {
      "title": "Management of Wheat Rusts",
      "source": "ICAR-Indian Institute of Wheat & Barley Research",
      "url": "https://iiwbr.icar.gov.in"
    }
  ],
  "isAccepted": true,
  "acceptedAt": ISODate("2024-01-02T14:45:00Z"),
  "verification": {
    "isVerified": true,
    "verifiedBy": ObjectId("64f0a1b2c3d4e5f6a7b8c9d0"),
    "verifiedAt": ISODate("2024-01-02T15:00:00Z"),
    "verificationNote": "Accurate diagnosis and appropriate treatment recommendations"
  },
  "stats": {
    "upvotes": 32,
    "downvotes": 1,
    "helpful": 28,
    "notHelpful": 2
  },
  "moderation": { "status": "approved" },
  "isEdited": false,
  "language": "en",
  "createdAt": ISODate("2024-01-02T11:30:00Z"),
  "updatedAt": ISODate("2024-01-02T15:00:00Z")
}
\`\`\`

---

## 6. Article Schema

### Purpose
Knowledge base articles for agricultural education with rich content, categorization, and SEO optimization.

### Schema Definition

\`\`\`javascript
// backend/models/Article.js

const mongoose = require('mongoose');
const slugify = require('slugify');

// Sub-schema for content sections
const ContentSectionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['heading', 'paragraph', 'list', 'image', 'video', 'quote', 'code', 'table', 'callout'],
    required: true
  },
  content: mongoose.Schema.Types.Mixed, // Flexible content based on type
  order: { type: Number, required: true }
}, { _id: true });

const ArticleSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Article title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    index: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  excerpt: {
    type: String,
    required: [true, 'Excerpt is required'],
    maxlength: [500, 'Excerpt cannot exceed 500 characters']
  },
  
  // Content
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  contentSections: [ContentSectionSchema], // For structured content
  
  // Author
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  contributors: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['editor', 'reviewer', 'translator'] },
    contributedAt: { type: Date, default: Date.now }
  }],
  
  // Categorization
  category: {
    type: String,
    required: true,
    enum: [
      'crop_cultivation', 'pest_disease', 'soil_management', 'irrigation',
      'organic_farming', 'post_harvest', 'market_intelligence', 'farm_equipment',
      'government_schemes', 'success_stories', 'seasonal_guide', 'research',
      'weather', 'livestock', 'aquaculture', 'general'
    ],
    index: true
  },
  subCategory: String,
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Related Crops
  relatedCrops: [{
    type: String,
    trim: true
  }],
  
  // Media
  featuredImage: {
    url: { type: String, required: true },
    alt: String,
    caption: String,
    publicId: String
  },
  gallery: [{
    url: String,
    alt: String,
    caption: String,
    order: Number
  }],
  
  // Reading Info
  readingTime: {
    type: Number, // in minutes
    default: 5
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  
  // Publishing
  status: {
    type: String,
    enum: ['draft', 'review', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  publishedAt: Date,
  scheduledPublishAt: Date,
  
  // Visibility
  visibility: {
    type: String,
    enum: ['public', 'members_only', 'premium'],
    default: 'public'
  },
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  featuredUntil: Date,
  pinned: {
    type: Boolean,
    default: false
  },
  
  // SEO
  seo: {
    metaTitle: { type: String, maxlength: 70 },
    metaDescription: { type: String, maxlength: 160 },
    keywords: [String],
    canonicalUrl: String,
    ogImage: String
  },
  
  // Engagement
  stats: {
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    avgReadTime: { type: Number, default: 0 } // in seconds
  },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Related Articles
  relatedArticles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article'
  }],
  
  // Comments enabled
  commentsEnabled: {
    type: Boolean,
    default: true
  },
  
  // Language & Translations
  language: {
    type: String,
    default: 'en'
  },
  translations: [{
    language: String,
    article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' }
  }],
  originalArticle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article'
  },
  
  // Version Control
  version: {
    type: Number,
    default: 1
  },
  revisions: [{
    version: Number,
    content: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
    changeNote: String
  }],
  
  // Moderation
  moderation: {
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    feedback: String
  },
  
  // Location relevance (for regional content)
  relevantRegions: [{
    state: String,
    districts: [String]
  }],
  
  // Seasonal relevance
  seasonalRelevance: [{
    season: { type: String, enum: ['kharif', 'rabi', 'zaid', 'year-round'] },
    months: [Number] // 1-12
  }],
  
  // Soft Delete
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============ INDEXES ============

ArticleSchema.index({ category: 1, status: 1, publishedAt: -1 });
ArticleSchema.index({ tags: 1 });
ArticleSchema.index({ relatedCrops: 1 });
ArticleSchema.index({ featured: 1, status: 1 });
ArticleSchema.index({ 'stats.views': -1, publishedAt: -1 });
ArticleSchema.index({ publishedAt: -1 });

ArticleSchema.index({
  title: 'text',
  excerpt: 'text',
  content: 'text',
  tags: 'text',
  relatedCrops: 'text'
}, {
  weights: { title: 10, tags: 8, relatedCrops: 6, excerpt: 4, content: 2 },
  name: 'article_text_search'
});

// ============ PRE-SAVE MIDDLEWARE ============

ArticleSchema.pre('save', function(next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true }) 
      + '-' + this._id.toString().slice(-6);
  }
  
  // Calculate reading time (average 200 words per minute)
  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);
  }
  
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

ArticleSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// ============ METHODS ============

ArticleSchema.methods.toggleLike = async function(userId) {
  const index = this.likedBy.findIndex(id => id.toString() === userId.toString());
  if (index > -1) {
    this.likedBy.splice(index, 1);
    this.stats.likes--;
  } else {
    this.likedBy.push(userId);
    this.stats.likes++;
  }
  return this.save();
};

ArticleSchema.methods.toggleBookmark = async function(userId) {
  const index = this.bookmarkedBy.findIndex(id => id.toString() === userId.toString());
  if (index > -1) {
    this.bookmarkedBy.splice(index, 1);
    this.stats.bookmarks--;
  } else {
    this.bookmarkedBy.push(userId);
    this.stats.bookmarks++;
  }
  return this.save();
};

ArticleSchema.methods.createRevision = function(userId, changeNote) {
  this.revisions.push({
    version: this.version,
    content: this.content,
    updatedBy: userId,
    changeNote
  });
  this.version++;
};

// ============ STATICS ============

ArticleSchema.statics.search = function(searchTerm, filters = {}) {
  return this.find({
    $text: { $search: searchTerm },
    status: 'published',
    ...filters
  }, { score: { $meta: 'textScore' } })
  .sort({ score: { $meta: 'textScore' } });
};

ArticleSchema.statics.getByCategory = function(category, options = {}) {
  const { limit = 10, page = 1 } = options;
  return this.find({ category, status: 'published' })
    .sort({ publishedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('author', 'displayName avatar');
};

ArticleSchema.statics.getTrending = function(days = 7, limit = 10) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.find({
    status: 'published',
    publishedAt: { $gte: since }
  })
  .sort({ 'stats.views': -1, 'stats.likes': -1 })
  .limit(limit);
};

const Article = mongoose.model('Article', ArticleSchema);

module.exports = Article;
\`\`\`

### Example Document

\`\`\`javascript
{
  "_id": ObjectId("64f6f7a8b9c0d1e2f3a4b5c6"),
  "title": "Complete Guide to Organic Wheat Cultivation in North India",
  "slug": "complete-guide-organic-wheat-cultivation-north-india-b5c6d7",
  "excerpt": "Learn the comprehensive techniques for organic wheat cultivation including soil preparation, seed selection, natural pest management, and harvesting practices suitable for North Indian conditions.",
  "content": "## Introduction\n\nOrganic wheat cultivation has gained significant momentum...",
  "author": ObjectId("64f1a2b3c4d5e6f7a8b9c0d2"),
  "category": "organic_farming",
  "subCategory": "cereals",
  "tags": ["organic", "wheat", "north-india", "rabi", "sustainable-farming"],
  "relatedCrops": ["wheat", "barley", "oats"],
  "featuredImage": {
    "url": "https://storage.greentrace.com/articles/organic-wheat-field.jpg",
    "alt": "Organic wheat field in Punjab",
    "caption": "A thriving organic wheat field in Ludhiana, Punjab"
  },
  "readingTime": 12,
  "difficulty": "intermediate",
  "status": "published",
  "publishedAt": ISODate("2024-01-05T10:00:00Z"),
  "visibility": "public",
  "featured": true,
  "featuredUntil": ISODate("2024-02-05"),
  "seo": {
    "metaTitle": "Organic Wheat Cultivation Guide | GreenTrace",
    "metaDescription": "Learn organic wheat farming techniques for North India. Expert tips on soil prep, natural pest control, and sustainable harvesting.",
    "keywords": ["organic wheat", "wheat cultivation", "organic farming India"]
  },
  "stats": {
    "views": 8500,
    "uniqueViews": 6200,
    "likes": 342,
    "bookmarks": 567,
    "shares": 89,
    "comments": 45
  },
  "commentsEnabled": true,
  "language": "en",
  "translations": [
    { "language": "hi", "article": ObjectId("64f6f7a8b9c0d1e2f3a4b5c7") }
  ],
  "version": 3,
  "moderation": { "status": "approved" },
  "relevantRegions": [
    { "state": "Punjab", "districts": [] },
    { "state": "Haryana", "districts": [] },
    { "state": "Uttar Pradesh", "districts": [] }
  ],
  "seasonalRelevance": [
    { "season": "rabi", "months": [10, 11, 12, 1, 2, 3, 4] }
  ],
  "createdAt": ISODate("2024-01-04T15:00:00Z"),
  "updatedAt": ISODate("2024-01-10T09:30:00Z")
}
\`\`\`

---

## 7. MandiPrice Schema

### Purpose
Real-time agricultural commodity prices from various markets (mandis) with historical tracking and alerts.

### Schema Definition

\`\`\`javascript
// backend/models/MandiPrice.js

const mongoose = require('mongoose');

const MandiPriceSchema = new mongoose.Schema({
  // Commodity Information
  commodity: {
    name: {
      type: String,
      required: [true, 'Commodity name is required'],
      trim: true,
      index: true
    },
    variety: {
      type: String,
      trim: true,
      index: true
    },
    grade: {
      type: String,
      enum: ['A', 'B', 'C', 'FAQ', 'premium', 'standard'],
      index: true
    },
    category: {
      type: String,
      required: true,
      enum: [
        'cereals', 'pulses', 'oilseeds', 'vegetables', 'fruits',
        'spices', 'fibers', 'flowers', 'dry_fruits', 'other'
      ],
      index: true
    }
  },
  
  // Market (Mandi) Information
  market: {
    name: {
      type: String,
      required: [true, 'Market name is required'],
      trim: true,
      index: true
    },
    code: {
      type: String,
      uppercase: true,
      index: true
    },
    district: {
      type: String,
      required: true,
      index: true
    },
    state: {
      type: String,
      required: true,
      index: true
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number]
    }
  },
  
  // Price Information
  price: {
    min: {
      type: Number,
      required: true,
      min: 0
    },
    max: {
      type: Number,
      required: true,
      min: 0
    },
    modal: {
      type: Number, // Most common transaction price
      required: true,
      min: 0
    },
    average: {
      type: Number,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      enum: ['quintal', 'kg', 'ton', 'dozen', 'piece'],
      default: 'quintal'
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  
  // Date Information
  priceDate: {
    type: Date,
    required: true,
    index: true
  },
  reportedAt: {
    type: Date,
    default: Date.now
  },
  
  // Trading Information
  tradingInfo: {
    arrivals: {
      quantity: Number,
      unit: { type: String, enum: ['quintal', 'ton'], default: 'quintal' }
    },
    tradedQuantity: {
      quantity: Number,
      unit: { type: String, enum: ['quintal', 'ton'], default: 'quintal' }
    },
    tradersPresent: Number
  },
  
  // Price Change
  priceChange: {
    daily: {
      amount: Number,
      percentage: Number
    },
    weekly: {
      amount: Number,
      percentage: Number
    },
    monthly: {
      amount: Number,
      percentage: Number
    }
  },
  
  // Trend Indicators
  trend: {
    type: String,
    enum: ['rising', 'falling', 'stable'],
    index: true
  },
  trendStrength: {
    type: String,
    enum: ['strong', 'moderate', 'weak']
  },
  
  // Data Source
  source: {
    type: String,
    enum: ['agmarknet', 'manual', 'api', 'scraper', 'user_reported'],
    default: 'agmarknet'
  },
  sourceReference: String,
  
  // Data Quality
  dataQuality: {
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    confidenceScore: { type: Number, min: 0, max: 100 }
  },
  
  // MSP Reference (Minimum Support Price)
  mspReference: {
    price: Number,
    year: String,
    aboveMSP: Boolean,
    percentageAboveMSP: Number
  },
  
  // Historical Reference
  historicalComparison: {
    lastYear: {
      price: Number,
      change: Number,
      changePercentage: Number
    },
    fiveYearAvg: {
      price: Number,
      change: Number,
      changePercentage: Number
    }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============ INDEXES ============

// Compound indexes for common queries
MandiPriceSchema.index({ 'commodity.name': 1, 'market.state': 1, priceDate: -1 });
MandiPriceSchema.index({ 'market.state': 1, 'market.district': 1, priceDate: -1 });
MandiPriceSchema.index({ 'commodity.category': 1, priceDate: -1 });
MandiPriceSchema.index({ priceDate: -1 });
MandiPriceSchema.index({ 'price.modal': 1, 'commodity.name': 1 });

// Unique constraint
MandiPriceSchema.index(
  { 
    'commodity.name': 1, 
    'commodity.variety': 1, 
    'market.code': 1, 
    priceDate: 1 
  },
  { unique: true }
);

// Geospatial
MandiPriceSchema.index({ 'market.coordinates': '2dsphere' });

// Text search
MandiPriceSchema.index({
  'commodity.name': 'text',
  'commodity.variety': 'text',
  'market.name': 'text',
  'market.district': 'text'
});

// ============ VIRTUALS ============

MandiPriceSchema.virtual('priceRange').get(function() {
  return this.price.max - this.price.min;
});

MandiPriceSchema.virtual('priceSpread').get(function() {
  if (this.price.modal === 0) return 0;
  return ((this.price.max - this.price.min) / this.price.modal) * 100;
});

// ============ STATICS ============

// Get latest prices for a commodity
MandiPriceSchema.statics.getLatestPrices = function(commodityName, options = {}) {
  const { state, district, limit = 20 } = options;
  
  const query = {
    'commodity.name': new RegExp(commodityName, 'i'),
    isActive: true
  };
  
  if (state) query['market.state'] = state;
  if (district) query['market.district'] = district;
  
  return this.find(query)
    .sort({ priceDate: -1, 'price.modal': -1 })
    .limit(limit);
};

// Get price trend for a commodity in a market
MandiPriceSchema.statics.getPriceTrend = async function(commodityName, marketCode, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.find({
    'commodity.name': commodityName,
    'market.code': marketCode,
    priceDate: { $gte: startDate }
  })
  .sort({ priceDate: 1 })
  .select('price.modal price.min price.max priceDate');
};

// Get top markets for a commodity
MandiPriceSchema.statics.getTopMarkets = async function(commodityName, type = 'highest', limit = 10) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const sortOrder = type === 'highest' ? -1 : 1;
  
  return this.aggregate([
    {
      $match: {
        'commodity.name': commodityName,
        priceDate: { $gte: today },
        isActive: true
      }
    },
    {
      $sort: { 'price.modal': sortOrder }
    },
    {
      $limit: limit
    },
    {
      $project: {
        market: 1,
        price: 1,
        priceDate: 1,
        trend: 1
      }
    }
  ]);
};

// Get price statistics
MandiPriceSchema.statics.getPriceStats = async function(commodityName, state, period = 'month') {
  let startDate;
  switch (period) {
    case 'week': startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); break;
    case 'month': startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); break;
    case 'quarter': startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); break;
    case 'year': startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); break;
    default: startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }
  
  const match = {
    'commodity.name': commodityName,
    priceDate: { $gte: startDate }
  };
  if (state) match['market.state'] = state;
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        avgPrice: { $avg: '$price.modal' },
        minPrice: { $min: '$price.min' },
        maxPrice: { $max: '$price.max' },
        totalRecords: { $sum: 1 },
        markets: { $addToSet: '$market.name' }
      }
    }
  ]);
};

// Find nearby markets with prices
MandiPriceSchema.statics.findNearbyMarkets = function(coordinates, commodityName, maxDistance = 100000) {
  return this.find({
    'market.coordinates': {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: maxDistance
      }
    },
    'commodity.name': new RegExp(commodityName, 'i'),
    isActive: true
  })
  .sort({ priceDate: -1 })
  .limit(20);
};

const MandiPrice = mongoose.model('MandiPrice', MandiPriceSchema);

module.exports = MandiPrice;
\`\`\`

### Example Document

\`\`\`javascript
{
  "_id": ObjectId("64f7a8b9c0d1e2f3a4b5c6d7"),
  "commodity": {
    "name": "Wheat",
    "variety": "Sharbati",
    "grade": "FAQ",
    "category": "cereals"
  },
  "market": {
    "name": "Khanna Mandi",
    "code": "PB-KHN-01",
    "district": "Ludhiana",
    "state": "Punjab",
    "coordinates": { "type": "Point", "coordinates": [76.2144, 30.6942] }
  },
  "price": {
    "min": 2100,
    "max": 2350,
    "modal": 2250,
    "average": 2200,
    "unit": "quintal",
    "currency": "INR"
  },
  "priceDate": ISODate("2024-01-15"),
  "reportedAt": ISODate("2024-01-15T18:30:00Z"),
  "tradingInfo": {
    "arrivals": { "quantity": 45000, "unit": "quintal" },
    "tradedQuantity": { "quantity": 38000, "unit": "quintal" },
    "tradersPresent": 125
  },
  "priceChange": {
    "daily": { "amount": 25, "percentage": 1.12 },
    "weekly": { "amount": 75, "percentage": 3.45 },
    "monthly": { "amount": 150, "percentage": 7.14 }
  },
  "trend": "rising",
  "trendStrength": "moderate",
  "source": "agmarknet",
  "dataQuality": {
    "isVerified": true,
    "confidenceScore": 95
  },
  "mspReference": {
    "price": 2125,
    "year": "2023-24",
    "aboveMSP": true,
    "percentageAboveMSP": 5.88
  },
  "historicalComparison": {
    "lastYear": {
      "price": 2050,
      "change": 200,
      "changePercentage": 9.76
    },
    "fiveYearAvg": {
      "price": 1850,
      "change": 400,
      "changePercentage": 21.62
    }
  },
  "isActive": true,
  "createdAt": ISODate("2024-01-15T18:30:00Z")
}
\`\`\`

---

## 8. Review Schema

### Purpose
Product and seller reviews with ratings, verification, and helpfulness tracking.

### Schema Definition

\`\`\`javascript
// backend/models/Review.js

const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  // Target (Product or User/Seller)
  targetType: {
    type: String,
    required: true,
    enum: ['product', 'seller', 'expert'],
    index: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    index: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  expert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Related Order (for verified purchase)
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  orderItem: {
    type: mongoose.Schema.Types.ObjectId
  },
  
  // Reviewer
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Rating
  rating: {
    overall: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
      index: true
    },
    quality: { type: Number, min: 1, max: 5 },
    freshness: { type: Number, min: 1, max: 5 },
    packaging: { type: Number, min: 1, max: 5 },
    valueForMoney: { type: Number, min: 1, max: 5 },
    delivery: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 } // For seller/expert reviews
  },
  
  // Content
  title: {
    type: String,
    trim: true,
    maxlength: [150, 'Title cannot exceed 150 characters']
  },
  content: {
    type: String,
    required: [true, 'Review content is required'],
    maxlength: [2000, 'Review cannot exceed 2000 characters']
  },
  
  // Pros and Cons
  pros: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  cons: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  
  // Media
  images: [{
    url: String,
    publicId: String,
    caption: String
  }],
  videos: [{
    url: String,
    publicId: String,
    thumbnail: String
  }],
  
  // Verification
  isVerifiedPurchase: {
    type: Boolean,
    default: false,
    index: true
  },
  purchaseDate: Date,
  
  // Helpfulness
  helpfulVotes: {
    type: Number,
    default: 0
  },
  notHelpfulVotes: {
    type: Number,
    default: 0
  },
  votedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vote: { type: String, enum: ['helpful', 'not_helpful'] },
    votedAt: { type: Date, default: Date.now }
  }],
  
  // Seller Response
  sellerResponse: {
    content: { type: String, maxlength: 1000 },
    respondedAt: Date,
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Status & Moderation
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged', 'hidden'],
    default: 'pending',
    index: true
  },
  moderation: {
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    rejectionReason: String,
    flags: [{
      reason: { type: String, enum: ['spam', 'inappropriate', 'fake', 'irrelevant', 'other'] },
      reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reportedAt: { type: Date, default: Date.now },
      details: String
    }]
  },
  
  // Edit tracking
  isEdited: { type: Boolean, default: false },
  editedAt: Date,
  editHistory: [{
    content: String,
    rating: Number,
    editedAt: Date
  }],
  
  // Visibility
  isAnonymous: {
    type: Boolean,
    default: false
  },
  
  // Soft Delete
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============ INDEXES ============

ReviewSchema.index({ product: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ seller: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ reviewer: 1, createdAt: -1 });
ReviewSchema.index({ 'rating.overall': -1, helpfulVotes: -1 });
ReviewSchema.index({ isVerifiedPurchase: 1, status: 1 });

// Unique constraint - one review per order item
ReviewSchema.index(
  { reviewer: 1, product: 1, order: 1 },
  { unique: true, sparse: true }
);

// ============ VIRTUALS ============

ReviewSchema.virtual('helpfulnessScore').get(function() {
  const total = this.helpfulVotes + this.notHelpfulVotes;
  return total > 0 ? (this.helpfulVotes / total) * 100 : 0;
});

ReviewSchema.virtual('averageRating').get(function() {
  const ratings = [
    this.rating.quality,
    this.rating.freshness,
    this.rating.packaging,
    this.rating.valueForMoney,
    this.rating.delivery
  ].filter(r => r != null);
  
  return ratings.length > 0 
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
    : this.rating.overall;
});

// ============ MIDDLEWARE ============

ReviewSchema.pre('save', async function(next) {
  if (this.isNew && this.status === 'approved') {
    await this.updateTargetRating();
  }
  next();
});

ReviewSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
    this.editHistory.push({
      content: this._original?.content,
      rating: this._original?.rating?.overall,
      editedAt: new Date()
    });
  }
  next();
});

ReviewSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// ============ METHODS ============

ReviewSchema.methods.updateTargetRating = async function() {
  const Model = this.targetType === 'product' 
    ? mongoose.model('Product')
    : mongoose.model('User');
  
  const targetId = this[this.targetType];
  
  const stats = await mongoose.model('Review').aggregate([
    {
      $match: {
        [this.targetType]: targetId,
        status: 'approved',
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        average: { $avg: '$rating.overall' },
        count: { $sum: 1 },
        dist1: { $sum: { $cond: [{ $eq: ['$rating.overall', 1] }, 1, 0] } },
        dist2: { $sum: { $cond: [{ $eq: ['$rating.overall', 2] }, 1, 0] } },
        dist3: { $sum: { $cond: [{ $eq: ['$rating.overall', 3] }, 1, 0] } },
        dist4: { $sum: { $cond: [{ $eq: ['$rating.overall', 4] }, 1, 0] } },
        dist5: { $sum: { $cond: [{ $eq: ['$rating.overall', 5] }, 1, 0] } }
      }
    }
  ]);
  
  if (stats.length > 0) {
    const ratingPath = this.targetType === 'product' ? 'rating' : 'stats.rating';
    await Model.findByIdAndUpdate(targetId, {
      [`${ratingPath}.average`]: Math.round(stats[0].average * 10) / 10,
      [`${ratingPath}.count`]: stats[0].count,
      [`${ratingPath}.distribution`]: {
        1: stats[0].dist1,
        2: stats[0].dist2,
        3: stats[0].dist3,
        4: stats[0].dist4,
        5: stats[0].dist5
      }
    });
  }
};

ReviewSchema.methods.vote = async function(userId, isHelpful) {
  const userIdStr = userId.toString();
  const existingVote = this.votedBy.find(v => v.user.toString() === userIdStr);
  
  if (existingVote) {
    if (existingVote.vote === (isHelpful ? 'helpful' : 'not_helpful')) {
      // Remove vote
      this.votedBy = this.votedBy.filter(v => v.user.toString() !== userIdStr);
      if (isHelpful) this.helpfulVotes--;
      else this.notHelpfulVotes--;
    } else {
      // Change vote
      existingVote.vote = isHelpful ? 'helpful' : 'not_helpful';
      existingVote.votedAt = new Date();
      if (isHelpful) {
        this.helpfulVotes++;
        this.notHelpfulVotes--;
      } else {
        this.helpfulVotes--;
        this.notHelpfulVotes++;
      }
    }
  } else {
    // New vote
    this.votedBy.push({ user: userId, vote: isHelpful ? 'helpful' : 'not_helpful' });
    if (isHelpful) this.helpfulVotes++;
    else this.notHelpfulVotes++;
  }
  
  return this.save();
};

// ============ STATICS ============

ReviewSchema.statics.getProductReviews = function(productId, options = {}) {
  const { sort = 'recent', rating, verified, limit = 10, page = 1 } = options;
  
  const query = {
    product: productId,
    status: 'approved'
  };
  
  if (rating) query['rating.overall'] = rating;
  if (verified) query.isVerifiedPurchase = true;
  
  let sortOption;
  switch (sort) {
    case 'helpful': sortOption = { helpfulVotes: -1 }; break;
    case 'highest': sortOption = { 'rating.overall': -1 }; break;
    case 'lowest': sortOption = { 'rating.overall': 1 }; break;
    default: sortOption = { createdAt: -1 };
  }
  
  return this.find(query)
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('reviewer', 'displayName avatar');
};

const Review = mongoose.model('Review', ReviewSchema);

module.exports = Review;
\`\`\`

### Example Document

\`\`\`javascript
{
  "_id": ObjectId("64f8b9c0d1e2f3a4b5c6d7e8"),
  "targetType": "product",
  "product": ObjectId("64f2b3c4d5e6f7a8b9c0d1e2"),
  "order": ObjectId("64f3c4d5e6f7a8b9c0d1e2f3"),
  "reviewer": ObjectId("64f1a2b3c4d5e6f7a8b9c0d3"),
  "rating": {
    "overall": 5,
    "quality": 5,
    "freshness": 5,
    "packaging": 4,
    "valueForMoney": 5,
    "delivery": 4
  },
  "title": "Excellent Quality Organic Rice - Highly Recommended!",
  "content": "This is hands down the best basmati rice I've ever purchased. The grains are long, aromatic, and cook perfectly every time. You can truly taste the difference with organic rice. The 2-year aging really shows in the texture. Delivery was prompt and packaging was good, though I wish it had better moisture protection.",
  "pros": [
    "Exceptional aroma and taste",
    "Perfect grain length",
    "Genuinely organic",
    "Great value for quality"
  ],
  "cons": [
    "Packaging could be more moisture-resistant"
  ],
  "images": [
    {
      "url": "https://storage.greentrace.com/reviews/rice-cooked.jpg",
      "caption": "Perfectly cooked rice with long separate grains"
    }
  ],
  "isVerifiedPurchase": true,
  "purchaseDate": ISODate("2024-01-15"),
  "helpfulVotes": 45,
  "notHelpfulVotes": 2,
  "sellerResponse": {
    "content": "Thank you so much for your wonderful review! We're thrilled you loved our organic basmati rice. We've noted your feedback about the packaging and are working on improving it. Looking forward to serving you again!",
    "respondedAt": ISODate("2024-01-22T10:00:00Z"),
    "respondedBy": ObjectId("64f1a2b3c4d5e6f7a8b9c0d1")
  },
  "status": "approved",
  "moderation": {
    "reviewedAt": ISODate("2024-01-20T14:00:00Z")
  },
  "isAnonymous": false,
  "createdAt": ISODate("2024-01-20T09:30:00Z")
}
\`\`\`

---

## 9. Transaction Schema

### Purpose
Comprehensive payment and financial transaction records with reconciliation support.

### Schema Definition

\`\`\`javascript
// backend/models/Transaction.js

const mongoose = require('mongoose');
const crypto = require('crypto');

const TransactionSchema = new mongoose.Schema({
  // Transaction Identification
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Type & Purpose
  type: {
    type: String,
    required: true,
    enum: [
      'payment', 'refund', 'payout', 'commission',
      'subscription', 'consultation_fee', 'penalty', 'adjustment'
    ],
    index: true
  },
  purpose: {
    type: String,
    required: true,
    enum: [
      'order_payment', 'order_refund', 'seller_payout',
      'platform_commission', 'expert_consultation',
      'subscription_payment', 'wallet_recharge', 'wallet_withdrawal',
      'penalty_deduction', 'promotional_credit', 'adjustment'
    ],
    index: true
  },
  
  // Parties
  from: {
    type: {
      type: String,
      enum: ['user', 'platform', 'payment_gateway', 'bank'],
      required: true
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    accountId: String
  },
  to: {
    type: {
      type: String,
      enum: ['user', 'platform', 'payment_gateway', 'bank'],
      required: true
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    accountId: String
  },
  
  // Amount
  amount: {
    gross: {
      type: Number,
      required: true,
      min: 0
    },
    net: {
      type: Number,
      required: true,
      min: 0
    },
    fee: {
      type: Number,
      default: 0,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  
  // Fee Breakdown
  feeBreakdown: [{
    type: {
      type: String,
      enum: ['platform_fee', 'payment_gateway_fee', 'gst', 'tds', 'other']
    },
    description: String,
    amount: Number,
    percentage: Number
  }],
  
  // Related References
  references: {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    refundRequest: { type: mongoose.Schema.Types.ObjectId },
    parentTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    consultation: { type: mongoose.Schema.Types.ObjectId },
    subscription: { type: mongoose.Schema.Types.ObjectId }
  },
  
  // Payment Method
  paymentMethod: {
    type: {
      type: String,
      enum: ['upi', 'card', 'netbanking', 'wallet', 'bank_transfer', 'cod', 'platform_wallet']
    },
    provider: String, // Razorpay, PayTM, etc.
    details: {
      upiId: String,
      cardLast4: String,
      cardNetwork: String, // Visa, Mastercard
      bankName: String,
      walletName: String,
      accountNumber: { type: String, select: false }
    }
  },
  
  // Payment Gateway Details
  gateway: {
    name: String, // razorpay, paytm, cashfree
    orderId: String,
    paymentId: String,
    signature: String,
    response: {
      type: mongoose.Schema.Types.Mixed,
      select: false
    }
  },
  
  // Status
  status: {
    type: String,
    required: true,
    enum: [
      'initiated', 'pending', 'processing', 'completed',
      'failed', 'cancelled', 'refunded', 'partially_refunded',
      'on_hold', 'disputed'
    ],
    default: 'initiated',
    index: true
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    reason: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // Timestamps
  initiatedAt: { type: Date, default: Date.now },
  processedAt: Date,
  completedAt: Date,
  failedAt: Date,
  
  // Failure Details
  failure: {
    code: String,
    message: String,
    gatewayCode: String,
    retryable: Boolean
  },
  
  // Refund Details
  refund: {
    originalTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    reason: {
      type: String,
      enum: ['order_cancelled', 'product_returned', 'quality_issue', 'wrong_product', 'customer_request', 'system_error', 'other']
    },
    reasonDetail: String,
    requestedAt: Date,
    processedAt: Date,
    gatewayRefundId: String
  },
  
  // Settlement
  settlement: {
    isSettled: { type: Boolean, default: false },
    settledAt: Date,
    settlementId: String,
    bankReference: String
  },
  
  // Reconciliation
  reconciliation: {
    isReconciled: { type: Boolean, default: false },
    reconciledAt: Date,
    reconciledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    discrepancy: {
      found: Boolean,
      amount: Number,
      reason: String,
      resolved: Boolean
    }
  },
  
  // Audit
  metadata: {
    ip: String,
    userAgent: String,
    deviceId: String,
    location: String
  },
  
  // Notes
  description: String,
  internalNote: {
    type: String,
    select: false
  },
  
  // Soft Delete
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============ INDEXES ============

TransactionSchema.index({ type: 1, status: 1, createdAt: -1 });
TransactionSchema.index({ 'from.user': 1, status: 1, createdAt: -1 });
TransactionSchema.index({ 'to.user': 1, status: 1, createdAt: -1 });
TransactionSchema.index({ 'references.order': 1 });
TransactionSchema.index({ 'gateway.paymentId': 1 });
TransactionSchema.index({ 'settlement.isSettled': 1, status: 1 });
TransactionSchema.index({ createdAt: -1 });

// ============ PRE-SAVE MIDDLEWARE ============

TransactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    this.transactionId = `TXN${timestamp}${random}`.toUpperCase();
  }
  
  // Add status change to history
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
    
    // Set event timestamps
    const now = new Date();
    switch (this.status) {
      case 'processing': this.processedAt = now; break;
      case 'completed': this.completedAt = now; break;
      case 'failed': this.failedAt = now; break;
    }
  }
  
  next();
});

// ============ METHODS ============

TransactionSchema.methods.markCompleted = async function(gatewayResponse) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (gatewayResponse) {
    this.gateway.response = gatewayResponse;
  }
  return this.save();
};

TransactionSchema.methods.markFailed = async function(failure) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.failure = {
    code: failure.code,
    message: failure.message,
    gatewayCode: failure.gatewayCode,
    retryable: failure.retryable || false
  };
  return this.save();
};

TransactionSchema.methods.createRefund = async function(amount, reason, reasonDetail) {
  const RefundTransaction = mongoose.model('Transaction');
  
  const refund = new RefundTransaction({
    type: 'refund',
    purpose: 'order_refund',
    from: this.to,
    to: this.from,
    amount: {
      gross: amount,
      net: amount,
      fee: 0,
      tax: 0,
      currency: this.amount.currency
    },
    references: {
      order: this.references.order,
      parentTransaction: this._id
    },
    paymentMethod: this.paymentMethod,
    gateway: { name: this.gateway.name },
    refund: {
      originalTransaction: this._id,
      reason,
      reasonDetail,
      requestedAt: new Date()
    },
    status: 'pending'
  });
  
  return refund.save();
};

// ============ STATICS ============

TransactionSchema.statics.getUserTransactions = function(userId, options = {}) {
  const { type, status, startDate, endDate, limit = 20, page = 1 } = options;
  
  const query = {
    $or: [{ 'from.user': userId }, { 'to.user': userId }]
  };
  
  if (type) query.type = type;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

TransactionSchema.statics.getFinancialSummary = async function(userId, period = 'month') {
  let startDate;
  const now = new Date();
  
  switch (period) {
    case 'week': startDate = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
    case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
    case 'quarter': startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1); break;
    case 'year': startDate = new Date(now.getFullYear(), 0, 1); break;
    default: startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  return this.aggregate([
    {
      $match: {
        $or: [{ 'from.user': new mongoose.Types.ObjectId(userId) }, { 'to.user': new mongoose.Types.ObjectId(userId) }],
        status: 'completed',
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount.net' },
        count: { $sum: 1 }
      }
    }
  ]);
};

const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction;
\`\`\`

### Example Document

\`\`\`javascript
{
  "_id": ObjectId("64f9c0d1e2f3a4b5c6d7e8f9"),
  "transactionId": "TXNM5K8N2B3C4D5E",
  "type": "payment",
  "purpose": "order_payment",
  "from": {
    "type": "user",
    "user": ObjectId("64f1a2b3c4d5e6f7a8b9c0d3"),
    "name": "Amit Patel"
  },
  "to": {
    "type": "platform",
    "name": "GreenTrace Escrow"
  },
  "amount": {
    "gross": 8100,
    "net": 8100,
    "fee": 0,
    "tax": 0,
    "currency": "INR"
  },
  "references": {
    "order": ObjectId("64f3c4d5e6f7a8b9c0d1e2f3")
  },
  "paymentMethod": {
    "type": "upi",
    "provider": "Razorpay",
    "details": {
      "upiId": "amit@upi"
    }
  },
  "gateway": {
    "name": "razorpay",
    "orderId": "order_Nk12345678",
    "paymentId": "pay_Nk12345678",
    "signature": "sig_abcdef123456"
  },
  "status": "completed",
  "statusHistory": [
    { "status": "initiated", "timestamp": ISODate("2024-01-15T10:00:00Z") },
    { "status": "processing", "timestamp": ISODate("2024-01-15T10:01:00Z") },
    { "status": "completed", "timestamp": ISODate("2024-01-15T10:03:00Z") }
  ],
  "initiatedAt": ISODate("2024-01-15T10:00:00Z"),
  "processedAt": ISODate("2024-01-15T10:01:00Z"),
  "completedAt": ISODate("2024-01-15T10:03:00Z"),
  "settlement": {
    "isSettled": true,
    "settledAt": ISODate("2024-01-17T06:00:00Z"),
    "settlementId": "setl_xyz789"
  },
  "reconciliation": {
    "isReconciled": true,
    "reconciledAt": ISODate("2024-01-17T10:00:00Z")
  },
  "metadata": {
    "ip": "103.45.67.89",
    "userAgent": "Mozilla/5.0...",
    "location": "Mumbai, MH"
  },
  "description": "Payment for order GT240115A1B2C3",
  "createdAt": ISODate("2024-01-15T10:00:00Z")
}
\`\`\`

---

## 10. Notification Schema

### Purpose
User notifications with multi-channel delivery support and read tracking.

### Schema Definition

\`\`\`javascript
// backend/models/Notification.js

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  // Recipient
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Type & Category
  type: {
    type: String,
    required: true,
    enum: [
      'order_placed', 'order_confirmed', 'order_shipped', 'order_delivered',
      'order_cancelled', 'payment_received', 'payment_failed', 'refund_processed',
      'new_question', 'question_answered', 'answer_accepted',
      'new_review', 'review_response', 'product_approved', 'product_rejected',
      'price_alert', 'low_stock', 'new_message', 'new_follower',
      'article_published', 'system', 'promotional', 'reminder'
    ],
    index: true
  },
  category: {
    type: String,
    enum: ['orders', 'payments', 'advisory', 'products', 'prices', 'social', 'system', 'marketing'],
    index: true
  },
  
  // Content
  title: {
    type: String,
    required: true,
    maxlength: 150
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // Rich Content
  richContent: {
    image: String,
    icon: String,
    color: String
  },
  
  // Action
  action: {
    type: {
      type: String,
      enum: ['link', 'deep_link', 'button', 'none']
    },
    url: String,
    buttonText: String,
    screen: String, // For mobile deep linking
    params: mongoose.Schema.Types.Mixed
  },
  
  // Related Entity
  reference: {
    type: {
      type: String,
      enum: ['order', 'product', 'question', 'answer', 'article', 'user', 'transaction', 'review']
    },
    id: mongoose.Schema.Types.ObjectId
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    index: true
  },
  
  // Delivery Channels
  channels: {
    inApp: { type: Boolean, default: true },
    push: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false }
  },
  
  // Delivery Status per Channel
  deliveryStatus: {
    inApp: {
      sent: { type: Boolean, default: true },
      sentAt: { type: Date, default: Date.now }
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      deviceTokens: [String],
      fcmResponse: mongoose.Schema.Types.Mixed
    },
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      messageId: String,
      opened: { type: Boolean, default: false },
      openedAt: Date
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      messageId: String,
      delivered: Boolean,
      deliveredAt: Date
    }
  },
  
  // Read Status
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: Date,
  
  // Interaction
  isClicked: {
    type: Boolean,
    default: false
  },
  clickedAt: Date,
  
  // Dismissal
  isDismissed: {
    type: Boolean,
    default: false
  },
  dismissedAt: Date,
  
  // Scheduling
  scheduledFor: Date,
  expiresAt: Date,
  
  // Grouping (for notification bundling)
  groupKey: {
    type: String,
    index: true
  },
  groupPosition: Number,
  
  // Sender (for user-to-user notifications)
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Localization
  language: {
    type: String,
    default: 'en'
  },
  
  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============ INDEXES ============

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, category: 1, isRead: 1 });
NotificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ scheduledFor: 1, 'deliveryStatus.inApp.sent': 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// ============ PRE-FIND MIDDLEWARE ============

NotificationSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// ============ METHODS ============

NotificationSchema.methods.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return this;
};

NotificationSchema.methods.markAsClicked = async function() {
  this.isClicked = true;
  this.clickedAt = new Date();
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
  }
  return this.save();
};

NotificationSchema.methods.dismiss = async function() {
  this.isDismissed = true;
  this.dismissedAt = new Date();
  return this.save();
};

// ============ STATICS ============

NotificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const { category, isRead, limit = 20, page = 1 } = options;
  
  const query = { recipient: userId };
  if (category) query.category = category;
  if (typeof isRead === 'boolean') query.isRead = isRead;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

NotificationSchema.statics.getUnreadCount = function(userId, category = null) {
  const query = { recipient: userId, isRead: false };
  if (category) query.category = category;
  return this.countDocuments(query);
};

NotificationSchema.statics.markAllAsRead = function(userId, category = null) {
  const query = { recipient: userId, isRead: false };
  if (category) query.category = category;
  return this.updateMany(query, { isRead: true, readAt: new Date() });
};

NotificationSchema.statics.createBulk = async function(recipientIds, notificationData) {
  const notifications = recipientIds.map(recipientId => ({
    ...notificationData,
    recipient: recipientId
  }));
  return this.insertMany(notifications);
};

// Helper to create notifications
NotificationSchema.statics.notify = async function(recipientId, type, data) {
  const templates = {
    order_placed: {
      title: 'Order Placed Successfully',
      message: `Your order #${data.orderNumber} has been placed successfully.`,
      category: 'orders',
      action: { type: 'link', url: `/orders/${data.orderId}` }
    },
    order_shipped: {
      title: 'Order Shipped',
      message: `Your order #${data.orderNumber} has been shipped. Track your delivery.`,
      category: 'orders',
      action: { type: 'link', url: `/orders/${data.orderId}/track` }
    },
    question_answered: {
      title: 'Your Question Answered',
      message: `An expert has answered your question: "${data.questionTitle}"`,
      category: 'advisory',
      action: { type: 'link', url: `/questions/${data.questionId}` }
    },
    price_alert: {
      title: 'Price Alert',
      message: `${data.commodity} price is now ₹${data.price}/${data.unit} in ${data.market}`,
      category: 'prices',
      priority: 'high'
    }
  };
  
  const template = templates[type];
  if (!template) throw new Error(`Unknown notification type: ${type}`);
  
  return this.create({
    recipient: recipientId,
    type,
    ...template,
    reference: data.reference,
    channels: data.channels || { inApp: true }
  });
};

const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = Notification;
\`\`\`

### Example Document

\`\`\`javascript
{
  "_id": ObjectId("64fad1e2f3a4b5c6d7e8f9a0"),
  "recipient": ObjectId("64f1a2b3c4d5e6f7a8b9c0d3"),
  "type": "order_shipped",
  "category": "orders",
  "title": "Your Order Has Been Shipped!",
  "message": "Your order #GT240115A1B2C3 has been shipped and is on its way. Track your package for live updates.",
  "richContent": {
    "icon": "truck",
    "color": "#22c55e"
  },
  "action": {
    "type": "link",
    "url": "/orders/64f3c4d5e6f7a8b9c0d1e2f3/track",
    "buttonText": "Track Order"
  },
  "reference": {
    "type": "order",
    "id": ObjectId("64f3c4d5e6f7a8b9c0d1e2f3")
  },
  "priority": "normal",
  "channels": {
    "inApp": true,
    "push": true,
    "email": true,
    "sms": false
  },
  "deliveryStatus": {
    "inApp": {
      "sent": true,
      "sentAt": ISODate("2024-01-16T14:00:00Z")
    },
    "push": {
      "sent": true,
      "sentAt": ISODate("2024-01-16T14:00:05Z")
    },
    "email": {
      "sent": true,
      "sentAt": ISODate("2024-01-16T14:00:10Z"),
      "messageId": "msg_123456",
      "opened": true,
      "openedAt": ISODate("2024-01-16T14:15:00Z")
    }
  },
  "isRead": true,
  "readAt": ISODate("2024-01-16T14:10:00Z"),
  "isClicked": true,
  "clickedAt": ISODate("2024-01-16T14:10:30Z"),
  "language": "en",
  "createdAt": ISODate("2024-01-16T14:00:00Z")
}
\`\`\`

---

## 11. Supporting Schemas

### 11.1 Price Alert Schema

\`\`\`javascript
// backend/models/PriceAlert.js

const mongoose = require('mongoose');

const PriceAlertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  commodity: {
    name: { type: String, required: true },
    variety: String,
    category: String
  },
  market: {
    name: String,
    code: String,
    state: String,
    district: String
  },
  condition: {
    type: { type: String, enum: ['above', 'below', 'change'], required: true },
    value: { type: Number, required: true },
    unit: { type: String, default: 'quintal' },
    changePercentage: Number // For 'change' type
  },
  isActive: { type: Boolean, default: true },
  triggeredCount: { type: Number, default: 0 },
  lastTriggered: Date,
  maxTriggers: { type: Number, default: 10 },
  channels: {
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false }
  },
  expiresAt: Date
}, { timestamps: true });

PriceAlertSchema.index({ user: 1, isActive: 1 });
PriceAlertSchema.index({ 'commodity.name': 1, 'market.code': 1, isActive: 1 });

module.exports = mongoose.model('PriceAlert', PriceAlertSchema);
\`\`\`

### 11.2 Comment Schema

\`\`\`javascript
// backend/models/Comment.js

const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  // Target
  targetType: {
    type: String,
    required: true,
    enum: ['article', 'product', 'question']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  
  // Author
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Content
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  // Nested Comments
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  depth: { type: Number, default: 0, max: 3 },
  replyCount: { type: Number, default: 0 },
  
  // Engagement
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'hidden', 'deleted'],
    default: 'active'
  },
  
  isEdited: { type: Boolean, default: false },
  editedAt: Date
}, { timestamps: true });

CommentSchema.index({ targetType: 1, targetId: 1, status: 1, createdAt: -1 });
CommentSchema.index({ parentComment: 1 });
CommentSchema.index({ author: 1 });

module.exports = mongoose.model('Comment', CommentSchema);
\`\`\`

### 11.3 Conversation/Message Schema

\`\`\`javascript
// backend/models/Conversation.js

const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 2000 },
  attachments: [{
    type: { type: String, enum: ['image', 'document'] },
    url: String,
    name: String
  }],
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: Date
  }],
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['direct', 'order', 'inquiry'],
    default: 'direct'
  },
  reference: {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
  },
  messages: [MessageSchema],
  lastMessage: {
    content: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: Date
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

ConversationSchema.index({ participants: 1, updatedAt: -1 });
ConversationSchema.index({ 'reference.order': 1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
\`\`\`

---

## 12. Index Strategy Summary

### Performance Optimization Guidelines

| Collection | Primary Indexes | Text Search | Geospatial | TTL |
|------------|----------------|-------------|------------|-----|
| Users | email, phone, role | name, address | coordinates | - |
| Products | seller, category, status | name, description, tags | location | - |
| Orders | buyer, sellers, status | - | - | - |
| Questions | author, category, status | title, content, tags | coordinates | - |
| Answers | question, author | - | - | - |
| Articles | category, status, author | title, content, tags | - | - |
| MandiPrices | commodity, market, date | name, market | coordinates | - |
| Reviews | product, seller, status | - | - | - |
| Transactions | from/to user, status, type | - | - | - |
| Notifications | recipient, isRead, category | - | - | expiresAt |

### Index Best Practices Implemented

1. **Compound Indexes**: Created for common query patterns (e.g., `category + status + date`)
2. **Text Indexes**: Weighted text search for relevant string fields
3. **Geospatial Indexes**: 2dsphere indexes for location-based queries
4. **Sparse Indexes**: Used where appropriate for optional unique fields
5. **TTL Indexes**: For automatic expiration of notifications
6. **Partial Indexes**: Consider adding for frequently filtered subsets

### Query Optimization Tips

\`\`\`javascript
// Always use lean() for read-only operations
const products = await Product.find({ category: 'grains' }).lean();

// Use projection to limit returned fields
const users = await User.find({}, 'name email avatar').lean();

// Use cursor for large datasets
const cursor = Product.find({ status: 'active' }).cursor();
for await (const product of cursor) {
  // Process each product
}

// Use aggregation for complex queries
const stats = await Order.aggregate([
  { $match: { status: 'completed' } },
  { $group: { _id: '$seller', total: { $sum: '$pricing.total' } } }
]);
\`\`\`

---

## Database Initialization Script

\`\`\`javascript
// backend/scripts/initDatabase.js

const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
// ... import other models

async function initializeDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Create indexes
    await Promise.all([
      User.createIndexes(),
      Product.createIndexes(),
      // ... other models
    ]);
    
    console.log('Indexes created successfully');
    
    // Seed initial data if needed
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        email: 'admin@greentrace.com',
        password: 'SecureAdminPassword123!',
        firstName: 'System',
        lastName: 'Admin',
        phone: '9999999999',
        role: 'admin',
        isVerified: true,
        isEmailVerified: true
      });
      console.log('Admin user created');
    }
    
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();
\`\`\`

---

This completes the comprehensive MongoDB schema design for GreenTrace. All schemas include proper validation, indexing, methods, and statics for optimal performance and developer experience.
