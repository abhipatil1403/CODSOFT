import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FALLBACK_FILE = path.join(__dirname, 'db_fallback.json');

export let isFallbackMode = false;

// Mock database storage
const fallbackDb = {
  users: [],
  products: [],
  orders: []
};

// Helper to load/save JSON database
const loadFallbackDb = () => {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = fs.readFileSync(FALLBACK_FILE, 'utf8');
      const parsed = JSON.parse(data);
      fallbackDb.users = parsed.users || [];
      fallbackDb.products = parsed.products || [];
      fallbackDb.orders = parsed.orders || [];
    } else {
      saveFallbackDb();
    }
  } catch (err) {
    console.error('Error loading fallback JSON database:', err);
  }
};

const saveFallbackDb = () => {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(fallbackDb, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving fallback JSON database:', err);
  }
};

// Connect to MongoDB with timeout, fallback on failure
export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kaar';
  try {
    console.log('Attempting to connect to MongoDB...');
    mongoose.set('strictQuery', false);
    // Connect with a 3-second timeout so it fails fast if MongoDB is not running
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('MongoDB Connected successfully.');
  } catch (error) {
    console.warn('\n⚠️  MongoDB connection failed or not available.');
    console.warn('⚡ Fallback Mode Active: Using local JSON database storage.');
    console.warn(`📂 Database path: ${FALLBACK_FILE}\n`);
    isFallbackMode = true;
    loadFallbackDb();
  }
};

// Mock Query Class to mimic Mongoose syntax
class MockQuery {
  constructor(data) {
    this.data = data;
  }
  find(filter = {}) {
    let result = [...this.data];
    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined) {
        result = result.filter(item => {
          if (typeof value === 'object' && value !== null) {
            // Support simple range queries like $lte, $gte
            if ('$gte' in value && item[key] < value.$gte) return false;
            if ('$lte' in value && item[key] > value.$lte) return false;
            return true;
          }
          if (typeof item[key] === 'string' && typeof value === 'string') {
            return item[key].toLowerCase() === value.toLowerCase();
          }
          return item[key] === value;
        });
      }
    }
    this.data = result;
    return this;
  }
  findOne(filter = {}) {
    this.find(filter);
    return this.data[0] || null;
  }
  async exec() {
    return this.data;
  }
  // Allow thenable
  then(resolve, reject) {
    return Promise.resolve(this.data).then(resolve, reject);
  }
}

// Fallback Model Wrapper
export const getModel = (name, mongooseModel) => {
  if (!isFallbackMode) {
    return mongooseModel;
  }

  const collectionName = name.toLowerCase() + 's';
  
  return {
    find: (filter) => {
      loadFallbackDb();
      return new MockQuery(fallbackDb[collectionName]).find(filter);
    },
    findOne: (filter) => {
      loadFallbackDb();
      const q = new MockQuery(fallbackDb[collectionName]);
      const res = q.findOne(filter);
      return res;
    },
    findById: (id) => {
      loadFallbackDb();
      return fallbackDb[collectionName].find(item => item._id === id) || null;
    },
    create: async (data) => {
      loadFallbackDb();
      const newItem = {
        _id: Math.random().toString(36).substring(2, 11),
        createdAt: new Date().toISOString(),
        ...data
      };
      // Mock save methods
      newItem.save = async function() {
        return this;
      };
      fallbackDb[collectionName].push(newItem);
      saveFallbackDb();
      return newItem;
    },
    insertMany: async (items) => {
      loadFallbackDb();
      const createdItems = items.map(item => ({
        _id: Math.random().toString(36).substring(2, 11),
        createdAt: new Date().toISOString(),
        ...item
      }));
      fallbackDb[collectionName].push(...createdItems);
      saveFallbackDb();
      return createdItems;
    },
    deleteMany: async () => {
      loadFallbackDb();
      fallbackDb[collectionName] = [];
      saveFallbackDb();
      return { deletedCount: 0 };
    }
  };
};
