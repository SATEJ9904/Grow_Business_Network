# Password Reset Feature - Quick Setup Guide

## What Was Added

A complete **Forgot Password & Reset Password** functionality with email verification has been added to the backend.

## Files Modified/Created

### New Files:
- `models/PasswordReset.js` - Database model for storing password reset tokens

### Modified Files:
- `controllers/authController.js` - Added 3 new controller functions
- `routes/authRoutes.js` - Added 3 new API routes
- `services/emailService.js` - Added 2 new email template functions
- `API_ENDPOINTS.txt` - Added documentation for new endpoints

### Documentation:
- `PASSWORD_RESET_FEATURE.md` - Comprehensive feature documentation

## New API Endpoints

### 1. Request Password Reset
```
POST /api/auth/forgot-password
Body: { "email": "user@example.com" }
Response: 200 OK (always, even if email doesn't exist)
```

### 2. Verify Reset Token
```
GET /api/auth/verify-reset-token/:token
Response: 200 OK if valid, 400 if invalid/expired/used
```

### 3. Reset Password
```
POST /api/auth/reset-password
Body: {
  "token": "token-from-email",
  "password": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
Response: 200 OK on success
```

## How It Works

1. User requests password reset by providing email
2. Backend generates a secure reset token (valid for 1 hour)
3. Reset link sent to user's email with token included
4. User clicks link and submits new password
5. Password is updated and confirmation email is sent

## Key Features

✅ **Secure Token Generation** - 64-character random tokens with SHA-256 hashing
✅ **Expired Tokens Auto-Delete** - 1 hour TTL with automatic database cleanup
✅ **One-Time Use** - Tokens can only be used once
✅ **Email Privacy** - No email validation leaks (returns 200 for non-existent emails)
✅ **Activity Logging** - All reset operations are logged
✅ **Professional Emails** - HTML formatted with branding
✅ **Strong Validation** - Password matching and minimum length checks

## Security Notes

- Tokens are never stored in plaintext (SHA-256 hashed)
- Reset links expire after 1 hour
- Tokens are marked as "used" after successful reset to prevent reuse
- Returns generic messages to prevent account enumeration
- All actions are logged for audit purposes

## Testing the Feature

### Using Postman or cURL:

1. **Request Reset:**
```bash
curl -X POST http://192.168.1.19:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

2. **Check Email** for reset link with token

3. **Verify Token** (optional):
```bash
curl http://192.168.1.19:5000/api/auth/verify-reset-token/{token-from-email}
```

4. **Reset Password:**
```bash
curl -X POST http://192.168.1.19:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token":"token-from-email",
    "password":"NewPassword123",
    "confirmPassword":"NewPassword123"
  }'
```

## Frontend Implementation Needed

Create two new pages:

### 1. Forgot Password Page
- Email input field
- Submit button
- Link to login page
- Success/error message display

### 2. Reset Password Page
- Get token from URL query parameter (`token=xxx`)
- Password input field
- Confirm password input field
- Submit button
- Password strength indicator (optional)
- Success/error message display

## Environment Configuration

Ensure these variables are set in `.env`:
```
API_BASE_URL=http://192.168.1.19:5000
MAIL_HOST=your-mail-server
MAIL_PORT=587
MAIL_USER=your-email@example.com
MAIL_PASS=your-password
MAIL_FROM=noreply@example.com
```

## Troubleshooting

**Email not sent?**
- Check MAIL_* environment variables
- Check logs for email service errors
- Verify user email address exists

**Token expired immediately?**
- Check server time is correct
- Ensure MongoDB TTL index is created (automatic)

**Can't reset password?**
- Verify token was copied correctly from email
- Check that new password is at least 6 characters
- Ensure passwords match exactly
- Try requesting new reset link if token is >1 hour old

## Next Steps

1. Test all endpoints with Postman
2. Create frontend forms for password reset
3. Update frontend routes to include new pages
4. Test complete flow end-to-end
5. Deploy to production

For detailed information, see `PASSWORD_RESET_FEATURE.md`
