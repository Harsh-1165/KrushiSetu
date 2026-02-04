# 🚀 QUICK START GUIDE - GreenTrace

## ✅ EVERYTHING IS RUNNING!

### 📍 Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/v1
- **Database**: MongoDB Atlas (Cloud Connected)

---

## 🎯 WHAT'S WORKING

### ✨ Frontend (Next.js)
- ✅ Homepage with all sections
- ✅ Marketplace browsing
- ✅ Knowledge Hub
- ✅ Advisory Services
- ✅ Market Prices
- ✅ User Authentication UI
- ✅ Dashboard layouts
- ✅ Navigation & Routing

### 🔌 Backend (Express.js)
- ✅ Authentication (JWT + Cookies)
- ✅ User Management
- ✅ Product Management
- ✅ Order Processing
- ✅ Advisory System
- ✅ Knowledge Hub API
- ✅ Market Price Tracking
- ✅ Search Functionality
- ✅ File Upload Support

### 🗄️ Database (MongoDB)
- ✅ Connected to MongoDB Atlas
- ✅ All collections ready
- ✅ User accounts
- ✅ Product listings
- ✅ Orders
- ✅ Articles
- ✅ Q&A System

---

## 🧪 QUICK TESTS

### Test 1: Frontend Loading
```
1. Open http://localhost:3000 in browser
2. You should see GreenTrace homepage
3. Check browser console (F12) for errors
```

### Test 2: Backend API
```
1. Open terminal and run:
   curl http://localhost:5000/api/v1/health
2. Should get a response (not an error)
```

### Test 3: Frontend → Backend Communication
```
1. Go to http://localhost:3000
2. Open browser DevTools (F12)
3. Go to Network tab
4. Click on any feature (Marketplace, Advisory, etc.)
5. Should see API calls to localhost:5000
6. Calls should return 200 (or 401 for auth-required)
```

---

## 📋 PROJECT STRUCTURE

```
greentracearchitectureplan111/
├── app/                    # Next.js app (frontend)
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (dashboard)/       # User dashboards
│   ├── knowledge-hub/     # Articles & learning
│   ├── marketplace/       # Products & shopping
│   └── page.tsx          # Homepage
│
├── components/            # React components
│   ├── dashboard/        # Dashboard UI
│   ├── knowledge-hub/    # KB components
│   └── ui/              # shadcn/ui components
│
├── lib/                   # Utilities & APIs
│   ├── api.ts           # API wrapper
│   ├── auth.ts          # Auth utilities
│   └── *-api.ts         # Feature APIs
│
├── backend/              # Express backend
│   ├── routes/          # API endpoints
│   ├── models/          # MongoDB schemas
│   ├── middleware/      # Auth, validation, etc.
│   ├── services/        # Business logic
│   ├── utils/          # Helpers
│   ├── app.js          # Express config
│   └── server.js       # Server entry
│
├── .env.local            # Frontend config
├── backend/.env          # Backend config
└── SETUP_COMPLETE.md     # This setup info
```

---

## 🔑 KEY FILES

### Environment Files (Already Created)
- `backend/.env` - Backend configuration with MongoDB credentials
- `.env.local` - Frontend configuration with API URL

### Configuration Files
- `next.config.mjs` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS config
- `tsconfig.json` - TypeScript config
- `backend/app.js` - Express app setup

### Documentation
- `ARCHITECTURE.md` - Detailed architecture (1787 lines)
- `PROJECT_ANALYSIS.md` - Complete tech stack analysis
- `SETUP_COMPLETE.md` - Full setup details
- `backend/models/schemas.md` - Database schema documentation

---

## 💾 DATABASE

**MongoDB Atlas Connection**
```
Host: mongodb+srv://harshmaniya64:HarshManiya1165@greentrace.mftbrzy.mongodb.net/
Collections:
  - users (user accounts & profiles)
  - products (marketplace items)
  - orders (purchases)
  - articles (knowledge content)
  - questions/answers (Q&A)
  - mandiprice (market rates)
  - reviews (ratings)
  - notifications (alerts)
  - tokens (JWT)
  - searchhistory (search logs)
```

---

## 🛠️ TECH STACK

### Frontend
- Next.js 16 (React 19)
- TypeScript
- Tailwind CSS 4.1
- shadcn/ui Components
- Framer Motion
- Recharts
- SWR (data fetching)
- React Hook Form + Zod

### Backend
- Node.js 18+
- Express.js 5.2
- MongoDB + Mongoose
- JWT Authentication
- Nodemailer (Email)
- Twilio (SMS)
- AWS S3 (Files)
- Sharp (Image processing)

---

## 🚀 START/STOP SERVERS

### Terminal 1: Start Backend
```bash
cd backend
npm start    # Production
npm run dev  # Development (with nodemon)
```

### Terminal 2: Start Frontend
```bash
npm run dev  # Next.js dev server
npm run build # Build for production
```

### Stop Servers
```bash
Ctrl + C     # In each terminal
```

---

## 📞 TROUBLESHOOTING

### Frontend not loading?
- Check http://localhost:3000 is accessible
- Verify .env.local file exists
- Check browser console for errors
- Ensure npm packages installed (npm install)

### API calls failing?
- Verify backend is running on :5000
- Check CORS is enabled
- Ensure MongoDB is connected
- Check backend terminal for errors
- Verify .env values are correct

### Can't connect to MongoDB?
- Check internet connection (Atlas is cloud)
- Verify MONGODB_URI in backend/.env
- Check IP is whitelisted in Atlas
- Try: ping mongodb.com

### Port already in use?
```bash
# Find process using port
netstat -ano | findstr :3000
# Kill process (replace PID)
taskkill /PID <PID> /F
```

---

## 📊 API ENDPOINTS REFERENCE

### Authentication
```
POST   /api/v1/auth/register         # Create account
POST   /api/v1/auth/login            # Login
POST   /api/v1/auth/refresh          # Refresh token
POST   /api/v1/auth/logout           # Logout
```

### Products
```
GET    /api/v1/products              # List all
GET    /api/v1/products/:id          # Get one
POST   /api/v1/products              # Create (farmer)
PUT    /api/v1/products/:id          # Update
DELETE /api/v1/products/:id          # Delete
```

### Orders
```
GET    /api/v1/orders                # My orders
GET    /api/v1/orders/:id            # Order details
POST   /api/v1/orders                # Create order
PUT    /api/v1/orders/:id            # Update status
```

### Articles
```
GET    /api/v1/articles              # List articles
GET    /api/v1/articles/:id          # Article details
POST   /api/v1/articles              # Create (expert)
PUT    /api/v1/articles/:id          # Update
```

### Mandi Prices
```
GET    /api/v1/mandi/prices          # Current prices
GET    /api/v1/mandi/prices/:crop    # Crop prices
POST   /api/v1/mandi/alerts          # Set price alerts
```

---

## ✨ FEATURES READY TO USE

1. **User Authentication**
   - Signup with email
   - Login with credentials
   - Password reset
   - Email verification

2. **Marketplace**
   - Browse products
   - Filter by category, price, location
   - View product details
   - Add to cart
   - Checkout

3. **Knowledge Hub**
   - Read articles by experts
   - Search content
   - Comment on articles
   - Save favorites
   - Filter by category

4. **Advisory Services**
   - Ask crop questions
   - Get expert answers
   - Book consultations
   - View recommendations

5. **Market Intelligence**
   - View real-time mandi prices
   - Set price alerts
   - Historical price trends
   - Market analysis

6. **User Dashboard**
   - View profile
   - Manage listings (farmers)
   - Track orders
   - View sales (farmers)
   - Manage consultations (experts)

---

## 🎓 LEARNING RESOURCES

### Architecture
- Read `ARCHITECTURE.md` for system design
- Check `PROJECT_ANALYSIS.md` for tech details
- See `backend/models/schemas.md` for database structure

### Code
- Frontend components: `components/`
- API utilities: `lib/`
- Backend routes: `backend/routes/`
- Database models: `backend/models/`

### API Testing
- Use Postman or Insomnia
- Base URL: `http://localhost:5000/api/v1`
- Include auth headers for protected routes

---

## 🎉 YOU'RE ALL SET!

**Status**: ✅ FULLY OPERATIONAL

Frontend + Backend + Database = Fully Connected & Working

### Next Steps:
1. Open http://localhost:3000 in browser
2. Test features (browse, search, auth)
3. Check browser console for any issues
4. Monitor backend terminal for errors
5. Develop & iterate!

---

**Last Updated**: January 28, 2026
**Status**: ✅ PRODUCTION READY (with Redis optional)
