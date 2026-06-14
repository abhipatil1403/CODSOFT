# KAAR Studio — Premium Curated E-Commerce App

**KAAR Studio** is a full-stack, minimalist Indian e-commerce web application. The brand represents "The Maker" (Kaarigar), offering a highly curated selection of premium hand-glazed pottery, handwoven silks, organic incense, and white Makrana marble ware sourced from artisan clusters across India.

---

## Live Links
* **Live Website (Netlify):** [https://kaar-ecommerce.netlify.app/](https://kaar-ecommerce.netlify.app/)
* **API Server (Render):** [https://kaar-backend-b3ao.onrender.com/](https://kaar-backend-b3ao.onrender.com/)

---

## Tech Stack

### Frontend Client
* **Core:** React 18, Vite.
* **Styling:** Custom Vanilla CSS with a curated HSL color palette (cream/ink), fluid spacing, glassmorphic drawers, and custom micro-animations.
* **Icons:** Lucide-React.

### Backend Server
* **Environment:** Node.js, Express.js (ES Modules).
* **Database:** MongoDB Atlas (Production Cloud) with an automatic local JSON database fallback (`db_fallback.json`) for seamless local runs even without internet.
* **Security:** JSON Web Tokens (JWT) for authentication, Bcrypt.js for secure password hashing.

---

## Key Features

1. **Curated Product Catalog:** Beautiful 1:1 square aspect ratio image grid displaying authentic products, with dynamic filters for categories, custom search, and a debounced price slider.
2. **User Authentication:** Complete sign-up, login, and session persistence using secure JWT tokens.
3. **Shopping Cart:** Slide-out drawer with real-time total price calculations, item deletion, and quantity control steppers.
4. **Indian-Context Checkout:** 
   * Indian shipping address fields (State, Pincode).
   * **RuPay Card Visualizer:** Interactive credit/debit card rendering that adjusts layout and styles dynamically.
   * **BHIM UPI Scanner:** QR code scanner window showing scan simulations to complete UPI-based mock transactions.
5. **Aesthetics & Performance:** Styled using Outfit & Playfair Display typography, responsive grid views for mobile, and a dark/light mode toggle.

---

## Local Development Setup

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed.

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd E-Commerce/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables by creating a `.env` file:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_signing_secret
   ```
   *(Note: If no MONGODB_URI is provided, the server will automatically launch in Fallback Mode using a local JSON database file).*
4. Seed the database with the product catalog:
   ```bash
   npm run seed
   ```
5. Start the server:
   ```bash
   npm start
   ```
   The server will run at `http://localhost:5000`.

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd E-Commerce/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file pointing to your API URL:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   The site will open locally at `http://localhost:5173`.
