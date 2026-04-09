# 🛒 DiscountMart - eCommerce Platform

A modern, scalable eCommerce platform built with Node.js and MongoDB, featuring comprehensive product management, secure authentication, payment processing, and detailed analytics.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Core Modules](#core-modules)
3. [Technology Stack](#technology-stack)
4. [Installation](#installation)
5. [API Documentation](#api-documentation)
6. [Database Models](#database-models)

---

## 🎯 Project Overview

DiscountMart is a full-featured eCommerce platform designed to provide a seamless shopping experience for customers while offering comprehensive management tools for administrators. The platform supports multiple user roles, secure payment processing, advanced product filtering, and real-time order management.

### Key Features

- ✅ JWT-based authentication with role-based access control
- ✅ Secure password hashing using bcrypt
- ✅ Complete product management with categories and brands
- ✅ Shopping cart and wishlist functionality
- ✅ Multi-payment gateway support (Stripe, SSLCommerz, bKash)
- ✅ Location-based shipping cost management
- ✅ Advanced discount and promo code system
- ✅ Product reviews and rating system
- ✅ Comprehensive admin analytics dashboard
- ✅ Order tracking and management

---

## 🏗️ Core Modules

### 1. **Authentication Module** 🔐

Manages user authentication and authorization using JWT tokens.

**Features:**
- User registration with email validation
- Secure login with JWT token generation
- Password hashing using bcrypt
- Logout functionality with token invalidation
- Refresh token mechanism for extended sessions
- Role-based access control (Admin & User)

**Endpoints:**
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - User login
POST   /api/auth/logout        - User logout
POST   /api/auth/refresh       - Refresh authentication token
```

**Security Features:**
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with configurable expiration
- Protected routes middleware
- Admin-only route verification

---

### 2. **User Management Module** 👥

Handles user profiles and account management.

**User Capabilities:**
- Update profile information (name, email, phone)
- Change password
- View order history
- Manage wishlist
- Manage shopping cart
- View account settings

**Admin Capabilities:**
- View all registered users
- Search and filter users
- Block/Unblock users
- Delete user accounts
- View user activity logs
- Manage user roles

**Endpoints:**
```
GET    /api/users/:id          - Get user profile
PUT    /api/users/:id          - Update profile
GET    /api/users              - List all users (Admin)
DELETE /api/users/:id          - Delete user (Admin)
PUT    /api/users/:id/block    - Block/Unblock user (Admin)
GET    /api/users/:id/orders   - View user orders
```

---

### 3. **Product Module** 📦

Complete product management system.

**Product Fields:**
- Name and description
- Price and discount price
- Brand association
- Category and subcategory
- Stock quantity and availability
- Product images (multiple)
- SKU and product code
- Creation and update timestamps

**Features:**
- Full CRUD operations
- Apply and manage discounts
- Stock management
- Image upload and optimization
- Product availability status
- Bulk product management

**Endpoints:**
```
GET    /api/products           - List all products
GET    /api/products/:id       - Get product details
POST   /api/products           - Create product (Admin)
PUT    /api/products/:id       - Update product (Admin)
DELETE /api/products/:id       - Delete product (Admin)
PUT    /api/products/:id/stock - Update stock (Admin)
GET    /api/products/search    - Search products
```

---

### 4. **Category Management** 🏷️

Organize products by categories and subcategories.

**Category Structure:**
- Primary categories (Electronics, Fashion, Home, Sports, etc.)
- Subcategories under each primary category
- Description and image for each category
- Active/Inactive status

**Example Categories:**
```
Electronics
├── Smartphones
├── Laptops
├── Tablets
└── Accessories

Fashion
├── Men's Clothing
├── Women's Clothing
├── Footwear
└── Accessories

Home & Kitchen
├── Furniture
├── Cookware
├── Decor
└── Bedding
```

**Admin CRUD Operations:**
- Create new categories and subcategories
- Update category details
- Delete categories (with product reassignment)
- Manage category visibility
- Reorder categories

**Endpoints:**
```
GET    /api/categories         - List all categories
POST   /api/categories         - Create category (Admin)
PUT    /api/categories/:id     - Update category (Admin)
DELETE /api/categories/:id     - Delete category (Admin)
```

---

### 5. **Brand Management** 🏢

Manage product brands and manufacturer information.

**Brand Features:**
- Brand name and logo
- Description and origin country
- Contact information
- Featured status
- Verification status

**Admin Operations:**
- Add new brands
- Update brand information
- Delete brands
- Feature brands on homepage
- Verify brands

**Endpoints:**
```
GET    /api/brands             - List all brands
POST   /api/brands             - Create brand (Admin)
PUT    /api/brands/:id         - Update brand (Admin)
DELETE /api/brands/:id         - Delete brand (Admin)
```

---

### 6. **Cart Module** 🛒

Shopping cart functionality with item management.

**Cart Features:**
- Add products to cart
- Remove products from cart
- Update product quantity
- Store product ID, quantity, and current price
- Apply discount prices automatically
- Calculate total cart value
- Persistent cart storage

**Endpoints:**
```
GET    /api/cart               - Get user's cart
POST   /api/cart/add           - Add product to cart
PUT    /api/cart/:productId    - Update product quantity
DELETE /api/cart/:productId    - Remove product from cart
DELETE /api/cart              - Clear entire cart
```

---

### 7. **Wishlist Module** ❤️

Save favorite products for later purchase.

**Wishlist Features:**
- Add products to wishlist
- Remove products from wishlist
- Move products to cart
- View all wishlisted items
- Get product availability updates
- Store user ID and product IDs

**Endpoints:**
```
GET    /api/wishlist           - Get user's wishlist
POST   /api/wishlist/add       - Add product to wishlist
DELETE /api/wishlist/:productId - Remove from wishlist
POST   /api/wishlist/:productId/move-to-cart - Move to cart
```

---

### 8. **Order Module** 📦

Complete order management system.

**Order Workflow:**
1. Cart → Review items
2. Checkout → Enter shipping details
3. Payment → Select payment method
4. Order Confirmation → Receive order ID

**Order Fields:**
- Order ID (unique)
- User reference
- Product list with quantities
- Total amount
- Shipping address
- Order status (Pending, Processing, Shipped, Delivered, Cancelled)
- Creation and update timestamps
- Expected delivery date

**Order Status Flow:**
```
Pending → Processing → Shipped → Delivered → Completed
   ↓
Cancelled (anytime)
```

**Endpoints:**
```
GET    /api/orders             - Get user's orders
GET    /api/orders/:orderId    - Get order details
POST   /api/orders             - Create new order
PUT    /api/orders/:orderId    - Update order (Admin)
DELETE /api/orders/:orderId    - Cancel order
GET    /api/orders             - List all orders (Admin)
```

---

### 9. **Payment Module** 💳

Multi-gateway payment processing.

**Payment Methods:**

**Online Payments:**
- Stripe integration for international cards
- SSLCommerz for local payments (Bangladesh)
- bKash for mobile payment

**Cash on Delivery (COD):**
- COD option for selected locations
- Payment on delivery confirmation

**Payment Fields:**
- Transaction ID
- Order ID reference
- Payment method
- Amount
- Currency
- Payment status (Pending, Success, Failed, Refunded)
- Timestamp

**Features:**
- Secure payment gateway integration
- Payment verification
- Refund processing
- Transaction history
- Invoice generation

**Endpoints:**
```
POST   /api/payments           - Initiate payment
GET    /api/payments/:transactionId - Get payment status
POST   /api/payments/:transactionId/verify - Verify payment
POST   /api/payments/:transactionId/refund - Process refund
```

---

### 10. **Shipping Management** 🚚

Location-based shipping cost calculation.

**Shipping Features:**
- Admin-configured shipping costs by district and city
- Different rates for urban and rural areas
- Regional pricing logic

**Example Shipping Rates:**

**Dhaka District:**
```
Inside Dhaka City    - 50 BDT
Outside Dhaka City   - 60 BDT
```

**Outside Dhaka:**
```
Chittagong Division  - 80 BDT
Rajshahi Division    - 100 BDT
Khulna Division      - 100 BDT
Sylhet Division      - 120 BDT
```

**Admin Operations:**
- Set shipping cost by location
- Update rates
- Create shipping zones
- Manage delivery partners
- Track shipments

**Endpoints:**
```
GET    /api/shipping/cost      - Calculate shipping
POST   /api/shipping/zones     - Create zone (Admin)
PUT    /api/shipping/zones/:id - Update zone (Admin)
GET    /api/shipping/zones     - List all zones
```

---

### 11. **Transaction Module** 💰

Payment transaction record keeping.

**Transaction Fields:**
- Unique Transaction ID
- Order ID reference
- User information
- Payment method
- Amount
- Currency
- Transaction status
- Timestamp and completion time

**Transaction States:**
- Pending - Awaiting payment confirmation
- Processing - Payment being processed
- Completed - Payment successful
- Failed - Payment unsuccessful
- Refunded - Amount refunded to user

**Endpoints:**
```
GET    /api/transactions       - List transactions (Admin)
GET    /api/transactions/:id   - Get transaction details
GET    /api/transactions/user/:userId - User transactions
```

---

### 12. **Product Reviews & Ratings** ⭐

User feedback and rating system.

**Review Features:**
- 5-star rating system
- Written text review
- Review moderation
- Helpful vote system
- One review per user per product
- Review after purchase requirement
- Average rating calculation
- Total review count

**Review Fields:**
- User information
- Product reference
- Rating (1-5 stars)
- Review title
- Review content
- Uploaded images/videos
- Helpful votes
- Creation timestamp

**Features:**
- Display average rating
- Show review count
- Filter by rating
- Sort by most helpful
- Admin can approve/reject reviews
- Delete inappropriate reviews

**Endpoints:**
```
GET    /api/reviews/:productId - Get product reviews
POST   /api/reviews             - Create review
PUT    /api/reviews/:reviewId   - Update review
DELETE /api/reviews/:reviewId   - Delete review (Admin)
GET    /api/reviews             - List all reviews (Admin)
```

---

### 13. **Discount System** 🎉

Comprehensive promotion and discount management.

**Seasonal Discounts:**

**Eid Festival:**
- 15-30% off selected categories
- Buy more save more offers
- Free shipping on orders above 5000 BDT

**Pohela Boishakh:**
- 20% off on traditional items
- Bundle deals
- Early bird discounts

**Puja Festival:**
- 25% off on fashion items
- New collection discounts
- Flash sales

**Promo Codes:**
- Unique code generation
- Fixed amount discount (200 BDT off)
- Percentage discount (10% off)
- Minimum purchase requirement
- Maximum usage limit
- Expiry date
- Active/Inactive status
- One-time or reusable codes

**Discount Rules:**
- Stack limitation (only one promo code per order)
- Seasonal discount compatibility
- Category-specific discounts
- Brand-specific discounts
- User-group specific discounts

**Admin Features:**
- Create seasonal campaigns
- Generate promo codes
- Set discount rules
- Monitor discount usage
- View discount analytics

**Endpoints:**
```
GET    /api/discounts          - Get active discounts
POST   /api/discounts          - Create discount (Admin)
POST   /api/promo-codes        - Generate promo codes (Admin)
GET    /api/promo-codes/:code  - Validate promo code
POST   /api/discounts/apply    - Apply discount to cart
```

---

### 14. **Admin Analytics Dashboard** 📊

Comprehensive business intelligence and reporting.

**Dashboard Metrics:**

**Overview Section:**
- Total Sales Revenue (current month/year)
- Total Orders (pending, processing, delivered)
- Total Users (active, inactive, new)
- Total Products (in stock, out of stock)

**Charts & Graphs:**
- Sales trend line chart (daily, weekly, monthly)
- Order status pie chart
- Revenue by category bar chart
- Top 10 products by sales
- User growth trend
- Payment method distribution

**Filters:**
- Date range selection
- Category-wise filtering
- Payment method filter
- Order status filter
- User segment filter

**Reports:**
- Category-wise sales breakdown
- Order status summary
- Revenue by payment method
- Customer acquisition metrics
- Product performance analysis
- Inventory levels
- Customer lifetime value

**Endpoints:**
```
GET    /api/admin/dashboard    - Get dashboard data
GET    /api/admin/sales        - Sales analytics
GET    /api/admin/orders       - Order analytics
GET    /api/admin/users        - User analytics
GET    /api/admin/products     - Product analytics
GET    /api/admin/reports      - Generate reports
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 13+ with React
- **Styling:** Tailwind CSS for responsive design
- **HTTP Client:** Axios for API requests
- **State Management:** Context API / Redux Toolkit
- **Data Fetching:** React Query (TanStack Query)
- **UI Components:** Headless UI / Shadcn UI
- **Charting:** Chart.js / Recharts for analytics
- **Form Handling:** React Hook Form
- **Validation:** Zod / Yup

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js 4+
- **Database:** MongoDB 5+
- **ODM:** Mongoose for schema validation
- **Authentication:** JWT (jsonwebtoken)
- **Password Security:** bcrypt for hashing

### Security & Middleware
- **JWT:** jsonwebtoken for token management
- **Password Hashing:** bcrypt for secure storage
- **Cookie Management:** cookie-parser
- **Security Headers:** helmet for HTTP headers
- **CORS:** Express CORS for cross-origin requests
- **Input Validation:** express-validator / joi

### Payment Gateways
- **Stripe:** International card payments
- **SSLCommerz:** Local Bangladesh payment gateway
- **bKash:** Mobile banking integration

### File Management
- **Cloud Storage:** Cloudinary for image hosting
- **File Upload:** Multer for handling file uploads
- **Image Processing:** Sharp for optimization

### Development Tools
- **Package Manager:** npm or yarn
- **Version Control:** Git & GitHub
- **Environment:** dotenv for configuration
- **Logging:** Winston or Morgan
- **Testing:** Jest for unit testing
- **Code Quality:** ESLint and Prettier

---

## 🚀 Installation

### Prerequisites
- Node.js 18+ installed
- MongoDB 5+ installed and running
- npm or yarn package manager

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/discountmart.git
cd discountmart/backend

# Install dependencies
npm install

# Create .env file with configuration
cp .env.example .env

# Configure environment variables
MONGODB_URI=mongodb://localhost:27017/discountmart
JWT_SECRET=your_jwt_secret_key
BCRYPT_ROUNDS=10
NODE_ENV=development

# Start the server
npm start

# For development with auto-reload
npm run dev
```

### Frontend Setup

```bash
# Navigate to client directory
cd ../client

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Configure API endpoints
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Start development server
npm run dev
```

---

## 📚 Database Models

### User Model
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  address: String,
  city: String,
  district: String,
  role: Enum ["user", "admin"],
  isBlocked: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Product Model
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  price: Number,
  discountPrice: Number,
  brand: ObjectId (ref: Brand),
  category: ObjectId (ref: Category),
  subcategory: ObjectId (ref: Subcategory),
  stock: Number,
  images: [String],
  sku: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Order Model
```javascript
{
  _id: ObjectId,
  orderId: String (unique),
  user: ObjectId (ref: User),
  products: [
    {
      product: ObjectId,
      quantity: Number,
      price: Number
    }
  ],
  totalAmount: Number,
  shippingAddress: {
    street: String,
    city: String,
    district: String,
    postalCode: String
  },
  status: Enum ["pending", "processing", "shipped", "delivered", "cancelled"],
  paymentMethod: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Model
```javascript
{
  _id: ObjectId,
  transactionId: String (unique),
  order: ObjectId (ref: Order),
  user: ObjectId (ref: User),
  amount: Number,
  currency: String,
  method: String,
  status: Enum ["pending", "processing", "completed", "failed", "refunded"],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📖 API Documentation

Full API documentation is available at `/api/docs` when the server is running.

### Authentication Headers
```
Authorization: Bearer <JWT_TOKEN>
```

### Common Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

---

## 🔒 Security Best Practices

- ✅ Always use HTTPS in production
- ✅ Implement rate limiting on API endpoints
- ✅ Use environment variables for sensitive data
- ✅ Validate and sanitize all user inputs
- ✅ Implement CSRF protection
- ✅ Use secure session management
- ✅ Regular security audits
- ✅ Implement proper error handling
- ✅ Use helmet for secure HTTP headers
- ✅ Implement password strength requirements

---

## 📝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Support

For support, email support@discountmart.com or open an issue in the repository.

---

**Last Updated:** April 9, 2026

**Version:** 1.0.0
