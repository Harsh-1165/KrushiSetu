# GreenTrace - Technical Architecture Document

> Agricultural Marketplace Platform - Production-Ready Architecture

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Schema](#3-database-schema)
4. [API Endpoint Structure](#4-api-endpoint-structure)
5. [Frontend Component Structure](#5-frontend-component-structure)
6. [Authentication & Authorization Flow](#6-authentication--authorization-flow)
7. [Scalability Considerations](#7-scalability-considerations)
8. [Security Best Practices](#8-security-best-practices)
9. [Deployment Strategy](#9-deployment-strategy)

---

## 1. System Overview

### 1.1 Project Description

**GreenTrace** is a comprehensive agricultural marketplace platform connecting farmers, agricultural experts, and consumers. The platform facilitates direct farm-to-consumer sales, provides expert crop advisory services, delivers real-time market prices, and hosts an agricultural knowledge hub.

### 1.2 Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Frontend       | Next.js 15 (App Router), TypeScript |
| UI Components  | shadcn/ui, Tailwind CSS             |
| State Management | SWR, React Context                |
| Backend        | Next.js API Routes, Node.js         |
| Database       | MongoDB Atlas / Supabase (PostgreSQL) |
| Authentication | NextAuth.js / Supabase Auth         |
| File Storage   | Vercel Blob / Supabase Storage      |
| Real-time      | Server-Sent Events / WebSockets     |
| Payments       | Stripe                              |
| Deployment     | Vercel                              |

### 1.3 User Roles

| Role                | Description                                      |
| ------------------- | ------------------------------------------------ |
| **Farmer**          | Lists products, manages inventory, receives orders |
| **Agricultural Expert** | Provides crop advisory, answers queries, publishes articles |
| **Consumer**        | Browses marketplace, purchases products, accesses knowledge hub |
| **Admin**           | Platform management, user verification, content moderation |

---

## 2. System Architecture

### 2.1 High-Level Architecture Diagram

\`\`\`
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Web App   │  │ Mobile PWA  │  │  Admin      │  │  Expert     │        │
│  │  (Next.js)  │  │  (Next.js)  │  │  Dashboard  │  │  Portal     │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
└─────────┼────────────────┼────────────────┼────────────────┼────────────────┘
          │                │                │                │
          └────────────────┴────────────────┴────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER (Next.js)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         API Routes (/api/*)                           │   │
│  ├──────────┬──────────┬──────────┬──────────┬──────────┬───────────────┤   │
│  │   Auth   │ Products │  Orders  │ Advisory │  Prices  │  Knowledge    │   │
│  │  Routes  │  Routes  │  Routes  │  Routes  │  Routes  │   Routes      │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┴───────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         Middleware Layer                              │   │
│  │    [Auth Middleware] [Rate Limiting] [CORS] [Logging] [Validation]   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SERVICE LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐ │
│  │   User     │ │  Product   │ │   Order    │ │  Advisory  │ │  Price    │ │
│  │  Service   │ │  Service   │ │  Service   │ │  Service   │ │  Service  │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────���──────┘ │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│  │ Knowledge  │ │  Payment   │ │Notification│ │   Media    │               │
│  │  Service   │ │  Service   │ │  Service   │ │  Service   │               │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DATA LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │    Supabase     │  │  Vercel Blob    │  │    Upstash      │             │
│  │   PostgreSQL    │  │  (File Store)   │  │    (Redis)      │             │
│  │   + Auth        │  │                 │  │   (Caching)     │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│  │   Stripe   │ │   Email    │ │  SMS/Push  │ │  Weather   │               │
│  │  Payments  │ │  (Resend)  │ │   (Twilio) │ │    API     │               │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
\`\`\`

### 2.2 Data Flow Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────────────┐
│                         REQUEST FLOW                                 │
└─────────────────────────────────────────────────────────────────────┘

  User Action          API Layer              Service Layer         Database
      │                    │                       │                    │
      │  1. HTTP Request   │                       │                    │
      │───────────────────>│                       │                    │
      │                    │  2. Validate/Auth     │                    │
      │                    │───────────────────────>                    │
      │                    │                       │  3. Query/Mutate   │
      │                    │                       │───────────────────>│
      │                    │                       │                    │
      │                    │                       │  4. Result         │
      │                    │                       │<───────────────────│
      │                    │  5. Transform         │                    │
      │                    │<──────────────────────│                    │
      │  6. JSON Response  │                       │                    │
      │<───────────────────│                       │                    │
      │                    │                       │                    │
\`\`\`

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

\`\`\`
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│      USERS       │       │     PROFILES     │       │    ADDRESSES     │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │───1:1─│ id (PK)          │───1:N─│ id (PK)          │
│ email            │       │ user_id (FK)     │       │ profile_id (FK)  │
│ password_hash    │       │ role             │       │ street           │
│ email_verified   │       │ full_name        │       │ city             │
│ created_at       │       │ phone            │       │ state            │
│ updated_at       │       │ avatar_url       │       │ pincode          │
└──────────────────┘       │ bio              │       │ is_default       │
                           │ verified         │       │ coordinates      │
                           └──────────────────┘       └──────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
           ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
           │    FARMER    │ │    EXPERT    │ │   CONSUMER   │
           │   PROFILE    │ │   PROFILE    │ │   PROFILE    │
           ├──────────────┤ ├──────────────┤ ├──────────────┤
           │ farm_name    │ │ specialization│ │ preferences  │
           │ farm_size    │ │ experience   │ │ saved_items  │
           │ crops        │ │ certifications│ │              │
           │ location     │ │ rating       │ │              │
           └──────────────┘ └──────────────┘ └──────────────┘
                    │               │
                    ▼               ▼
           ┌──────────────┐ ┌──────────────┐
           │   PRODUCTS   │ │  ARTICLES    │
           ├──────────────┤ ├──────────────┤
           │ id (PK)      │ │ id (PK)      │
           │ farmer_id    │ │ expert_id    │
           │ name         │ │ title        │
           │ category     │ │ content      │
           │ price        │ │ tags         │
           │ quantity     │ │ views        │
           │ unit         │ │ status       │
           │ images       │ └──────────────┘
           │ organic      │
           │ harvest_date │        ┌──────────────┐
           │ status       │        │  ADVISORY    │
           └──────────────┘        │  SESSIONS    │
                    │              ├──────────────┤
                    ▼              │ id (PK)      │
           ┌──────────────┐        │ expert_id    │
           │    ORDERS    │        │ farmer_id    │
           ├──────────────┤        │ topic        │
           │ id (PK)      │        │ status       │
           │ consumer_id  │        │ scheduled_at │
           │ status       │        │ notes        │
           │ total_amount │        └──────────────┘
           │ payment_id   │
           │ address_id   │
           └──────────────┘
                    │
                    ▼
           ┌──────────────┐       ┌──────────────┐
           │ ORDER_ITEMS  │       │   REVIEWS    │
           ├──────────────┤       ├──────────────┤
           │ id (PK)      │       │ id (PK)      │
           │ order_id     │       │ product_id   │
           │ product_id   │       │ consumer_id  │
           │ quantity     │       │ rating       │
           │ price        │       │ comment      │
           │ farmer_id    │       └──────────────┘
           └──────────────┘

           ┌──────────────┐       ┌──────────────┐
           │ MARKET_PRICES│       │ CATEGORIES   │
           ├──────────────┤       ├──────────────┤
           │ id (PK)      │       │ id (PK)      │
           │ commodity    │       │ name         │
           │ market       │       │ slug         │
           │ price        │       │ parent_id    │
           │ unit         │       │ image_url    │
           │ recorded_at  │       └──────────────┘
           └──────────────┘
\`\`\`

### 3.2 Complete SQL Schema

\`\`\`sql
-- ============================================
-- GREENTRACE DATABASE SCHEMA
-- PostgreSQL / Supabase
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('farmer', 'expert', 'consumer', 'admin');
CREATE TYPE product_status AS ENUM ('draft', 'active', 'out_of_stock', 'archived');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE advisory_status AS ENUM ('requested', 'scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE article_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');

-- ============================================
-- CORE TABLES
-- ============================================

-- Users Table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'consumer',
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    bio TEXT,
    verification_status verification_status DEFAULT 'pending',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Addresses Table
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    label VARCHAR(50) DEFAULT 'Home',
    street_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Farmer Profiles (extends profiles)
CREATE TABLE farmer_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    farm_name VARCHAR(255) NOT NULL,
    farm_size_acres DECIMAL(10, 2),
    primary_crops TEXT[], -- Array of crop names
    farming_type VARCHAR(50), -- organic, conventional, mixed
    experience_years INTEGER,
    certifications JSONB DEFAULT '[]',
    bank_account_details JSONB, -- Encrypted payment info
    rating DECIMAL(3, 2) DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Profiles (extends profiles)
CREATE TABLE expert_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    specializations TEXT[] NOT NULL,
    qualifications TEXT[],
    experience_years INTEGER NOT NULL,
    certifications JSONB DEFAULT '[]',
    consultation_fee DECIMAL(10, 2),
    availability_schedule JSONB, -- Weekly availability
    rating DECIMAL(3, 2) DEFAULT 0,
    total_consultations INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MARKETPLACE TABLES
-- ============================================

-- Categories Table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmer_profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    compare_price DECIMAL(10, 2), -- Original price for discounts
    unit VARCHAR(20) NOT NULL, -- kg, quintal, dozen, piece
    min_order_quantity INTEGER DEFAULT 1,
    available_quantity INTEGER NOT NULL,
    images TEXT[] DEFAULT '{}',
    is_organic BOOLEAN DEFAULT false,
    harvest_date DATE,
    shelf_life_days INTEGER,
    storage_instructions TEXT,
    nutritional_info JSONB,
    status product_status DEFAULT 'draft',
    views_count INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Variants (for different sizes/packages)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    sku VARCHAR(50) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDER TABLES
-- ============================================

-- Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    consumer_id UUID NOT NULL REFERENCES profiles(id),
    shipping_address_id UUID NOT NULL REFERENCES addresses(id),
    subtotal DECIMAL(12, 2) NOT NULL,
    shipping_fee DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    status order_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    payment_method VARCHAR(50),
    stripe_payment_intent_id VARCHAR(255),
    notes TEXT,
    cancelled_reason TEXT,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    farmer_id UUID NOT NULL REFERENCES farmer_profiles(id),
    variant_id UUID REFERENCES product_variants(id),
    product_name VARCHAR(255) NOT NULL, -- Snapshot
    product_image TEXT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status order_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Status History
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status order_status NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REVIEW & RATING TABLES
-- ============================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    consumer_id UUID NOT NULL REFERENCES profiles(id),
    order_item_id UUID REFERENCES order_items(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    images TEXT[] DEFAULT '{}',
    is_verified_purchase BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, consumer_id, order_item_id)
);

-- ============================================
-- ADVISORY & CONSULTATION TABLES
-- ============================================

CREATE TABLE advisory_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expert_id UUID NOT NULL REFERENCES expert_profiles(id),
    farmer_id UUID NOT NULL REFERENCES farmer_profiles(id),
    topic VARCHAR(255) NOT NULL,
    description TEXT,
    crop_type VARCHAR(100),
    status advisory_status DEFAULT 'requested',
    scheduled_at TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 30,
    meeting_link TEXT,
    fee DECIMAL(10, 2),
    payment_status payment_status DEFAULT 'pending',
    expert_notes TEXT,
    farmer_feedback TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Advisory Messages (Chat)
CREATE TABLE advisory_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES advisory_sessions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id),
    message TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- KNOWLEDGE HUB TABLES
-- ============================================

CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expert_id UUID NOT NULL REFERENCES expert_profiles(id),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image TEXT,
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    status article_status DEFAULT 'draft',
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    reading_time_minutes INTEGER,
    meta_title VARCHAR(255),
    meta_description TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article Comments
CREATE TABLE article_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    parent_id UUID REFERENCES article_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article Likes
CREATE TABLE article_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, user_id)
);

-- ============================================
-- MARKET PRICES TABLE
-- ============================================

CREATE TABLE market_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commodity VARCHAR(100) NOT NULL,
    variety VARCHAR(100),
    market_name VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    min_price DECIMAL(10, 2),
    max_price DECIMAL(10, 2),
    modal_price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'quintal',
    price_date DATE NOT NULL,
    source VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(commodity, market_name, price_date)
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WISHLIST & CART TABLES
-- ============================================

CREATE TABLE wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id, variant_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Products
CREATE INDEX idx_products_farmer ON products(farmer_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_search ON products USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Orders
CREATE INDEX idx_orders_consumer ON orders(consumer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_farmer ON order_items(farmer_id);

-- Market Prices
CREATE INDEX idx_market_prices_commodity ON market_prices(commodity);
CREATE INDEX idx_market_prices_date ON market_prices(price_date DESC);
CREATE INDEX idx_market_prices_state ON market_prices(state);

-- Articles
CREATE INDEX idx_articles_expert ON articles(expert_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_search ON articles USING GIN(to_tsvector('english', title || ' ' || COALESCE(content, '')));

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
\`\`\`

---

## 4. API Endpoint Structure

### 4.1 API Overview

Base URL: `/api/v1`

| Module         | Base Path        | Description                    |
| -------------- | ---------------- | ------------------------------ |
| Authentication | `/auth`          | User authentication & sessions |
| Users          | `/users`         | User profile management        |
| Products       | `/products`      | Product CRUD & search          |
| Orders         | `/orders`        | Order management               |
| Cart           | `/cart`          | Shopping cart operations       |
| Advisory       | `/advisory`      | Expert consultations           |
| Articles       | `/articles`      | Knowledge hub content          |
| Prices         | `/prices`        | Market price data              |
| Categories     | `/categories`    | Product categories             |
| Reviews        | `/reviews`       | Product reviews                |
| Notifications  | `/notifications` | User notifications             |
| Payments       | `/payments`      | Stripe payment processing      |
| Upload         | `/upload`        | File uploads                   |

### 4.2 Detailed API Endpoints

#### Authentication APIs

\`\`\`
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - User login
POST   /api/auth/logout            - User logout
POST   /api/auth/refresh           - Refresh access token
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password    - Reset password with token
POST   /api/auth/verify-email      - Verify email address
GET    /api/auth/session           - Get current session
\`\`\`

#### User APIs

\`\`\`
GET    /api/users/me               - Get current user profile
PUT    /api/users/me               - Update current user profile
DELETE /api/users/me               - Delete account
GET    /api/users/me/addresses     - Get user addresses
POST   /api/users/me/addresses     - Add new address
PUT    /api/users/me/addresses/:id - Update address
DELETE /api/users/me/addresses/:id - Delete address

# Farmer specific
GET    /api/users/farmer/dashboard     - Farmer dashboard stats
PUT    /api/users/farmer/profile       - Update farmer profile
GET    /api/users/farmer/orders        - Get farmer's received orders
GET    /api/users/farmer/products      - Get farmer's products
GET    /api/users/farmer/earnings      - Get earnings summary

# Expert specific
GET    /api/users/expert/dashboard     - Expert dashboard stats
PUT    /api/users/expert/profile       - Update expert profile
GET    /api/users/expert/sessions      - Get expert's advisory sessions
GET    /api/users/expert/articles      - Get expert's articles
\`\`\`

#### Product APIs

\`\`\`
GET    /api/products               - List products (paginated, filtered)
GET    /api/products/:slug         - Get product details
POST   /api/products               - Create product (Farmer)
PUT    /api/products/:id           - Update product (Farmer)
DELETE /api/products/:id           - Delete product (Farmer)
GET    /api/products/:id/reviews   - Get product reviews
POST   /api/products/:id/reviews   - Add product review (Consumer)
GET    /api/products/featured      - Get featured products
GET    /api/products/trending      - Get trending products
GET    /api/products/search        - Search products
\`\`\`

#### Order APIs

\`\`\`
GET    /api/orders                 - List user's orders
GET    /api/orders/:id             - Get order details
POST   /api/orders                 - Create new order
PUT    /api/orders/:id/status      - Update order status (Farmer/Admin)
POST   /api/orders/:id/cancel      - Cancel order
GET    /api/orders/:id/track       - Track order status
GET    /api/orders/:id/invoice     - Generate invoice PDF
\`\`\`

#### Cart APIs

\`\`\`
GET    /api/cart                   - Get cart items
POST   /api/cart                   - Add item to cart
PUT    /api/cart/:itemId           - Update cart item quantity
DELETE /api/cart/:itemId           - Remove item from cart
DELETE /api/cart                   - Clear cart
POST   /api/cart/checkout          - Initiate checkout
\`\`\`

#### Advisory APIs

\`\`\`
GET    /api/advisory/experts       - List available experts
GET    /api/advisory/experts/:id   - Get expert details
POST   /api/advisory/sessions      - Request advisory session
GET    /api/advisory/sessions      - List user's sessions
GET    /api/advisory/sessions/:id  - Get session details
PUT    /api/advisory/sessions/:id  - Update session (reschedule/cancel)
POST   /api/advisory/sessions/:id/complete - Complete session
GET    /api/advisory/sessions/:id/messages - Get session messages
POST   /api/advisory/sessions/:id/messages - Send message
\`\`\`

#### Article APIs (Knowledge Hub)

\`\`\`
GET    /api/articles               - List published articles
GET    /api/articles/:slug         - Get article details
POST   /api/articles               - Create article (Expert)
PUT    /api/articles/:id           - Update article (Expert)
DELETE /api/articles/:id           - Delete article (Expert)
POST   /api/articles/:id/like      - Like article
DELETE /api/articles/:id/like      - Unlike article
GET    /api/articles/:id/comments  - Get article comments
POST   /api/articles/:id/comments  - Add comment
\`\`\`

#### Market Prices APIs

\`\`\`
GET    /api/prices                 - Get latest market prices
GET    /api/prices/:commodity      - Get prices for specific commodity
GET    /api/prices/trends          - Get price trends
GET    /api/prices/compare         - Compare prices across markets
GET    /api/prices/alerts          - Get user's price alerts
POST   /api/prices/alerts          - Create price alert
DELETE /api/prices/alerts/:id      - Delete price alert
\`\`\`

#### Category APIs

\`\`\`
GET    /api/categories             - List all categories
GET    /api/categories/:slug       - Get category with products
GET    /api/categories/tree        - Get category tree structure
\`\`\`

#### Payment APIs

\`\`\`
POST   /api/payments/create-intent     - Create Stripe payment intent
POST   /api/payments/confirm           - Confirm payment
POST   /api/payments/webhook           - Stripe webhook handler
GET    /api/payments/history           - Get payment history
POST   /api/payments/refund            - Request refund
\`\`\`

#### Notification APIs

\`\`\`
GET    /api/notifications          - Get user notifications
PUT    /api/notifications/:id/read - Mark as read
PUT    /api/notifications/read-all - Mark all as read
DELETE /api/notifications/:id      - Delete notification
GET    /api/notifications/settings - Get notification preferences
PUT    /api/notifications/settings - Update preferences
\`\`\`

#### Upload APIs

\`\`\`
POST   /api/upload/image           - Upload single image
POST   /api/upload/images          - Upload multiple images
DELETE /api/upload/:key            - Delete uploaded file
\`\`\`

### 4.3 API Response Format

#### Success Response

\`\`\`json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
\`\`\`

#### Error Response

\`\`\`json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
\`\`\`

---

## 5. Frontend Component Structure

### 5.1 Directory Structure

\`\`\`
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── forgot-password/
│   │   └── page.tsx
│   └── layout.tsx
│
├── (main)/
│   ├── page.tsx                    # Homepage
│   ├── products/
│   │   ├── page.tsx                # Product listing
│   │   └── [slug]/
│   │       └── page.tsx            # Product details
│   ├── categories/
│   │   └── [slug]/
│   │       └── page.tsx
│   ├── cart/
│   │   └── page.tsx
│   ├── checkout/
│   │   └── page.tsx
│   ├── knowledge-hub/
│   │   ├── page.tsx                # Articles listing
│   │   └── [slug]/
│   │       └── page.tsx            # Article details
│   ├── market-prices/
│   │   └── page.tsx
│   ├── experts/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   └── layout.tsx
│
├── (dashboard)/
│   ├── dashboard/
│   │   └── page.tsx                # Role-based redirect
│   │
│   ├── farmer/
│   │   ├── page.tsx                # Farmer dashboard
│   │   ├── products/
│   │   │   ├── page.tsx            # My products
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx
│   │   ├── orders/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── advisory/
│   │   │   └── page.tsx
│   │   ├── earnings/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── expert/
│   │   ├── page.tsx                # Expert dashboard
│   │   ├── sessions/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── articles/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── consumer/
│   │   ├── page.tsx                # Consumer dashboard
│   │   ├── orders/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── wishlist/
│   │   │   └── page.tsx
│   │   ├── addresses/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   │
│   └── layout.tsx                  # Dashboard layout with sidebar
│
├── api/
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts
│   ├── products/
│   │   ├── route.ts
│   │   └── [id]/
│   │       └── route.ts
│   ├── orders/
│   │   └── route.ts
│   ├── payments/
│   │   ├── create-intent/
│   │   │   └── route.ts
│   │   └── webhook/
│   │       └── route.ts
│   └── ...
│
├── layout.tsx
├── globals.css
├── not-found.tsx
└── error.tsx

components/
├── ui/                             # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
│
├── layout/
│   ├── header.tsx
│   ├── footer.tsx
│   ├── mobile-nav.tsx
│   ├── sidebar.tsx
│   └── dashboard-layout.tsx
│
├── auth/
│   ├── login-form.tsx
│   ├── register-form.tsx
│   ├── role-selector.tsx
│   └── social-auth-buttons.tsx
│
├── products/
│   ├── product-card.tsx
│   ├── product-grid.tsx
│   ├── product-filters.tsx
│   ├── product-sort.tsx
│   ├── product-gallery.tsx
│   ├── product-info.tsx
│   ├── product-reviews.tsx
│   ├── add-to-cart-button.tsx
│   └── product-form.tsx
│
├── cart/
│   ├── cart-item.tsx
│   ├── cart-summary.tsx
│   ├── cart-drawer.tsx
│   └── empty-cart.tsx
│
├── checkout/
│   ├── checkout-form.tsx
│   ├── address-selector.tsx
│   ├── payment-form.tsx
│   └── order-summary.tsx
│
├── orders/
│   ├── order-card.tsx
│   ├── order-details.tsx
│   ├── order-timeline.tsx
│   └── order-status-badge.tsx
│
├── advisory/
│   ├── expert-card.tsx
│   ├── expert-profile.tsx
│   ├── session-card.tsx
│   ├── session-scheduler.tsx
│   ├── chat-interface.tsx
│   └── booking-form.tsx
│
├── knowledge-hub/
│   ├── article-card.tsx
│   ├── article-content.tsx
│   ├── article-comments.tsx
│   ├── article-editor.tsx
│   └── category-tabs.tsx
│
├── market-prices/
│   ├── price-table.tsx
│   ├── price-chart.tsx
│   ├── price-comparison.tsx
│   ├── price-alert-form.tsx
│   └── commodity-selector.tsx
│
├── dashboard/
│   ├── stats-card.tsx
│   ├── recent-orders.tsx
│   ├── sales-chart.tsx
│   ├── activity-feed.tsx
│   └── quick-actions.tsx
│
├── forms/
│   ├── farmer-onboarding-form.tsx
│   ├── expert-onboarding-form.tsx
│   ├── address-form.tsx
│   └── profile-form.tsx
│
└── shared/
    ├── search-bar.tsx
    ├── pagination.tsx
    ├── loading-spinner.tsx
    ├── empty-state.tsx
    ├── image-upload.tsx
    ├── rating-stars.tsx
    ├── price-display.tsx
    ├── notification-bell.tsx
    └── breadcrumbs.tsx

lib/
├── supabase/
│   ├── client.ts                   # Browser client
│   ├── server.ts                   # Server client
│   └── middleware.ts               # Auth middleware
├── api/
│   ├── products.ts
│   ├── orders.ts
│   ├── auth.ts
│   └── ...
├── utils/
│   ├── cn.ts                       # Class name utility
│   ├── format.ts                   # Formatting utilities
│   ├── validation.ts               # Zod schemas
│   └── constants.ts
├── hooks/
│   ├── use-auth.ts
│   ├── use-cart.ts
│   ├── use-wishlist.ts
│   └── use-notifications.ts
└── types/
    ├── database.ts                 # Supabase generated types
    ├── api.ts
    └── index.ts
\`\`\`

### 5.2 Key Component Descriptions

| Component                | Purpose                                           |
| ------------------------ | ------------------------------------------------- |
| `Header`                 | Main navigation with search, cart, user menu      |
| `DashboardLayout`        | Role-based sidebar navigation for dashboards      |
| `ProductCard`            | Displays product thumbnail, price, add to cart    |
| `ProductFilters`         | Category, price range, organic filter controls    |
| `CartDrawer`             | Slide-out cart preview with quick checkout        |
| `CheckoutForm`           | Multi-step checkout with address & payment        |
| `OrderTimeline`          | Visual order status tracking                      |
| `ExpertCard`             | Expert profile card with booking button           |
| `SessionScheduler`       | Calendar-based session booking component          |
| `ChatInterface`          | Real-time messaging for advisory sessions         |
| `ArticleEditor`          | Rich text editor for knowledge hub articles       |
| `PriceChart`             | Interactive chart showing price trends            |
| `StatsCard`              | Dashboard metric display with trends              |

---

## 6. Authentication & Authorization Flow

### 6.1 Authentication Flow Diagram

\`\`\`
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│   User     │     │  Frontend  │     │  Supabase  │     │  Database  │
│            │     │  (Next.js) │     │    Auth    │     │            │
└─────┬──────┘     └─────┬──────┘     └─────┬──────┘     └─────┬──────┘
      │                  │                  │                  │
      │  1. Register     │                  │                  │
      │─────────────────>│                  │                  │
      │                  │  2. signUp()     │                  │
      │                  │─────────────────>│                  │
      │                  │                  │  3. Create User  │
      │                  ��                  │─────────────────>│
      │                  │                  │                  │
      │                  │                  │  4. Trigger      │
      │                  │                  │  (create profile)│
      │                  │                  │─────────────────>│
      │                  │                  │                  │
      │                  │  5. Session +    │                  │
      │                  │     Tokens       │                  │
      │                  │<─────────────────│                  │
      │  6. Redirect     │                  │                  │
      │<─────────────────│                  │                  │
      │                  │                  │                  │
      │  7. Protected    │                  │                  │
      │     Request      │                  │                  │
      │─────────────────>│                  │                  │
      │                  │  8. Verify Token │                  │
      │                  │─────────────────>│                  │
      │                  │                  │                  │
      │                  │  9. User Data    │                  │
      │                  │<─────────────────│                  │
      │                  │                  │                  │
      │                  │  10. Fetch with  │                  │
      │                  │      user_id     │                  │
      │                  │─────────────────────────────────────>│
      │  11. Response    │                  │                  │
      │<─────────────────│                  │                  │
\`\`\`

### 6.2 Role-Based Access Control (RBAC)

\`\`\`typescript
// lib/types/auth.ts
export type UserRole = 'farmer' | 'expert' | 'consumer' | 'admin';

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  farmer: [
    { resource: 'products', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'orders', actions: ['read', 'update'] },
    { resource: 'advisory', actions: ['read', 'update'] },
    { resource: 'earnings', actions: ['read'] },
  ],
  expert: [
    { resource: 'articles', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'advisory', actions: ['read', 'update'] },
    { resource: 'consultations', actions: ['create', 'read', 'update'] },
  ],
  consumer: [
    { resource: 'products', actions: ['read'] },
    { resource: 'orders', actions: ['create', 'read'] },
    { resource: 'reviews', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'wishlist', actions: ['create', 'read', 'delete'] },
    { resource: 'cart', actions: ['create', 'read', 'update', 'delete'] },
  ],
  admin: [
    { resource: '*', actions: ['create', 'read', 'update', 'delete'] },
  ],
};
\`\`\`

### 6.3 Protected Route Middleware

\`\`\`typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const protectedRoutes = ['/dashboard', '/farmer', '/expert', '/consumer']
const authRoutes = ['/login', '/register']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Redirect to login if accessing protected route without auth
  if (protectedRoutes.some(route => path.startsWith(route)) && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect to dashboard if accessing auth routes while logged in
  if (authRoutes.some(route => path.startsWith(route)) && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
\`\`\`

### 6.4 Row Level Security (RLS) Policies

\`\`\`sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, update own
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Products: Anyone can read active, farmers manage own
CREATE POLICY "Anyone can view active products"
ON products FOR SELECT USING (status = 'active');

CREATE POLICY "Farmers can insert own products"
ON products FOR INSERT WITH CHECK (
  farmer_id = auth.uid() AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'farmer')
);

CREATE POLICY "Farmers can update own products"
ON products FOR UPDATE USING (farmer_id = auth.uid());

CREATE POLICY "Farmers can delete own products"
ON products FOR DELETE USING (farmer_id = auth.uid());

-- Orders: Consumers see own orders, farmers see orders containing their products
CREATE POLICY "Consumers can view own orders"
ON orders FOR SELECT USING (consumer_id = auth.uid());

CREATE POLICY "Consumers can create orders"
ON orders FOR INSERT WITH CHECK (consumer_id = auth.uid());

CREATE POLICY "Farmers can view orders with their items"
ON order_items FOR SELECT USING (farmer_id = auth.uid());
\`\`\`

---

## 7. Scalability Considerations

### 7.1 Architecture Patterns

\`\`\`
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SCALABLE ARCHITECTURE                                │
└─────────────────────────────────────────────────────────────────────────────┘

                           ┌─────────────────┐
                           │   Vercel Edge   │
                           │    Network      │
                           │   (Global CDN)  │
                           └────────┬────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │  Static   │   │   ISR     │   │  Dynamic  │
            │  Assets   │   │   Pages   │   │   APIs    │
            │  (Cache)  │   │ (Revalid) │   │(Serverless│
            └───────────┘   └───────────┘   └───────────┘
                                                  │
                    ┌─────────────────────────────┼──────────────────────┐
                    │                             │                      │
                    ▼                             ▼                      ▼
            ┌───────────────┐            ┌───────────────┐       ┌─────────────┐
            │   Supabase    │            │    Upstash    │       │   Vercel    │
            │   PostgreSQL  │            │    Redis      │       │    Blob     │
            │   (Primary)   │            │   (Cache)     │       │  (Storage)  │
            └───────────────┘            └───────────────┘       └─────────────┘
\`\`\`

### 7.2 Caching Strategy

\`\`\`typescript
// lib/cache.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Cache keys
export const CACHE_KEYS = {
  PRODUCTS_LIST: 'products:list',
  PRODUCT_DETAIL: (slug: string) => `products:${slug}`,
  CATEGORIES: 'categories:all',
  MARKET_PRICES: (commodity: string) => `prices:${commodity}`,
  USER_CART: (userId: string) => `cart:${userId}`,
}

// Cache TTLs (seconds)
export const CACHE_TTL = {
  PRODUCTS: 300,      // 5 minutes
  CATEGORIES: 3600,   // 1 hour
  PRICES: 900,        // 15 minutes
  CART: 1800,         // 30 minutes
}

// Generic cache wrapper
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  const cached = await redis.get<T>(key)
  if (cached) return cached

  const data = await fetcher()
  await redis.set(key, data, { ex: ttl })
  return data
}

// Cache invalidation
export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}
\`\`\`

### 7.3 Database Optimization

\`\`\`sql
-- Materialized view for product listings (refreshed periodically)
CREATE MATERIALIZED VIEW product_listings AS
SELECT 
  p.id,
  p.slug,
  p.name,
  p.price,
  p.images[1] as thumbnail,
  p.is_organic,
  p.rating,
  p.status,
  c.name as category_name,
  c.slug as category_slug,
  f.farm_name,
  pr.full_name as farmer_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN farmer_profiles f ON p.farmer_id = f.id
LEFT JOIN profiles pr ON f.id = pr.id
WHERE p.status = 'active';

-- Index on materialized view
CREATE INDEX idx_product_listings_category ON product_listings(category_slug);

-- Refresh function (call via cron or trigger)
CREATE OR REPLACE FUNCTION refresh_product_listings()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY product_listings;
END;
$$ LANGUAGE plpgsql;

-- Connection pooling configuration (Supabase handles this)
-- PgBouncer is enabled by default on Supabase
\`\`\`

### 7.4 Performance Optimization

| Technique            | Implementation                                    |
| -------------------- | ------------------------------------------------- |
| **Image Optimization** | Next.js Image component with Vercel optimization |
| **Code Splitting**     | Dynamic imports for heavy components             |
| **ISR**                | Incremental Static Regeneration for products     |
| **Edge Functions**     | Price updates, geolocation routing               |
| **Database Pooling**   | Supabase built-in PgBouncer                      |
| **Query Optimization** | Indexes, materialized views, pagination          |
| **CDN Caching**        | Static assets cached at edge                     |

---

## 8. Security Best Practices

### 8.1 Security Checklist

| Category              | Implementation                                      |
| --------------------- | --------------------------------------------------- |
| **Authentication**    | Supabase Auth with secure session management        |
| **Authorization**     | Row Level Security (RLS) + middleware checks        |
| **Data Validation**   | Zod schemas for all inputs                          |
| **SQL Injection**     | Parameterized queries via Supabase client           |
| **XSS Prevention**    | React's built-in escaping + CSP headers             |
| **CSRF Protection**   | SameSite cookies + token validation                 |
| **Rate Limiting**     | Upstash rate limiter on API routes                  |
| **HTTPS**             | Enforced by Vercel                                  |
| **Secrets Management**| Environment variables via Vercel                    |
| **File Upload**       | Type validation, size limits, virus scanning        |

### 8.2 Input Validation Schema

\`\`\`typescript
// lib/validations/product.ts
import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(5000).optional(),
  price: z.number().positive().max(1000000),
  unit: z.enum(['kg', 'quintal', 'dozen', 'piece', 'liter']),
  available_quantity: z.number().int().positive(),
  category_id: z.string().uuid(),
  is_organic: z.boolean().default(false),
  images: z.array(z.string().url()).max(10).optional(),
  harvest_date: z.string().datetime().optional(),
  shelf_life_days: z.number().int().positive().optional(),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed', 
    'processing', 
    'shipped', 
    'delivered', 
    'cancelled'
  ]),
  notes: z.string().max(500).optional(),
})
\`\`\`

### 8.3 Rate Limiting

\`\`\`typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Different rate limits for different endpoints
export const rateLimiters = {
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests/minute
    analytics: true,
  }),
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 auth attempts/minute
    analytics: true,
  }),
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 uploads/hour
    analytics: true,
  }),
}

// Usage in API route
export async function rateLimitMiddleware(
  request: Request,
  limiter: Ratelimit
) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success, limit, remaining } = await limiter.limit(ip)
  
  if (!success) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
      },
    })
  }
  
  return null
}
\`\`\`

### 8.4 Security Headers

\`\`\`typescript
// next.config.mjs
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; img-src 'self' blob: data: https:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  }
]

export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
\`\`\`

---

## 9. Deployment Strategy

### 9.1 Deployment Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT PIPELINE                                  │
└─────────────────────────────────────────────────────────────────────────────┘

  Developer        GitHub           Vercel          Production
      │               │               │                  │
      │  1. Push      │               │                  │
      │──────────────>│               │                  │
      │               │  2. Webhook   │                  │
      │               │──────────────>│                  │
      │               │               │  3. Build        │
      │               │               │──────────────────│
      │               │               │                  │
      │               │               │  4. Test         │
      │               │               │──────────────────│
      │               │               │                  │
      │               │               │  5. Preview      │
      │               │  6. Comment   │  Deployment      │
      │               │<──────────────│                  │
      │               │               │                  │
      │  7. Approve   │               │                  │
      │──────────────>│──────────────>│                  │
      │               │               │  8. Production   │
      │               │               │──────────────────>
      │               │               │                  │
\`\`\`

### 9.2 Environment Configuration

\`\`\`bash
# .env.local (Development)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis (Upstash)
KV_REST_API_URL=your-upstash-url
KV_REST_API_TOKEN=your-upstash-token

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# File Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN=your-blob-token

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 9.3 CI/CD Pipeline (GitHub Actions)

\`\`\`yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  deploy-preview:
    needs: lint-and-test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          github-comment: true

  deploy-production:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
\`\`\`

### 9.4 Database Migration Strategy

\`\`\`bash
# Migration files structure
scripts/
├── 001_initial_schema.sql
├── 002_add_indexes.sql
├── 003_add_rls_policies.sql
├── 004_seed_categories.sql
└── 005_seed_sample_data.sql

# Run migrations in order via Supabase Dashboard or CLI
# supabase db push
\`\`\`

### 9.5 Monitoring & Observability

| Tool                | Purpose                              |
| ------------------- | ------------------------------------ |
| **Vercel Analytics** | Performance, Web Vitals, traffic    |
| **Vercel Logs**      | Runtime logs, error tracking        |
| **Supabase Dashboard** | Database metrics, query performance |
| **Upstash Console**  | Redis metrics, rate limit stats     |
| **Sentry**           | Error tracking, performance monitoring |
| **Stripe Dashboard** | Payment analytics, disputes         |

---

## Appendix: Quick Reference

### Technology Stack Summary

| Layer          | Technology        | Purpose                    |
| -------------- | ----------------- | -------------------------- |
| Frontend       | Next.js 15        | Full-stack React framework |
| Styling        | Tailwind CSS      | Utility-first CSS          |
| Components     | shadcn/ui         | Pre-built UI components    |
| Database       | Supabase/PostgreSQL | Primary data store       |
| Auth           | Supabase Auth     | Authentication             |
| Cache          | Upstash Redis     | Caching & rate limiting    |
| Storage        | Vercel Blob       | File uploads               |
| Payments       | Stripe            | Payment processing         |
| Deployment     | Vercel            | Hosting & CI/CD            |

### Key Development Commands

\`\`\`bash
# Development
npm run dev          # Start development server

# Build & Test
npm run build        # Production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript check

# Database
npx supabase db push # Push migrations
npx supabase gen types typescript # Generate types
\`\`\`

---

*Document Version: 1.0*
*Last Updated: January 2026*
*Author: GreenTrace Development Team*
