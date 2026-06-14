import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

// @route   GET api/products
// @desc    Get all products (with optional search, category, and price filters)
router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;
    let filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }

    // Handle filtering by price
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let products = await Product.find(filter);

    // Apply search filter in-memory if it's fallback mode or if mongo filter is simpler
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(
        p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
      );
    }

    res.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ message: 'Server error retrieving products' });
  }
});

// @route   GET api/products/:id
// @desc    Get a single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ message: 'Server error retrieving product detail' });
  }
});

export default router;
