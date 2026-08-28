import express from 'express';
import Product from '../models/Product.js';
import { addToCart, getCart } from '../tools/productTools.js';

const router = express.Router();

const demoUserId = 'demo-user';

// GET CURRENT CART
router.get('/cart/current', async (_req, res) => {
  try {
    const cart = await getCart(demoUserId);
    res.status(cart.success ? 200 : 500).json(cart);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ADD TO CART
router.post('/cart', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        error: 'productId and a positive integer quantity are required.',
      });
    }

    const result = await addToCart(demoUserId, productId, quantity);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET ALL PRODUCTS
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET SINGLE PRODUCT
router.get('/:id', async (req, res) => {
  try {
    // const id = NUMBER(req.params.id);

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
