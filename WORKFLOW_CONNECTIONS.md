# 🔗 GREENTRACE - COMPLETE WORKFLOW & CONNECTIVITY

## 🎯 PROJECT FULLY CONNECTED & RUNNING

### ✅ All Components Working
```
Frontend (Next.js 3000) ←→ Backend (Express 5000) ←→ Database (MongoDB Atlas)
      ✅ Running           ✅ Running                  ✅ Connected
```

---

## 📊 COMPLETE SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GREENTRACE ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤

┌─────────────────────────────┐
│    FRONTEND LAYER           │
│  (Next.js 16 on :3000)     │
├─────────────────────────────┤
│ ✅ React Components          │
│ ✅ TypeScript                │
│ ✅ Tailwind CSS              │
│ ✅ Authentication UI         │
│ ✅ Marketplace UI            │
│ ✅ Knowledge Hub UI          │
│ ✅ Advisory UI               │
│ ✅ Dashboard UI              │
└──────────────┬──────────────┘
               │ HTTP/REST API Calls
               │ (JSON payloads)
               ▼
┌─────────────────────────────┐
│    API LAYER                │
│  (Express.js on :5000)     │
├─────────────────────────────┤
│ Routes:                      │
│ ✅ /auth (Register, Login)   │
│ ✅ /users (Profiles)         │
│ ✅ /products (Marketplace)   │
│ ✅ /orders (Purchases)       │
│ ✅ /advisory (Q&A, Consults) │
│ ✅ /articles (Knowledge)     │
│ ✅ /mandi (Prices)           │
│ ✅ /search (Global)          │
│ ✅ /uploads (Files)          │
│                              │
│ Middleware:                  │
│ ✅ JWT Authentication        │
│ ✅ Error Handling            │
│ ✅ CORS                      │
│ ✅ Rate Limiting             │
│ ✅ Validation                │
└──────────────┬──────────────┘
               │ Mongoose Queries
               │ (Database operations)
               ▼
┌─────────────────────────────┐
│   DATABASE LAYER            │
│  (MongoDB Atlas - Cloud)    │
├─────────────────────────────┤
│ Collections:                 │
│ ✅ users (8 fields + role)   │
│ ✅ products (farmer items)   │
│ ✅ orders (transactions)     │
│ ✅ articles (expert content) │
│ ✅ questions (farmer Q)      │
│ ✅ answers (expert A)        │
│ ✅ mandiprice (market data)  │
│ ✅ reviews (ratings)         │
│ ✅ notifications (alerts)    │
│ ✅ tokens (JWT store)        │
│ ✅ searchhistory (logs)      │
└─────────────────────────────┘

External Services:
├─ 📧 Email (Gmail SMTP via Nodemailer)
├─ 📱 SMS (Twilio)
├─ 📁 Storage (AWS S3)
├─ 🔐 Auth (JWT)
└─ 📊 Maps (Google Maps - optional)
```

---

## 🔄 USER WORKFLOW EXAMPLES

### Workflow 1: New User Registration → Login → Browse Products

```
1. USER SIGNUP (Frontend)
   └─► User fills signup form
   └─► Clicks "Register" button
   └─► Frontend validates form (Zod validation)
   
2. API CALL (Frontend → Backend)
   └─► POST /api/v1/auth/register
   └─► Body: { email, password, role, name }
   └─► Headers: Content-Type: application/json
   
3. BACKEND PROCESSING
   └─► Middleware: Validate input
   └─► Middleware: Check if email exists
   └─► Hash password with bcryptjs
   └─► Create User document in MongoDB
   └─► Generate JWT tokens (access + refresh)
   
4. RESPONSE (Backend → Frontend)
   └─► Status: 201 Created
   └─► Body: { success: true, user: {...}, tokens: {...} }
   └─► Cookies: Set httpOnly accessToken
   
5. FRONTEND STATE UPDATE
   └─► Store user in Context
   └─► Store token in secure cookie
   └─► Redirect to dashboard
   
6. USER LOGIN (Frontend)
   └─► User enters credentials
   └─► Clicks "Login"
   └─► Frontend validates
   
7. API CALL (Frontend → Backend)
   └─► POST /api/v1/auth/login
   └─► Body: { email, password }
   
8. BACKEND VERIFICATION
   └─► Find user by email in MongoDB
   └─► Compare password with bcryptjs
   └─► Generate new JWT tokens
   └─► Return tokens
   
9. BROWSE PRODUCTS
   └─► User clicks "Marketplace"
   └─► Frontend loads product list
   
10. API CALL (Frontend → Backend)
    └─► GET /api/v1/products
    └─► Headers: { Authorization: Bearer <token> }
    
11. BACKEND FETCHES
    └─► Verify JWT token (middleware)
    └─► Query MongoDB products collection
    └─► Apply filters (category, price, location)
    └─► Return paginated results
    
12. DISPLAY (Frontend)
    └─► Render products with images
    └─► Show filters & sorting
    └─► Ready for interaction
```

### Workflow 2: Farmer Lists Product → Consumer Purchases

```
FARMER SIDE:
1. Upload Product
   └─► POST /api/v1/products
   └─► Fields: name, description, price, category, images
   └─► Images → AWS S3, reference stored in MongoDB
   
2. Backend Processing
   └─► Validate farmer is authenticated
   └─► Validate product data
   └─► Create Product document
   └─► Set status: "pending" → "active" (after admin approval)
   
3. Notification
   └─► Send email to admin
   └─► Store notification in DB

CONSUMER SIDE:
4. Browse Products
   └─► GET /api/v1/products?category=vegetables&minPrice=100
   └─► Backend filters & returns matching products
   
5. Add to Cart
   └─► Frontend stores in React Context
   └─► Cart data stays client-side (no DB yet)
   
6. Checkout
   └─► POST /api/v1/orders
   └─► Body: { products, shippingAddress, paymentMethod }
   
7. Order Creation
   └─► Backend creates Order document
   └─► Sets status: "pending"
   └─► Reduce product quantity in DB
   
8. Payment (Stripe integration)
   └─► Stripe processes payment
   └─► Backend confirms payment
   └─► Update Order status: "confirmed"
   
9. Notifications
   └─► Email sent to farmer (new order)
   └─► Email sent to consumer (order confirmed)
   └─► Notifications created in DB
   
10. Fulfillment
    └─► Farmer updates order status → "shipped"
    └─► Consumer notified
    └─► Farmer updates status → "delivered"
    └─► Order complete
```

### Workflow 3: Expert Publishes Article → Consumer Reads

```
EXPERT SIDE:
1. Write Article
   └─► Frontend: Rich text editor component
   └─► Fields: title, content, category, tags, cover image
   
2. Publish
   └─► POST /api/v1/articles
   └─► Body: { title, content, category, tags, coverImage }
   └─► Verify user is expert role
   
3. Backend Processing
   └─► Validate article data
   └─► Create Article document
   └─► Set status: "draft" or "published"
   └─► Store cover image reference (AWS S3)
   
4. Database Entry
   └─► articles collection
   └─► Fields: title, content, author (expert ID), 
             category, tags, publishedAt, views, comments

CONSUMER SIDE:
5. Browse Knowledge Hub
   └─► GET /api/v1/articles?category=vegetables
   └─► Backend returns article list with pagination
   
6. Read Article
   └─► GET /api/v1/articles/:articleId
   └─► Backend increments view count
   └─► Returns article with comments
   
7. Leave Comment
   └─► POST /api/v1/articles/:articleId/comments
   └─► Body: { text }
   └─► Create comment in DB
   └─► Notify expert author
   
8. Expert Responds
   └─► POST /api/v1/articles/:articleId/comments/:commentId/reply
   └─► Notification sent to consumer
```

### Workflow 4: Farmer Asks Question → Expert Answers

```
FARMER SIDE:
1. Ask Question
   └─► Frontend: Question form component
   └─► POST /api/v1/questions
   └─► Body: { title, description, category, attachments }
   
2. Question Stored
   └─► MongoDB: questions collection
   └─► Status: "open"
   └─► Timestamp: created

EXPERT SIDE:
3. View Questions
   └─► GET /api/v1/questions?category=vegetables&status=open
   └─► Backend returns list
   
4. Provide Answer
   └─► POST /api/v1/questions/:questionId/answers
   └─► Body: { text, attachments, recommendations }
   
5. Answer Stored
   └─► MongoDB: answers collection
   └─► Links: questionId, expertId

FARMER SIDE:
6. View Answer
   └─► Notification received
   └─► Opens answer in app
   └─► Can rate quality: upvote/downvote
   └─► Can request follow-up
   
7. Rating System
   └─► PUT /api/v1/answers/:answerId/rate
   └─► Body: { rating: 5 }
   └─► Expert reputation updated
```

---

## 🔐 AUTHENTICATION FLOW (Deep Dive)

```
┌─────────────────────────────────────────────────────────────┐
│              JWT AUTHENTICATION SYSTEM                       │
├─────────────────────────────────────────────────────────────┤

1. LOGIN REQUEST
   ├─ User submits email + password
   ├─ Frontend: POST /api/v1/auth/login
   └─ Body: { email: "user@example.com", password: "..." }

2. BACKEND VERIFICATION
   ├─ Find user by email in MongoDB
   ├─ Compare password with bcryptjs.compare()
   └─ If match → Generate tokens

3. TOKEN GENERATION
   ├─ Access Token (JWT)
   │  ├─ Payload: { userId, role, email }
   │  ├─ Secret: JWT_SECRET from .env
   │  ├─ Expiry: 15 minutes (short-lived)
   │  └─ Stored: httpOnly cookie (secure)
   │
   ├─ Refresh Token (JWT)
   │  ├─ Payload: { userId }
   │  ├─ Secret: JWT_SECRET from .env
   │  ├─ Expiry: 7 days (long-lived)
   │  └─ Stored: httpOnly cookie + MongoDB

4. RESPONSE TO FRONTEND
   ├─ Status: 200 OK
   ├─ Body: { success: true, user: {...}, tokens: {...} }
   ├─ Cookies: Set-Cookie headers (httpOnly, secure, sameSite)
   └─ Frontend stores token in Context

5. AUTHENTICATED REQUESTS
   ├─ Frontend makes API call
   ├─ Browser auto-includes cookies in request
   ├─ OR Header: Authorization: Bearer <access_token>
   └─ Backend middleware verifies token

6. MIDDLEWARE VERIFICATION
   ├─ Extract token from cookie or header
   ├─ Verify JWT signature with JWT_SECRET
   ├─ Check if expired
   ├─ Extract userId, role from payload
   ├─ If valid → Add user to req object
   └─ If invalid → Return 401 Unauthorized

7. PROTECTED ROUTE HANDLER
   ├─ Now has req.user available
   ├─ Check user.role for authorization
   ├─ Perform requested operation
   ├─ Return response
   └─ If auth fails → Return 403 Forbidden

8. TOKEN EXPIRY & REFRESH
   ├─ Access token expires after 15 minutes
   ├─ Frontend detects 401 response
   ├─ Calls refresh endpoint: POST /api/v1/auth/refresh
   ├─ Backend verifies refresh token
   ├─ Issues new access token
   ├─ Frontend retries original request
   └─ User stays logged in

9. LOGOUT
   ├─ Frontend: POST /api/v1/auth/logout
   ├─ Backend: Clear cookies, invalidate tokens
   ├─ Frontend: Clear Context, redirect to login
   └─ User is logged out
```

---

## 💾 DATA FLOW EXAMPLES

### Create Product (Complete Data Flow)

```
FRONTEND LAYER:
├─ User submits product form
├─ Form validation: zod schema validates
├─ Create FormData with images
├─ API call: POST /api/v1/products
└─ Headers: Content-Type: multipart/form-data, 
            Authorization: Bearer <token>

API LAYER:
├─ middleware: authenticate() → Verify JWT
├─ middleware: authorize('farmer', 'admin') → Check role
├─ middleware: validateProductInput() → Validate data
├─ fileUpload middleware:
│  ├─ Upload images to AWS S3
│  ├─ Get S3 URLs
│  └─ Add to req.imageUrls
├─ Route handler:
│  ├─ Create new Product instance
│  ├─ Set: name, description, price, category
│  ├─ Set: imageUrls (from S3)
│  ├─ Set: farmerId (from req.user._id)
│  ├─ Set: status: 'pending'
│  ├─ Save to MongoDB
│  └─ Return created product

DATABASE LAYER:
├─ products collection
├─ New document:
│  {
│    _id: ObjectId(),
│    name: "Fresh Tomatoes",
│    description: "Organic, pesticide-free",
│    price: 45,
│    unit: "kg",
│    quantity: 100,
│    category: "vegetables",
│    farmer: ObjectId(farmerId),
│    images: ["https://s3.../img1.jpg", ...],
│    status: "pending",
│    rating: { average: 0, count: 0 },
│    createdAt: Date,
│    updatedAt: Date
│  }
├─ Document saved successfully
└─ MongoDB returns _id

RESPONSE:
├─ Status: 201 Created
├─ Body: { success: true, product: { _id, name, ... } }
└─ Frontend receives and updates UI

NOTIFICATION:
├─ Background job (Bull queue)
├─ Send email to admin for approval
├─ Create notification in DB
└─ Notify via push if enabled
```

---

## 🔄 CONNECTIVITY VERIFICATION MATRIX

| Component | Status | Connection | Response |
|-----------|--------|-----------|----------|
| Frontend | ✅ Running | Next.js on :3000 | Serving |
| Backend | ✅ Running | Express on :5000 | Listening |
| MongoDB | ✅ Connected | Cloud Atlas | Connected |
| Frontend→Backend | ✅ Working | HTTP/REST | 200 OK |
| Backend→MongoDB | ✅ Working | Mongoose | Queries OK |
| Auth System | ✅ Working | JWT + Cookies | Verified |
| API Routes | ✅ Working | All 8 routes | Responding |
| File Upload | ✅ Ready | AWS S3 integration | Ready |
| Email Service | ✅ Ready | Nodemailer/Gmail | Ready |
| SMS Service | ✅ Ready | Twilio | Ready |

---

## ✨ FEATURE CONNECTIVITY

### Marketplace Feature Flow
```
Browse Products
  ↓
Frontend → GET /api/v1/products
  ↓
Backend filters from MongoDB products collection
  ↓
Returns with farmer info, images from S3
  ↓
Frontend renders product cards
  ↓
User clicks "Add to Cart"
  ↓
Frontend stores in React Context (client-side)
  ↓
User checks out
  ↓
Frontend → POST /api/v1/orders
  ↓
Backend creates order, links products
  ↓
Sends notification emails
  ↓
Order appears in user dashboard
  ↓
Farmer gets notified
  ↓
Farmer can mark as shipped/delivered
  ↓
Notifications keep both updated
```

### Knowledge Hub Feature Flow
```
Expert writes article
  ↓
Frontend → POST /api/v1/articles
  ↓
Backend stores in MongoDB articles collection
  ↓
Consumers browse knowledge hub
  ↓
Frontend → GET /api/v1/articles?category=X
  ↓
Backend returns filtered results
  ↓
Consumers can read, comment, rate
  ↓
Comments: POST /api/v1/articles/:id/comments
  ↓
Backend stores comments, creates notifications
  ↓
Expert gets notified of new comments
  ↓
Expert can respond
  ↓
Comment thread grows with replies
```

---

## 🎯 SUMMARY: EVERYTHING IS CONNECTED

### ✅ Frontend → Backend ✅
- All API calls working
- All CORS configured
- Authentication verified
- Token management working

### ✅ Backend → Database ✅
- MongoDB connection active
- All models working
- CRUD operations functioning
- Data persistence confirmed

### ✅ Frontend → Database (via Backend) ✅
- Data flows correctly
- Images stored in AWS S3
- Notifications created
- User sessions maintained

### ✅ External Services ✅
- Email sending ready (Nodemailer)
- SMS ready (Twilio)
- File storage ready (AWS S3)
- All APIs configured

---

## 🚀 PRODUCTION READINESS

| Aspect | Status | Details |
|--------|--------|---------|
| Frontend Build | ✅ Ready | `npm run build` works |
| Backend Deploy | ✅ Ready | Can deploy to Heroku/Railway |
| Database | ✅ Production | MongoDB Atlas is managed |
| Security | ✅ Configured | JWT, HTTPS ready, CORS, validation |
| Performance | ✅ Optimized | Connection pooling, compression, caching |
| Error Handling | ✅ Implemented | Global error handlers, validation |
| Logging | ✅ Ready | Winston logs for analysis |
| Rate Limiting | ✅ Active | Protects from abuse |

---

**Status**: ✅ FULLY OPERATIONAL & CONNECTED
**Date**: January 28, 2026
**Next**: Deploy to production or continue development!
