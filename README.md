# FoodiesHub - Food Delivery Web Application

A comprehensive food delivery platform built with React and Firebase, similar to Foodpanda. This is a Final Year Project (FYP) featuring role-based access control, AI-powered recommendations, and real-time order tracking.

## Tech Stack

### Frontend
- **React**
- **JavaScript**
- **Tailwind CSS**
- **shadcn/ui** 
- **React Router**

### Backend / BaaS
- **Firebase Authentication**
- **Firestore** 
- **Supabase Storage**

### AI
- **Google Gemini API**
  - Nutrition estimation
  - Context-restricted chatbot

## Features by Role

### Buyer (Customer)
- Browse stores with city-based filtering
- Select group size (Individual, 2-3, 4-6, or custom)
- Shopping cart functionality
- Checkout with Cash on Delivery (COD) or demo online payment
- View food nutrition details (Calories, Protein, Carbs, Fat)
- Live order tracking (Pending → Accepted → Preparing → Ready → Picked Up → Delivering → Delivered)

### Seller (Restaurant Owner)
- Create and manage ONE store per seller
- Store management (name, description, city, logo)
- Food item management:
  - Add/edit/delete food items
  - Set prices, descriptions, categories
  - Upload food images
  - Manage stock status
  - Nutrition information (manual entry or AI-generated)
- Order management:
  - Accept/reject orders
  - Update order status (Accepted → Preparing → Ready)

### Rider (Delivery Person)
- Requires admin approval
- Online/Offline status toggle
- Available/Busy availability status
- View available orders
- Accept/reject orders manually
- OTP-based delivery confirmation
- Upload profile image

### Admin (Email-Based Access Only)
- **Single admin** identified by email from `.env`
- Approve/reject sellers
- Approve/reject riders
- View all users, stores, and orders
- Simple dashboard with counts

## AI Features

### 1. Floating AI Chatbot
- Floating widget in bottom-right corner
- Restricted to FoodiesHub context only
- Capabilities:
  - Website FAQs
  - Food recommendations
  - Nutrition explanations
- Will NOT answer unrelated questions

### 2. Nutrition Generator (Seller Side)
- Toggle-based activation
- Uses food name, description, category, and portion size
- Returns: Calories, Protein, Carbs, Fat
- Saved permanently in Firestore

## Database Schema

See `DATABASE_SCHEMA.md` for complete Firestore collection structure.

### Collections:
- `users` - User accounts and roles
- `stores` - Restaurant/store information
- `foodItems` - Food menu items
- `orders` - Order information
- `riders` - Rider-specific data
- `reviews` - Reviews and ratings

## Authentication & Authorization

- **Email + Password** authentication only
- **Role-based access** using Firestore (Buyer / Seller / Rider)
- **Admin access** is email-based only (NOT stored in Firestore)
- Sellers and Riders require Admin approval
- Buyers are active immediately

### Admin Access Logic
- Admin is identified ONLY by email matching `VITE_ADMIN_EMAIL` from `.env`
- Admin panel is completely hidden for normal users
- Admin routes are protected
- Admin does NOT appear in users list as a role

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project
- Google Gemini API key
- Supabase API key

### 1. Clone the Repository
```bash
git clone <repository-url>
cd FoodiesHub
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=firebaseapikey
VITE_FIREBASE_AUTH_DOMAIN=firebaseauthdomain
VITE_FIREBASE_PROJECT_ID=firebaseprojectid
VITE_FIREBASE_STORAGE_BUCKET=firebasestoragebucket
VITE_FIREBASE_MESSAGING_SENDER_ID=firebasemessagingsenderid
VITE_FIREBASE_APP_ID=firebaseappid

# Google Gemini API
VITE_GEMINI_API_KEY=geminiapikey

# Admin Access (Email-based only)
VITE_ADMIN_EMAIL=adminemail

# Supabase
VITE_SUPABASE_URL=supabaseurl
VITE_SUPABASE_ANON_KEY=supabasepublishableapikey
VITE_SUPABASE_BUCKET_NAME=supabasebucketname
```

### 4. Firebase Setup

#### 4.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Create Firestore database

#### 4.2 Configure Authentication
1. Go to Authentication → Sign-in method
2. Enable Email/Password provider

#### 4.3 Set Up Firestore
1. Go to Firestore Database
2. Create the following collections (they will be created automatically when used):
   - `users`
   - `stores`
   - `foodItems`
   - `orders`
   - `riders`
   - `reviews`

#### 4.4 Set Up Storage
1. Go to Storage
2. Create the following folders (they will be created automatically):
   - `store-logos/`
   - `food-images/`
   - `rider-profiles/`

#### 4.5 Deploy Security Rules
1. Go to Firestore Database → Rules
2. Copy and paste the contents of `firestore.rules`
3. Go to Storage → Rules
4. Copy and paste the contents of `storage.rules`
5. **Important**: Update the admin email in `firestore.rules` and `storage.rules` to match your `VITE_ADMIN_EMAIL`

#### 4.6 Create Firestore Indexes
Create the following composite indexes in Firestore:
1. `stores`: `city` (for city-based filtering)
2. `foodItems`: `storeId`, `category`
3. `orders`: `buyerId`, `orderStatus`
4. `orders`: `storeId`, `orderStatus`
5. `orders`: `riderId`, `orderStatus`
6. `reviews`: `targetId`, `type`

### 5. Google Gemini API Setup
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file as `VITE_GEMINI_API_KEY`

### 6. Run the Application
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
FoodiesHub/
├── src/
│   ├── components/       # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── AIChatbot.jsx
│   ├── pages/            # Page components
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── buyer/
│   │   ├── seller/
│   │   ├── rider/
│   │   └── admin/
│   ├── services/         # API and service functions
│   │   ├── firebase.js
│   │   ├── authService.js
│   │   ├── storeService.js
│   │   ├── orderService.js
│   │   ├── gemini.js
│   │   └── ...
│   ├── contexts/         # React contexts
│   │   ├── AuthContext.jsx
│   │   └── CartContext.jsx
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Utility functions
│   │   └── cn.js
│   ├── App.jsx           # Main app component
│   └── main.jsx          # Entry point
├── firestore.rules       # Firestore security rules
├── storage.rules         # Storage security rules
├── DATABASE_SCHEMA.md    # Database schema documentation
├── env.example           # Environment variables template
└── README.md             # This file
```

## 🔒 Security Rules

### Firestore Rules
- Admin email has full access
- Sellers can manage only their store & items
- Buyers can only create orders & reviews
- Riders can update only assigned orders
- No unauthorized reads/writes

### Storage Rules
- Store logos: Sellers can upload for their store
- Food images: Sellers can upload
- Rider profiles: Riders can upload their own images

**Important**: Update the admin email in both rule files to match your `.env` configuration.

## 🎯 Key Features Explained

### Group Size Selection
Buyers can select:
- Individual
- 2-3 people
- 4-6 people
- Custom number

This selection is used for AI recommendations and stored with orders.

### AI Recommendations
- Based on group size
- Optional filters: calories, budget, food category
- Uses Google Gemini API
- Returns personalized food suggestions

### Order Status Flow
1. **Pending** - Order placed, awaiting seller acceptance
2. **Accepted** - Seller accepted the order
3. **Preparing** - Seller is preparing the order
4. **Ready** - Order is ready for pickup
5. **Picked Up** - Rider picked up the order
6. **Delivering** - Rider is delivering (OTP generated)
7. **Delivered** - Order completed

### OTP Delivery Confirmation
- Generated when rider starts delivering
- 4-digit code
- Shown to buyer in order details
- Used for delivery confirmation

## 🧪 Testing

### Test Accounts
1. Create a buyer account
2. Create a seller account (will need admin approval)
3. Create a rider account (will need admin approval)
4. Login as admin (using `VITE_ADMIN_EMAIL`) to approve sellers/riders

### Test Flow
1. **Buyer**: Browse stores → Add items to cart → Checkout → Track order
2. **Seller**: Create store → Add food items → Manage orders
3. **Rider**: Go online → Accept orders → Deliver orders
4. **Admin**: Approve sellers/riders → View all data

## 📝 Notes

- **No user avatars** for buyers/users (only riders have profile images)
- **One store per seller** - enforced in code and Firestore rules
- **Admin is NOT a role** - it's email-based only
- **Real-time updates** using Firestore listeners
- **Clean, simple code** - appropriate for FYP

## 🐛 Troubleshooting

### Firebase Connection Issues
- Verify all environment variables are set correctly
- Check Firebase project settings
- Ensure Firestore and Storage are enabled

### AI Features Not Working
- Verify Gemini API key is correct
- Check API quota limits
- Ensure network connectivity

### Authentication Issues
- Verify Firebase Authentication is enabled
- Check email/password provider is active
- Review browser console for errors

### Permission Denied Errors
- Check Firestore security rules
- Verify Storage security rules
- Ensure admin email matches in rules and `.env`

## 📄 License

This project is created for educational purposes as a Final Year Project.

## 👨‍💻 Development

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Linting
```bash
npm run lint
```

## 🤝 Contributing

This is a Final Year Project. For questions or issues, please contact the project maintainer.

---

**Built with ❤️ for FoodiesHub**
