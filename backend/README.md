# Networking Club Member Management System - Backend

A complete, production-ready backend for managing members of a networking club with email verification, member approval workflow, local file storage, and admin dashboard.

## 🚀 Features

- ✅ Email-based OTP verification system
- ✅ User registration with document upload
- ✅ JWT-based authentication (Access + Refresh tokens)
- ✅ Admin approval workflow
- ✅ Local file storage (no third-party services)
- ✅ Member profiles and directory
- ✅ Rate limiting and security middleware
- ✅ Comprehensive error handling
- ✅ Dashboard analytics
- ✅ Automatic cleanup of expired OTPs

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- SMTP credentials (Gmail with App Password or custom SMTP)

## 🔧 Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/ncms
NODE_ENV=development
PORT=5000

# JWT Secrets (Generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_specific_password

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 3. Generate JWT Secrets

```bash
node -e "console.log('Access Secret:', require('crypto').randomBytes(32).toString('hex')); console.log('Refresh Secret:', require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Start MongoDB

```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (update MONGODB_URI in .env)
```

### 5. Start the Server

```bash
# Development with nodemon
npm run dev

# Production
npm start
```

## 📚 API Documentation

### Authentication Routes

#### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "OTP sent successfully to your email",
  "data": {
    "email": "user@example.com",
    "expiresIn": "5 minutes"
  }
}
```

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "12345"
}

Response:
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "email": "user@example.com",
    "isVerified": true
  }
}
```

#### Register
```http
POST /api/auth/register
Content-Type: multipart/form-data

{
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "9876543210",
  "password": "SecurePass123",
  "companyName": "Tech Corp",
  "chapterId": "6504a5c8d1a2b3c4e5f6g7h8",
  "companyLogo": [file],
  "paymentProof": [file]
}

Response:
{
  "success": true,
  "message": "Registration successful. Your account is under review.",
  "data": {
    "userId": "...",
    "email": "john@example.com",
    "status": "pending"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {...},
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": "15m"
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response:
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": "15m"
  }
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "message": "Logout successful"
}
```

### Member Routes

#### Get Profile
```http
GET /api/member/profile
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "companyName": "Tech Corp",
    "status": "approved",
    ...
  }
}
```

#### Update Profile
```http
PUT /api/member/profile
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

{
  "name": "John Doe",
  "mobile": "9876543210",
  "companyName": "Tech Corp",
  "services": ["Consulting", "Development"],
  "description": "Senior Developer",
  "profileImage": [file]
}

Response:
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {...}
}
```

#### Get Member List
```http
GET /api/member/list?page=1&limit=10
Authorization: Bearer {accessToken} (optional)

Response:
{
  "success": true,
  "message": "Members list retrieved successfully",
  "data": [...],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

#### Get Member by ID
```http
GET /api/member/:id
Authorization: Bearer {accessToken} (optional)

Response:
{
  "success": true,
  "message": "Member retrieved successfully",
  "data": {...}
}
```

### Admin Routes

#### Get Pending Members
```http
GET /api/admin/members?status=pending&page=1&limit=10
Authorization: Bearer {adminAccessToken}

Response:
{
  "success": true,
  "message": "Pending members retrieved successfully",
  "data": [...],
  "pagination": {...}
}
```

#### Get Member Detail
```http
GET /api/admin/member/:id
Authorization: Bearer {adminAccessToken}

Response:
{
  "success": true,
  "message": "Member details retrieved successfully",
  "data": {...}
}
```

#### Approve Member
```http
POST /api/admin/approve/:id
Authorization: Bearer {adminAccessToken}

Response:
{
  "success": true,
  "message": "Member approved successfully",
  "data": {...}
}
```

#### Reject Member
```http
POST /api/admin/reject/:id
Authorization: Bearer {adminAccessToken}
Content-Type: application/json

{
  "reason": "Documents not verified"
}

Response:
{
  "success": true,
  "message": "Member rejected successfully",
  "data": {...}
}
```

#### Create Chapter
```http
POST /api/admin/chapter
Authorization: Bearer {adminAccessToken}
Content-Type: application/json

{
  "name": "Mumbai Chapter",
  "city": "Mumbai",
  "description": "Networking Club Mumbai"
}

Response:
{
  "success": true,
  "message": "Chapter created successfully",
  "data": {...}
}
```

#### Get Chapters
```http
GET /api/admin/chapters
Authorization: Bearer {adminAccessToken}

Response:
{
  "success": true,
  "message": "Chapters retrieved successfully",
  "data": [...]
}
```

#### Dashboard Statistics
```http
GET /api/admin/dashboard-stats
Authorization: Bearer {adminAccessToken}

Response:
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "totalMembers": 150,
    "approvedMembers": 120,
    "pendingMembers": 25,
    "rejectedMembers": 5,
    "totalChapters": 5,
    "membersByChapter": [...],
    "recentRegistrations": [...]
  }
}
```

## 🔐 Security Features

- ✅ Password hashing with bcrypt (salt rounds: 10)
- ✅ JWT token-based authentication
- ✅ Rate limiting on OTP (3 per hour) and login (5 per 15 minutes)
- ✅ CORS protection
- ✅ Helmet.js security headers
- ✅ Input validation with Joi
- ✅ File upload restrictions (2MB max, JPEG/PNG/WEBP only)
- ✅ Automatic OTP expiry and cleanup
- ✅ No sensitive data in responses

## 📁 Project Structure

```
backend/
├── config/
│   ├── db.js              # MongoDB connection
│   └── mailer.js          # Email configuration
├── models/
│   ├── User.js            # User schema
│   ├── OTP.js             # OTP schema
│   └── Chapter.js         # Chapter schema
├── controllers/
│   ├── authController.js  # Auth logic
│   ├── memberController.js # Member logic
│   └── adminController.js # Admin logic
├── routes/
│   ├── authRoutes.js      # Auth endpoints
│   ├── memberRoutes.js    # Member endpoints
│   └── adminRoutes.js     # Admin endpoints
├── middleware/
│   ├── authMiddleware.js  # JWT verification
│   ├── adminMiddleware.js # Admin check
│   ├── uploadMiddleware.js# File upload config
│   ├── rateLimiter.js     # Rate limiting
│   └── errorMiddleware.js # Error handling
├── services/
│   ├── emailService.js    # Email operations
│   ├── otpService.js      # OTP logic
│   └── userService.js     # User business logic
├── utils/
│   ├── generateToken.js   # JWT generation
│   └── validateEmail.js   # Email validation
├── validations/
│   ├── authValidation.js  # Auth schemas
│   └── memberValidation.js# Member schemas
├── uploads/               # Local file storage
│   ├── logos/
│   ├── profiles/
│   └── payments/
├── app.js                 # Express app setup
├── server.js              # Server entry point
└── package.json           # Dependencies
```

## 🧪 Testing Endpoints

Use Postman or cURL to test:

1. **Send OTP**: `POST http://localhost:5000/api/auth/send-otp`
2. **Verify OTP**: `POST http://localhost:5000/api/auth/verify-otp`
3. **Register**: `POST http://localhost:5000/api/auth/register`
4. **Login**: `POST http://localhost:5000/api/auth/login`
5. **Get Profile**: `GET http://localhost:5000/api/member/profile`
6. **Get Members**: `GET http://localhost:5000/api/member/list`

## ⚙️ Configuration Tips

### Gmail SMTP Setup
1. Enable 2-factor authentication on Gmail
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the generated 16-character password in `SMTP_PASSWORD`

### Custom SMTP
Replace SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD with your SMTP provider details.

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in `.env`
- Verify network access (if using MongoDB Atlas)

### Email Not Sending
- Verify SMTP credentials
- Enable "Less secure app access" or use App Password
- Check firewall/network settings for port 587

### File Upload Errors
- Ensure `uploads/` directory exists
- Check file size (max 2MB)
- Verify file type (JPEG, PNG, WEBP only)

### Token Expiry Issues
- Ensure JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are set
- Use refresh token endpoint to get new access token
- Check token expiry values in `.env`

## 📞 Support

For issues or questions, refer to the documentation in code comments and error messages returned by API.

## 📄 License

ISC

---

**Built with ❤️ by Senior Backend Developer**
