import mongoose from 'mongoose';
import { getModel } from '../db.js';

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  images: {
    type: [String],
    default: []
  },
  category: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    default: 10
  },
  features: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MongooseProductModel = mongoose.model('Product', ProductSchema);

export default getModel('Product', MongooseProductModel);
