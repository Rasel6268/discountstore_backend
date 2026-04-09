# 🔐 Auth Controller - DiscountMart Backend

## Overview

The Authentication Controller handles all user authentication operations including registration, login, logout, and session management. It uses JWT tokens for secure authentication and bcrypt for password hashing.

---

## 📋 Endpoints

### 1. Register User

```javascript
/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 */
const Register = async (req, res) => { ... }
```

**Endpoint:** `POST /api/auth/register`

**Description:** Register a new user account with email and password

**Access:** Public (No authentication required)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "01234567890"
}
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Email already registered"
}
```

**Error Response (500):**
```json
{
  "error": "Server error"
}
```

**Implementation Details:**
- Validates email format
- Checks for existing user
- Hashes password using bcrypt (10 rounds)
- Creates new user document in MongoDB
- Returns user data without password

---

### 2. Login User

```javascript
/**
 * @route POST /api/auth/login
 * @desc Login user and set JWT cookie
 * @access Public
 */
const Login = async (req, res) => { ... }
```

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate user and create JWT token session

**Access:** Public (No authentication required)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "role": "user"
  }
}
```

**Cookie Set:**
- `token` - JWT token
- `httpOnly: true` - Not accessible via JavaScript
- `secure: true` - Only sent over HTTPS in production
- `maxAge: 24 * 60 * 60 * 1000` - Expires in 24 hours
- `sameSite: 'lax'` - CSRF protection

**Error Response (400):**
```json
{
  "error": "Invalid email or password"
}
```

**Error Response (500):**
```json
{
  "error": "Server error"
}
```

**Implementation Details:**
- Validates user credentials
- Compares password using bcrypt
- Generates JWT token
- Sets secure HTTP-only cookie
- Returns user data with token

---

### 3. Logout User

```javascript
/**
 * @route POST /api/auth/logout
 * @desc Logout user (clear cookie)
 * @access Private
 */
const Logout = async (req, res) => { ... }
```

**Endpoint:** `POST /api/auth/logout`

**Description:** Logout user and clear authentication session

**Access:** Private (Authentication required)

**Headers Required:**
```
Authorization: Bearer <JWT_TOKEN>
Cookie: token=<JWT_TOKEN>
```

**Success Response (200):**
```json
{
  "message": "Logout successful"
}
```

**Error Response (401):**
```json
{
  "error": "Unauthorized"
}
```

**Error Response (500):**
```json
{
  "error": "Server error"
}
```

**Implementation Details:**
- Requires valid JWT authentication
- Clears the token cookie
- Invalidates user session
- Returns success message

---

### 4. Get Current User

```javascript
/**
 * @route GET /api/auth/me
 * @desc Get current authenticated user
 * @access Private
 */
const authMe = async (req, res) => { ... }
```

**Endpoint:** `GET /api/auth/me`

**Description:** Retrieve information about the currently authenticated user

**Access:** Private (Authentication required)

**Headers Required:**
```
Authorization: Bearer <JWT_TOKEN>
Cookie: token=<JWT_TOKEN>
```

**Success Response (200):**
```json
{
  "message": "Authenticated user",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "01234567890",
    "role": "user",
    "isBlocked": false
  }
}
```

**Error Response (401):**
```json
{
  "error": "Unauthorized"
}
```

**Error Response (500):**
```json
{
  "error": "Server error"
}
```

**Implementation Details:**
- Requires valid JWT authentication
- Returns authenticated user data from request context
- Can be used to verify token validity
- Returns complete user profile

---

## 🔐 Security Features

### Password Hashing
- **Algorithm:** bcrypt
- **Rounds:** 10
- **Process:** Passwords are hashed before storage in database

### JWT Token Management
- **Algorithm:** HS256
- **Expiration:** Configurable (default 24 hours)
- **Storage:** HTTP-only secure cookie
- **Refresh:** Support for token refresh mechanism

### Cookie Security
- **httpOnly:** True - Prevents XSS attacks
- **secure:** True (in production) - HTTPS only
- **sameSite:** 'lax' - CSRF protection
- **maxAge:** 24 hours default

### Input Validation
- Email format validation
- Password strength requirements
- User data validation using Mongoose schema

---

## 📦 Dependencies

```javascript
// Service Layer
const { RegisterService, LoginService } = require("../services/auth.service");
```

**Required Packages:**
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation
- `express` - HTTP framework
- `mongoose` - MongoDB ODM

---

## 🚀 Usage Examples

### Frontend - Register Request
```javascript
const register = async (userData) => {
  const response = await axios.post('/api/auth/register', {
    email: userData.email,
    password: userData.password,
    firstName: userData.firstName,
    lastName: userData.lastName
  });
  return response.data;
};
```

### Frontend - Login Request
```javascript
const login = async (credentials) => {
  const response = await axios.post('/api/auth/login', {
    email: credentials.email,
    password: credentials.password
  }, {
    withCredentials: true // Important for cookies
  });
  return response.data;
};
```

### Frontend - Get Current User
```javascript
const getCurrentUser = async () => {
  const response = await axios.get('/api/auth/me', {
    withCredentials: true // Important for cookies
  });
  return response.data.user;
};
```

### Frontend - Logout Request
```javascript
const logout = async () => {
  const response = await axios.post('/api/auth/logout', {}, {
    withCredentials: true // Important for cookies
  });
  return response.data;
};
```

---

## 🛡️ Error Handling

### Common Errors

| Error Code | Message | Cause |
|-----------|---------|-------|
| 400 | Email already registered | User with email exists |
| 400 | Invalid email or password | Wrong credentials |
| 401 | Unauthorized | Missing or invalid token |
| 500 | Server error | Internal server error |

---

## 📝 Environment Variables

Create a `.env` file in the backend root:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/discountmart

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=24h
BCRYPT_ROUNDS=10

# Security
SECURE_COOKIES=true
SESSION_TIMEOUT=86400000
```

---

## 🔄 Authentication Flow

```
1. User Registration
   POST /api/auth/register
   ↓
   Validate Input → Hash Password → Save User → Return User Data

2. User Login
   POST /api/auth/login
   ↓
   Validate Input → Compare Password → Generate JWT → Set Cookie → Return User Data

3. Authenticated Request
   GET /api/auth/me
   ↓
   Extract Token → Verify JWT → Retrieve User → Return User Data

4. Logout
   POST /api/auth/logout
   ↓
   Verify JWT → Clear Cookie → Return Success Message
```

---

## 📚 Related Services

- **Auth Service:** `../services/auth.service.js`
  - RegisterService()
  - LoginService()

---

## ✅ Testing

### Register Endpoint
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Login Endpoint
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -b cookies.txt
```

---

## 📖 Additional Documentation

- [User Model](../models/User.js)
- [Auth Service](../services/auth.service.js)
- [Auth Routes](../routers/auth.route.js)
- [Token Verification Middleware](../middleware/verifyToken.js)
- [Admin Verification Middleware](../middleware/AdminVerify.js)

---

**Last Updated:** April 9, 2026  
**Version:** 1.0.0  
**Status:** Active
