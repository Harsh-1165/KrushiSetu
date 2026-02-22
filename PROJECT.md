# KrushiSetu — Complete Project Documentation

> **Version:** 1.0.0 | **Last Updated:** February 2026 | **Status:** MVP Complete

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Solution](#3-solution)
4. [Target Users](#4-target-users)
5. [Features & Modules](#5-features--modules)
6. [Technical Architecture](#6-technical-architecture)
7. [Database Design](#7-database-design)
8. [API Reference Summary](#8-api-reference-summary)
9. [ML Model Details](#9-ml-model-details)
10. [System Requirements](#10-system-requirements)
11. [Security Architecture](#11-security-architecture)
12. [Business Benefits & ROI](#12-business-benefits--roi)
13. [Scalability & Future Roadmap](#13-scalability--future-roadmap)
14. [Competitive Analysis](#14-competitive-analysis)

---

## 1. Executive Summary

**KrushiSetu** is an end-to-end agricultural intelligence platform designed specifically for India's 140 million farming households. It combines AI-powered crop diagnostics, real-time commodity pricing, expert advisory networks, and a direct-to-consumer agricultural marketplace into a single unified platform.

| Key Metric | Value |
|---|---|
| Target Market | 140 million Indian farming households |
| Addressable Market | ₹6.2 Lakh Crore agricultural economy |
| MVP Completion | ~85% |
| Tech Stack Layers | 4 (Frontend, Backend, ML, Cloud) |
| API Endpoints | 14 route modules, 80+ individual endpoints |
| Database Collections | 17 MongoDB schemas |

---

## 2. Problem Statement

### The Indian Farmer's Reality

India has 140 million farming families, but **91% are small or marginal farmers** owning less than 2 hectares. They face:

#### 2.1 Market Access Problem
- Farmers sell to middlemen at 30–50% below actual market price
- No direct access to retail/wholesale buyers
- Transportation costs eat into margins
- **Annual loss: ₹92,651 crore due to market inefficiency**

#### 2.2 Crop Disease & Yield Problem
- 35% of total crop production is lost to pests and diseases annually
- Farmers in rural areas have no access to agricultural scientists
- Diagnosis requires physical experts — expensive, slow, unavailable
- **Annual loss: ₹1.5 Lakh Crore due to preventable crop damage**

#### 2.3 Information Asymmetry
- Farmers don't know real current mandi prices before harvest
- No access to weather-informed planting schedules
- Knowledge locked in academic institutions, unavailable in local languages
- Brokers exploit information gaps to manipulate prices

#### 2.4 Financial Exclusion
- 60% of farmers are unbanked or have limited digital financial access
- No secure escrow for farm produce transactions
- No credit history from farm produce sales
- Prone to payment fraud in direct sales

---

## 3. Solution

KrushiSetu addresses each pain point with a specific technical solution:

| Problem | KrushiSetu Solution |
|---|---|
| Market access | Direct marketplace with escrow-protected payments |
| Crop disease | AI image-based diagnosis in under 10 seconds |
| Price opacity | Live Agmarknet integration with price alerts |
| Knowledge gap | Expert Q&A, vetted Knowledge Hub, AI advisory |
| Financial exclusion | Escrow, transaction history, digital receipts |

### Solution Philosophy
> *"Give every Indian farmer access to the same intelligence that large agribusinesses have."*

---

## 4. Target Users

### Primary Users

#### 🌾 Farmers (Primary)
- Small & marginal farmers (< 2 hectares)
- Progressive farmers adopting technology
- Farm collectives & FPOs (Farmer Producer Organizations)
- **Pain Points:** Market access, disease detection, price discovery

#### 🔬 Agricultural Experts
- Agronomists & crop scientists
- University agriculture faculty
- Government extension officers (KVK)
- **Motivation:** Reach, reputation, and monetization of expertise

#### 🛒 Buyers (Consumer/Business)
- Urban end consumers seeking fresh farm produce
- Restaurant chains & food processing companies
- Organic produce enthusiasts
- Export aggregators

### Secondary Users
- Government agriculture departments (data insights)
- NGOs working in rural development
- Agricultural input companies (seeds, fertilizers)

---

## 5. Features & Modules

### Module 1: Authentication & User Management
| Feature | Description |
|---|---|
| Multi-role signup | Farmer / Expert / Consumer role selection |
| JWT + Refresh tokens | Secure stateless authentication |
| Email verification | OTP-based account verification |
| Password reset | Secure token-based password recovery |
| Profile management | Role-specific profile with KYC upload support |

### Module 2: AI Crop & Soil Advisory
| Feature | Description |
|---|---|
| Image upload | Drag & drop or camera capture |
| Disease detection | Custom-trained CNN models (TensorFlow) |
| Soil analysis | Soil quality prediction with recommendations |
| Gemini AI chat | Natural language Q&A with agricultural AI |
| Treatment plan | Specific disease treatment with dosage and cost estimate |
| History tracking | Past diagnoses stored per user |

### Module 3: Live Mandi Price Intelligence
| Feature | Description |
|---|---|
| Real-time prices | Live integration with Agmarknet government API |
| Price charts | Historical trend visualization (Recharts) |
| Price alerts | Set target price — get notified via SMS/Email/Push |
| Multi-mandi comparison | Compare prices across different mandis |
| Price predictions | ML-based short-term price forecasting |
| CSV export | Download price data for offline analysis |

### Module 4: Agricultural Marketplace
| Feature | Description |
|---|---|
| Product listings | Create rich listings with images, location, pricing |
| Discovery | Search, filter, sort with full-text search engine |
| Geospatial search | Find products within radius using GPS coordinates |
| Cart & Checkout | Multi-item cart with address and payment selection |
| Escrow protection | Buyer funds held until delivery confirmed |
| Order tracking | Real-time order status with notifications |
| Reviews & Ratings | Verified purchase reviews for sellers |

### Module 5: Expert Q&A Network
| Feature | Description |
|---|---|
| Post questions | Farmers post questions with category & tags |
| Expert answers | Verified experts answer with markdown support |
| Voting system | Community votes on best answers |
| Accepted answers | Question asker marks best answer |
| Expert profiles | Ratings, specializations, answer history |
| Expert discovery | Search experts by specialization & location |

### Module 6: Knowledge Hub
| Feature | Description |
|---|---|
| Article publishing | Experts write rich-text articles with media |
| Categories | Organized by crop type, region, topic |
| Reading progress | Track reading progress per article |
| Bookmarks | Save articles for later |
| Author profiles | See all articles by a specific expert |
| Write interface | Full-featured article editor |

### Module 7: Notifications & Alerts
| Feature | Description |
|---|---|
| In-app notifications | Real-time notification center |
| Email notifications | Transactional emails via Nodemailer |
| SMS alerts | Twilio-powered SMS for price alerts |
| Push notifications | Firebase FCM for mobile-style push |
| Price alerts | Custom threshold-based commodity alerts |

### Module 8: Analytics Dashboard
| Feature | Description |
|---|---|
| Sales analytics | Revenue, orders, top products |
| Market activity | Price movement trends |
| Q&A stats | Expert performance metrics |
| Search trends | Popular search terms |
| User activity | Login patterns & feature usage |

---

## 6. Technical Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│  Next.js 16 (App Router) + TypeScript + Tailwind CSS               │
│  SWR (Data Fetching) + Framer Motion (Animations) + Recharts       │
└────────────────────────────┬───────────────────────────────────────┘
                             │ HTTPS REST
┌────────────────────────────▼───────────────────────────────────────┐
│                        API GATEWAY                                   │
│  Express.js + Helmet + CORS + Rate Limiter + JWT Auth               │
│  14 Route Modules | 80+ Endpoints                                   │
└──────┬─────────────────┬──────────────────┬────────────────────────┘
       │                 │                  │
┌──────▼──────┐  ┌───────▼──────┐  ┌───────▼──────────────────────┐
│  MongoDB    │  │   Cloudinary  │  │    External Services          │
│  Atlas      │  │   (Media)     │  │  • Agmarknet API (Prices)    │
│  17 schemas │  │               │  │  • Gemini AI (Advisory)      │
└─────────────┘  └──────────────┘  │  • Twilio (SMS)              │
                                   │  • Firebase (Push)            │
┌──────────────────────────────┐   │  • Nodemailer (Email)        │
│       ML ENGINE (Python)     │   └──────────────────────────────┘
│  TensorFlow + Scikit-learn   │
│  Crop Disease Detection      │
│  Soil Quality Analysis       │
└──────────────────────────────┘
```

### Frontend Architecture
- **Framework:** Next.js 16 with App Router (file-based routing)
- **Rendering:** SSR for SEO pages, CSR for dashboard interactions
- **State:** SWR for API cache + local component state
- **Styling:** Tailwind CSS + Radix UI primitives
- **Animations:** Framer Motion for micro-interactions

### Backend Architecture
- **Pattern:** RESTful API with MVC structure
- **Auth:** JWT access tokens + refresh token rotation
- **Error handling:** Centralized AppError class + asyncHandler wrapper
- **Logging:** Winston structured logging
- **Resilience:** Circuit breaker pattern for external API calls

---

## 7. Database Design

### Collections Overview

| Collection | Purpose | Key Fields |
|---|---|---|
| `users` | All user accounts across roles | role, expertProfile, farmerProfile, address |
| `products` | Marketplace listings | seller, pricing, inventory, location, organic |
| `orders` | Purchase transactions | buyer, items, status, payment, delivery |
| `cart` | Shopping cart state | user, items, totals |
| `questions` | Farmer Q&A posts | author, category, tags, answerCount, status |
| `answers` | Expert answers | question, author, content, votes, isAccepted |
| `articles` | Knowledge Hub content | author, content, category, tags, readTime |
| `comments` | Article discussion | article, author, content, likes |
| `mandis` | Mandi master data | name, state, district, coordinates |
| `mandiprices` | Live price data | mandi, crop, modalPrice, date, trend |
| `pricealerts` | User price subscriptions | user, crop, mandi, targetPrice, condition |
| `cropadvisories` | AI diagnosis history | user, imageUrl, diagnosis, treatment |
| `notifications` | In-app notifications | user, type, title, isRead, relatedId |
| `reviews` | Product reviews | product, buyer, rating, comment, verified |
| `aifeedback` | AI response quality | user, query, rating, comments |
| `searchhistory` | User search log | user, query, count, lastSearchedAt |
| `tokens` | Auth refresh tokens | user, token, expiresAt |

---

## 8. API Reference Summary

| Module | Base Path | Key Endpoints |
|---|---|---|
| Auth | `/api/v1/auth` | register, login, logout, refresh, verify-email, forgot-password |
| Users | `/api/v1/users` | profile, update, upload-avatar, follow, notifications |
| Products | `/api/v1/products` | CRUD, search, by-seller, nearby |
| Orders | `/api/v1/orders` | create, track, update-status, cancel |
| Cart | `/api/v1/cart` | get, add-item, remove-item, clear |
| Mandi | `/api/v1/mandi` | prices, list, trends, alerts, predictions |
| Search | `/api/v1/search` | unified, products, experts, articles |
| Advisory | `/api/v1/advisory` | analyze-crop, analyze-soil, history |
| Articles | `/api/v1/articles` | CRUD, by-author, by-category, trending |
| Expert | `/api/v1/expert` | profile, stats, top-experts |
| Analytics | `/api/v1/analytics` | dashboard-stats, sales, activity |
| Uploads | `/api/v1/uploads` | image upload (Cloudinary) |
| Health | `/api/v1/health` | server health check |

---

## 9. ML Model Details

### Crop Disease Detection Model
| Property | Value |
|---|---|
| Framework | TensorFlow / Keras |
| Architecture | Convolutional Neural Network (CNN) |
| Input | RGB image (224×224) |
| Output | Disease class + confidence score |
| Training Dataset | PlantVillage + custom dataset |
| Accuracy | ~94% on validation set |
| Inference Time | < 2 seconds |

### Soil Quality Analysis Model  
| Property | Value |
|---|---|
| Framework | Scikit-learn |
| Algorithm | Random Forest Classifier |
| Input | Soil image |
| Output | Quality grade + nutrient recommendations |
| File Format | `.pkl` (pickled model) |

### AI Advisory (Gemini Integration)
- Google Gemini Pro API for natural language agricultural advisory
- Context-aware prompting with farm data
- Multi-turn conversation support
- Fallback to rule-based advisory on API failure

---

## 10. System Requirements

### Development Environment
| Requirement | Minimum | Recommended |
|---|---|---|
| Node.js | 18.x | 20.x LTS |
| Python | 3.8 | 3.10+ |
| MongoDB | Atlas M0 (Free) | Atlas M10+ |
| RAM | 4 GB | 8 GB |
| Storage | 2 GB | 5 GB |

### Production Environment
| Service | Recommended |
|---|---|
| Frontend Hosting | Vercel (free tier works) |
| Backend Hosting | Railway / Render / AWS EC2 |
| Database | MongoDB Atlas M10 (3GB RAM) |
| Media Storage | Cloudinary (25GB free) |
| ML Inference | Backend Node.js spawns Python subprocess |

### Required API Keys
- MongoDB Atlas connection URI
- Google Gemini API key
- Cloudinary credentials
- Gmail App Password (for emails)
- Twilio Account SID + Token (for SMS)
- Firebase service account (for push notifications)

---

## 11. Security Architecture

### Authentication Security
- JWT access token: 15 min expiry
- Refresh token: 7 days, HTTP-only cookie
- Token rotation on every refresh
- Bcrypt password hashing (salt rounds: 12)

### API Security
- Helmet.js for 11 security headers
- Rate limiting: 1000 req/15min (general), 50 req/15min (auth)
- CORS whitelist configuration
- HPP (HTTP Parameter Pollution) protection
- XSS filtering on all text inputs
- NoSQL injection sanitization (`express-mongo-sanitize`)
- Input validation on all routes (`express-validator`)

### File Upload Security
- File type whitelist (JPEG, PNG, WebP only)
- Max file size: 5MB
- Virus scanning ready (ClamAV integration point)
- Cloudinary secure URLs

---

## 12. Business Benefits & ROI

### For Farmers
| Benefit | Estimated Impact |
|---|---|
| Better mandi price discovery | +15–25% higher sale price |
| Early disease detection | -35% crop loss |
| Direct buyer access | Eliminate 2–3 middlemen |
| AI advisory access | Previously ₹500–2000/consultation → Free |

### For Agricultural Experts
| Benefit | Description |
|---|---|
| National reach | Access farmers across India, not just local |
| Reputation building | Public profile, ratings, follower count |
| Knowledge monetization | Premium advisory potential |

### For Buyers/Consumers
| Benefit | Description |
|---|---|
| Farm-fresh produce | Direct sourcing, fresher product |
| Price transparency | No markup by multiple intermediaries |
| Traceability | Know exactly where food comes from |
| Organic verification | Certified organic badges on listings |

### For the Ecosystem
- Reduces agricultural wastage
- Enables data-driven crop planning
- Supports government digital agriculture initiatives (PM-KISHAN, e-NAM)
- Creates formal digital transaction records for credit access

---

## 13. Scalability & Future Roadmap

### Phase 1 — Current MVP ✅
- Core auth & user management
- AI crop/soil diagnosis
- Live mandi prices
- Marketplace with cart & orders
- Expert Q&A
- Knowledge Hub

### Phase 2 — Q2 2026
- [ ] Razorpay payment gateway integration
- [ ] Admin dashboard for platform management
- [ ] Mobile app (React Native)
- [ ] Multi-language support (Hindi, Marathi, Telugu, Tamil)
- [ ] Offline mode (PWA)

### Phase 3 — Q3 2026
- [ ] Weather-based crop planner
- [ ] FPO (Farmer Producer Organization) bulk listing
- [ ] Drone & IoT sensor integration
- [ ] Blockchain-based supply chain tracking
- [ ] Government scheme eligibility checker

### Phase 4 — Q4 2026
- [ ] B2B wholesale marketplace
- [ ] Credit scoring via transaction history
- [ ] Insurance integration (crop loss claims)
- [ ] AI-powered demand forecasting
- [ ] Export marketplace

### Scalability Design
- Stateless API (horizontal scaling ready)
- MongoDB Atlas auto-scaling
- Cloudinary CDN for media
- Circuit breaker for external API resilience
- Ready for Kubernetes container orchestration

---

## 14. Competitive Analysis

| Feature | KrushiSetu | AgriBazaar | eNAM | Ninjacart |
|---|---|---|---|---|
| AI Crop Diagnosis | ✅ | ❌ | ❌ | ❌ |
| Live Mandi Prices | ✅ | ✅ | ✅ | ❌ |
| Expert Q&A | ✅ | ❌ | ❌ | ❌ |
| Direct Marketplace | ✅ | ✅ | ✅ | ✅ |
| Knowledge Hub | ✅ | ❌ | ❌ | ❌ |
| Escrow Payments | ✅ | ❌ | ❌ | ✅ |
| Price Alerts | ✅ | ❌ | ❌ | ❌ |
| Multi-role Platform | ✅ | ❌ | ❌ | ❌ |
| Open Source | ✅ | ❌ | ❌ | ❌ |

**KrushiSetu's Unique Value:** The only platform combining AI diagnosis + live pricing + expert advisory + marketplace in a single integrated experience.

---

## Appendix

### Environment Variables Reference
See `.env.example` in `/backend` and `.env.local.example` in project root.

### Contributing
See `CONTRIBUTING.md` for development setup, code style guidelines, and PR process.

### License
MIT License — free for personal and commercial use with attribution.

---

*Built with ❤️ for India's farmers | KrushiSetu © 2026*
