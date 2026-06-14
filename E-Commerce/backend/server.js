import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the KAAR API Server' });
});

const PORT = process.env.PORT || 5000;

// Start Server after connecting DB
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 KAAR API Server running on port ${PORT}`);
  });
};

startServer();
