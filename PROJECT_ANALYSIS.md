# GreenTrace - Complete Project Analysis & Setup Guide

## 📋 PROJECT OVERVIEW

**GreenTrace** is a comprehensive agricultural marketplace platform designed to connect farmers, agricultural experts, and consumers.

---

## 🏗️ TECH STACK ANALYSIS

### Frontend Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Components**: shadcn/ui with Radix UI
- **Styling**: Tailwind CSS 4.1
- **State Management**: 
  - React Context (cart, auth)
  - SWR (data fetching & caching)
- **Form Handling**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Dev Server Port**: 3000

### Backend Stack
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 5.2.1
- **Language**: JavaScript
- **Database**: MongoDB (via Mongoose 9.1.4)
- **Authentication**: JWT + bcryptjs
- **File Upload**: Multer 2.0.2
- **Image Processing**: Sharp 0.34.5
- **Job Queue**: Bull 4.16.5 (Redis)
- **Email Service**: Nodemailer 7.0.12
- **SMS/Push**: Twilio 5.11.2
- **Cloud Storage**: AWS S3
- **Server Port**: 5000

### External Services
- **Database**: MongoDB Atlas (Cloud)
- **Email**: Nodemailer (SMTP)
- **SMS**: Twilio
- **File Storage**: AWS S3
- **Payments**: Stripe (planned)

---

## 📊 ARCHITECTURE FLOW

```
┌─────────────────────────────────────────────────────┐
│          FRONTEND (Next.js 15)                      │
│  - React components (TypeScript)                    │
│  - SWR for API calls                                │
│  - Context for state (Auth, Cart)                   │
└────────────────┬────────────────────────────────────┘
                 │ HTTP/REST Calls
                 ▼
┌─────────────────────────────────────────────────────┐
│       API LAYER (Express.js Backend)                │
│  Routes:                                            │
│  - /api/auth (login, register, tokens)              │
│  - /api/users (profiles, user data)                 │
│  - /api/products (marketplace items)                │
│  - /api/orders (purchase management)                │
│  - /api/advisory (expert consultations)             │
│  - /api/mandi (market prices)                       │
│  - /api/articles (knowledge hub)                    │
│  - /api/search (global search)                      │
│  - /api/uploads (file management)                   │
└────────────────┬────────────────────────────────────┘
                 │ Mongoose queries
                 ▼
┌─────────────────────────────────────────────────────┐
│       DATABASE LAYER (MongoDB)                      │
│  Collections:                                       │
│  - users (all user accounts)                        │
│  - products (farmer listings)                       │
│  - orders (transactions)                            │
│  - articles (knowledge content)                     │
│  - questions/answers (QA system)                    │
│  - mandiprice (market rates)                        │
│  - reviews (product ratings)                        │
│  - notifications (alerts)                           │
└─────────────────────────────────────────────────────┘
```

---

## 🔗 CONNECTIVITY VERIFICATION

### Frontend ↔ Backend Communication
✅ **Configured**: API base URL in `lib/api.ts`
- Frontend: `NEXT_PUBLIC_API_URL` environment variable
- Default: `http://localhost:5000/api`
- All frontend API calls go through `fetchWithAuth()` wrapper

### Backend ↔ Database Connection
✅ **Configured**: MongoDB connection in `backend/server.js`
- Connection string: `MONGODB_URI` environment variable
- Connection pooling: 10 max connections
- Mongoose models linked to collections

### Authentication Flow
✅ **Implemented**:
1. User registers/logs in → `POST /api/auth/register` or `/api/auth/login`
2. Backend validates credentials, generates JWT
3. JWT stored in secure httpOnly cookies
4. Frontend includes credentials in API calls
5. Backend middleware verifies JWT on protected routes

### Protected Routes
✅ **Implemented**: Auth middleware validates tokens
- Dashboard routes (require login)
- Product management (farmer-specific)
- Order management
- Advisory services

---

## 📁 PROJECT STRUCTURE

### Frontend Structure
```
app/
├── (auth)/              # Authentication routes
│   ├── login/
│   ├── signup/
│   ├── forgot-password/
│   └── verify-email/
├── (dashboard)/         # Protected user dashboard
│   └── dashboard/
├── knowledge-hub/       # Articles & learning
├── marketplace/         # Product buying
└── page.tsx            # Home page
components/
├── dashboard/          # Dashboard UI components
├── knowledge-hub/      # Knowledge hub components
├── ui/                 # shadcn/ui components
└── (other sections)
lib/
├── api.ts              # API wrapper & types
├── auth.ts             # Auth utilities
├── *-api.ts            # Feature-specific APIs
└── contexts/           # React contexts
```

### Backend Structure
```
backend/
├── routes/
│   ├── auth.js         # Authentication endpoints
│   ├── users.js        # User management
│   ├── products.js     # Product CRUD
│   ├── orders.js       # Order management
│   ├── advisory.js     # Expert services
│   ├── articles.js     # Knowledge content
│   ├── mandi.js        # Market prices
│   └── search.js       # Global search
├── models/
│   ├── User.js         # User schema
│   ├── Product.js      # Product schema
│   ├── Order.js        # Order schema
│   ├── Article.js      # Article schema
│   └── (other models)
├── middleware/
│   ├── auth.js         # JWT verification
│   ├── errorHandler.js # Global error handling
│   ├── corsConfig.js   # CORS setup
│   ├── rateLimiter.js  # Rate limiting
│   └── (other middleware)
├── services/
│   ├── emailService.js # Email sending
│   ├── notificationService.js
│   └── (other services)
├── utils/
│   ├── validators.js   # Input validation
│   ├── logger.js       # Logging
│   └── (other utilities)
├── app.js              # Express app config
└── server.js           # Server entry point
```

---

## ✨ FEATURES & CONNECTIVITY

### 1. **Authentication System**
- ✅ Signup/Login with email verification
- ✅ Role-based access (Farmer, Expert, Consumer, Admin)
- ✅ Password reset functionality
- ✅ JWT-based session management
- **Connected**: Frontend auth context → Backend auth routes → MongoDB users collection

### 2. **Marketplace**
- ✅ Farmers list products with images
- ✅ Consumers browse and filter products
- ✅ Shopping cart functionality
- ✅ Order placement and tracking
- **Connected**: Product forms → API → Database → Order management

### 3. **Knowledge Hub**
- ✅ Agricultural articles by experts
- ✅ Search and categorization
- ✅ Comments and discussions
- ✅ Reading progress tracking
- **Connected**: Article editor → Backend API → MongoDB → Frontend display

### 4. **Advisory Services**
- ✅ Expert-to-farmer consultation booking
- ✅ Q&A system for crop guidance
- ✅ Real-time notifications
- **Connected**: Advisory requests → Expert assignment → Notification service

### 5. **Market Intelligence**
- ✅ Real-time mandi (market) prices
- ✅ Price alerts for farmers
- ✅ Historical price tracking
- **Connected**: Mandi data → Database → Real-time updates to frontend

### 6. **Dashboard**
- ✅ Farmer dashboard (sales, inventory, orders)
- ✅ Expert dashboard (consultations, articles)
- ✅ Consumer dashboard (orders, wishlist)
- **Connected**: Role-based data fetching → Protected routes → User-specific APIs

---

## 🗄️ DATABASE SCHEMA

### Core Collections

1. **Users**
   - Email, password, roles (Farmer/Expert/Consumer/Admin)
   - Profile data, addresses, contact info
   - Farmer details (farm size, crops, certifications)
   - Expert details (qualifications, specialization)

2. **Products**
   - Name, description, price, quantity
   - Category, farm location
   - Images (stored in AWS S3)
   - Ratings and reviews
   - Farmer ID reference

3. **Orders**
   - Order number, status, total price
   - Product items with quantities
   - Delivery address, payment method
   - Order timeline (placed, shipped, delivered)

4. **Articles**
   - Title, content, category
   - Author (Expert ID)
   - Tags, publish status
   - Comments and engagement metrics

5. **Questions & Answers**
   - Question by farmer
   - Answers by experts
   - Category, tags
   - Ratings and votes

6. **MandiPrice**
   - Commodity, market, date
   - Price, quantity traded
   - Historical tracking

---

## 🔐 SECURITY FEATURES

✅ **Implemented**:
- Helmet.js for HTTP headers
- CORS configuration
- Rate limiting
- Input sanitization (XSS, NoSQL injection)
- JWT authentication
- Password hashing (bcryptjs)
- HTTPS ready
- HPP (Parameter Pollution) prevention

---

## 🚀 ENVIRONMENT CONFIGURATION

### Backend (.env)
```
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/greentrace

# Server
NODE_ENV=development
PORT=5000

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Email Service (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Twilio (SMS/Push)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=greentrace-bucket

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Firebase (optional, for push notifications)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

### Frontend (.env.local)
```
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Google Maps (optional, for location features)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key
```

---

## 🚀 SETUP & RUNNING INSTRUCTIONS

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- npm or pnpm package manager

### Step 1: Install Frontend Dependencies
```bash
cd c:\Users\HARSH\Downloads\greentracearchitectureplan111
npm install
# or
pnpm install
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 3: Create Environment Files
- Create `.env` in `backend/` directory
- Create `.env.local` in root directory
- (See environment templates above)

### Step 4: Start MongoDB
```bash
# Local MongoDB
mongod

# OR use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

### Step 5: Start Backend Server
```bash
cd backend
npm run dev
# Backend runs on http://localhost:5000
```

### Step 6: Start Frontend Development Server
```bash
# In root directory
npm run dev
# Frontend runs on http://localhost:3000
```

### Step 7: Verify Connection
- Open http://localhost:3000 in browser
- Check browser console for API errors
- Verify API calls reaching backend on http://localhost:5000/api

---

## 📈 SCALABILITY & DEPLOYMENT

### Production Ready Features
- ✅ Database connection pooling
- ✅ Error logging with Winston
- ✅ Request logging with Morgan
- ✅ Rate limiting
- ✅ Compression middleware
- ✅ Helmet security headers

### Deployment Strategy
- **Frontend**: Vercel (Next.js native)
- **Backend**: Heroku, Railway, or DigitalOcean
- **Database**: MongoDB Atlas (managed cloud DB)
- **Storage**: AWS S3 for files
- **Email**: SendGrid/Resend for production

---

## ✅ VERIFICATION CHECKLIST

- [ ] MongoDB connection string configured
- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] API calls from frontend reach backend
- [ ] Authentication flow works (signup → login)
- [ ] Dashboard loads with user data
- [ ] Product listing displays
- [ ] File uploads work
- [ ] Email notifications send
- [ ] Rate limiting works
- [ ] CORS allows frontend requests

---

## 🐛 TROUBLESHOOTING

### Backend won't start
- Check `MONGODB_URI` is correct
- Ensure port 5000 is available
- Check all dependencies installed

### Frontend API calls fail
- Verify `NEXT_PUBLIC_API_URL` is set
- Check backend is running
- Inspect browser console for CORS errors

### Database connection fails
- Verify MongoDB is running
- Check connection string format
- Ensure IP is whitelisted (MongoDB Atlas)

---

## 📞 SUPPORT & DOCUMENTATION

- API Routes: See `backend/routes/` directory
- Database Schemas: See `backend/models/`
- Architecture Details: See `ARCHITECTURE.md`
- Frontend Components: See `components/` directory

---

Generated: January 28, 2026
