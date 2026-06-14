import mongoose from 'mongoose';
import { getModel } from '../db.js';

const OrderSchema = new mongoose.Schema({
  user: {
    type: String, // String ID for fallback simplicity
    required: true
  },
  items: [
    {
      product: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      quantity: {
        type: Number,
        required: true
      }
    }
  ],
  shippingAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  paymentMethod: {
    type: String,
    default: 'Credit Card'
  },
  totalPrice: {
    type: Number,
    required: true
  },
  isPaid: {
    type: Boolean,
    default: true
  },
  paidAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MongooseOrderModel = mongoose.model('Order', OrderSchema);

export default getModel('Order', MongooseOrderModel);
