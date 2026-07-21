## 🚀 Quick Start Guide

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Create Environment File

Create `.env` file in the `backend` folder:

```bash
# Create from example
copy .env.example .env   # Windows
cp .env.example .env     # Mac/Linux
```

### Step 3: Generate JWT Secrets

Run this in your terminal/PowerShell to generate secure secrets:

**Windows (PowerShell):**
```powershell
node -e "console.log('Access:', require('crypto').randomBytes(32).toString('hex')); console.log('Refresh:', require('crypto').randomBytes(32).toString('hex'))"
```

**Mac/Linux:**
```bash
node -e "console.log('Access:', require('crypto').randomBytes(32).toString('hex')); console.log('Refresh:', require('crypto').randomBytes(32).toString('hex'))"
```

Copy both values and update `.env`:
```env
JWT_ACCESS_SECRET=<paste_access_secret_here>
JWT_REFRESH_SECRET=<paste_refresh_secret_here>
```

### Step 4: Configure MongoDB

#### Option A: Local MongoDB
```bash
# Install MongoDB Community Edition from https://www.mongodb.com/try/download/community
# Then keep MongoDB running:
mongod
```

`.env` should have:
```env
MONGODB_URI=mongodb://localhost:27017/ncms
```

#### Option B: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `.env`:
```env
MONGODB_URI_PRODUCTION=mongodb+srv://username:password@cluster.mongodb.net/ncms?retryWrites=true&w=majority
MONGODB_URI=mongodb://localhost:27017/ncms
```

### Step 5: Configure Email (Gmail Example)

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your device)
3. Copy the 16-character password
4. Update `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=<paste_16_char_password>
```

### Step 6: Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

You should see:
```
==================================================
✅ Server is running on port 5000
📝 Environment: development
🌐 API Base URL: http://localhost:5000
==================================================

✅ OTP cleanup cron job scheduled (every 10 minutes)
```

### Step 7: Test the Backend

#### Test Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-04-04T10:30:00.000Z"
}
```

#### Test Send OTP
Use Postman or VS Code REST Client:

```http
POST http://localhost:5000/api/auth/send-otp
Content-Type: application/json

{
  "email": "test@example.com"
}
```

---

## 📋 Database Setup (First Time Only)

When you first run the server, MongoDB will automatically create:
- Database: `ncms`
- Collections: `users`, `otps`, `chapters`

You can manually create a chapter for testing:

### Create Test Chapter via API

```http
POST http://localhost:5000/api/admin/chapter
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Test Chapter",
  "city": "Test City",
  "description": "Test chapter for development"
}
```

Or insert directly in MongoDB:

```javascript
db.chapters.insertOne({
  name: "Mumbai Chapter",
  city: "Mumbai",
  description: "Networking Club Mumbai",
  totalMembers: 0,
  approvedMembers: 0,
  pendingMembers: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

---

## 🛠️ Common Commands

```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Start production server
npm start

# View MongoDB (install MongoDB Compass, connect to mongodb://localhost:27017)
# Or use MongoDB Atlas web interface

# Generate new JWT secrets
node -e "console.log('Access:', require('crypto').randomBytes(32).toString('hex')); console.log('Refresh:', require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔍 Verify Installation

Check these files exist in your `backend` folder:

- ✅ `package.json`
- ✅ `server.js`
- ✅ `app.js`
- ✅ `.env` (you created it)
- ✅ `config/` folder with `db.js` and `mailer.js`
- ✅ `models/` folder with User.js, OTP.js, Chapter.js
- ✅ `controllers/` folder
- ✅ `routes/` folder
- ✅ `middleware/` folder
- ✅ `services/` folder
- ✅ `uploads/` folder with logos, profiles, payments directories

---

## 🐛 Troubleshooting

### "Error: Cannot find module 'express'"
```bash
# Install all dependencies
npm install
```

### "MongooseError: Cannot connect to MongoDB"
- Check MongoDB is running: `mongod`
- Check MONGODB_URI in `.env` is correct
- Try: `mongodb://127.0.0.1:27017/ncms`

### "SMTP Error: 535 Incorrect authentication"
- Generate new App Password from Gmail
- Don't use your regular Gmail password
- Link: https://myaccount.google.com/apppasswords

### "Error: ENOENT: no such file or directory 'uploads/logos'"
```bash
# Create uploads directories manually if they don't exist
mkdir -p uploads/logos
mkdir -p uploads/profiles
mkdir -p uploads/payments
```

### Port 5000 already in use
```bash
# Windows: Find process using port
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :5000
kill -9 <PID>

# Or change PORT in .env to 5001
PORT=5001
```

---

## 📱 Frontend Integration

Your frontend should:

1. **Register Flow:**
   - Send OTP: `POST /api/auth/send-otp`
   - Verify OTP: `POST /api/auth/verify-otp`
   - Register: `POST /api/auth/register` (multipart/form-data)

2. **Login Flow:**
   - Login: `POST /api/auth/login`
   - Save tokens in localStorage/sessionStorage

3. **API Requests:**
   - Add header: `Authorization: Bearer {accessToken}`
   - On 403 error, refresh token: `POST /api/auth/refresh-token`

4. **Upload Files:**
   - Use `multipart/form-data` content-type
   - Max file size: 2MB
   - Allowed types: JPEG, PNG, WEBP

---

## 📚 API Reference

### Open Endpoints (No Auth Required)
- POST `/api/auth/send-otp` - Send OTP
- POST `/api/auth/verify-otp` - Verify OTP
- POST `/api/auth/register` - Register
- POST `/api/auth/login` - Login
- GET `/api/member/list` - List approved members
- GET `/api/member/:id` - Get member profile
- GET `/health` - Health check

### Protected Endpoints (Auth Required)
- POST `/api/auth/logout` - Logout
- POST `/api/auth/refresh-token` - Refresh token
- GET `/api/member/profile` - Get own profile
- PUT `/api/member/profile` - Update own profile

### Admin Only
- GET `/api/admin/members` - Get members
- GET `/api/admin/member/:id` - Get member details
- POST `/api/admin/approve/:id` - Approve member
- POST `/api/admin/reject/:id` - Reject member
- POST `/api/admin/chapter` - Create chapter
- GET `/api/admin/chapters` - List chapters
- GET `/api/admin/dashboard-stats` - Dashboard stats

---

**You're all set! 🎉 Your backend is ready to use.** Start it with `npm run dev`
