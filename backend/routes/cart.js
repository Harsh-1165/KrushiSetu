const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// Middleware to ensure user is authenticated
router.use(authenticate);

// @route   GET /api/v1/cart
// @desc    Get user's cart
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
        path: 'items.product',
        select: 'name price images inventory.available inventory.minOrder inventory.maxOrder unit'
    });

    if (!cart) {
        cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Filter out items where product no longer exists
    const validItems = cart.items.filter(item => item.product);
    if (validItems.length !== cart.items.length) {
        cart.items = validItems;
        await cart.save();
    }

    // Recalculate totals or enrich data if needed, but for now return cart
    res.status(200).json({
        success: true,
        data: cart
    });
}));

// @route   POST /api/v1/cart/add
// @desc    Add item to cart
// @access  Private
// Body: { productId, quantity }
router.post('/add', asyncHandler(async (req, res) => {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
        throw new AppError('Product ID is required', 400);
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    if (product.inventory.available < quantity) {
        throw new AppError(`Not enough stock. Available: ${product.inventory.available}`, 400);
    }

    // Enforce minimum order quantity at add-to-cart time
    const minOrder = product.inventory?.minOrder || 1;
    if (quantity < minOrder) {
        throw new AppError(`Minimum order quantity for ${product.name} is ${minOrder}`, 400);
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        cart = await Cart.create({
            user: req.user._id,
            items: [{ product: productId, quantity }]
        });
    } else {
        // Check if product already exists in cart
        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

        if (itemIndex > -1) {
            // Update quantity
            const newQuantity = cart.items[itemIndex].quantity + quantity;

            // Check stock limit for new total
            if (product.inventory.available < newQuantity) {
                throw new AppError(`Cannot add more. Max available: ${product.inventory.available}`, 400);
            }

            cart.items[itemIndex].quantity = newQuantity;
        } else {
            // Add new item
            cart.items.push({ product: productId, quantity });
        }
        await cart.save();
    }

    // Populate for response
    await cart.populate({
        path: 'items.product',
        select: 'name price images inventory.available inventory.minOrder inventory.maxOrder unit'
    });

    res.status(200).json({
        success: true,
        message: 'Item added to cart',
        data: cart
    });
}));

// @route   PUT /api/v1/cart/update
// @desc    Update item quantity
// @access  Private
// Body: { productId, quantity }
router.put('/update', asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
        throw new AppError('Product ID and quantity are required', 400);
    }

    if (quantity < 1) {
        throw new AppError('Quantity must be at least 1', 400);
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        throw new AppError('Cart not found', 404);
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex === -1) {
        throw new AppError('Item not found in cart', 404);
    }

    // Check stock
    const product = await Product.findById(productId);
    if (!product) {
        // If product deleted, remove from cart
        cart.items.pull({ _id: cart.items[itemIndex]._id });
        await cart.save();
        throw new AppError('Product no longer available', 404);
    }

    if (product.inventory.available < quantity) {
        throw new AppError(`Not enough stock. Available: ${product.inventory.available}`, 400);
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    await cart.populate({
        path: 'items.product',
        select: 'name price images inventory.available inventory.minOrder inventory.maxOrder unit'
    });

    res.status(200).json({
        success: true,
        message: 'Cart updated',
        data: cart
    });
}));

// @route   DELETE /api/v1/cart/remove/:productId
// @desc    Remove item from cart
// @access  Private
router.delete('/remove/:productId', asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        throw new AppError('Cart not found', 404);
    }

    // Filter out the item
    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    await cart.save();

    await cart.populate({
        path: 'items.product',
        select: 'name price images inventory.available inventory.minOrder inventory.maxOrder unit'
    });

    res.status(200).json({
        success: true,
        message: 'Item removed',
        data: cart
    });
}));

// @route   DELETE /api/v1/cart/clear
// @desc    Clear entire cart
// @access  Private
router.delete('/clear', asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
        cart.items = [];
        await cart.save();
    }

    res.status(200).json({
        success: true,
        message: 'Cart cleared',
        data: { items: [] }
    });
}));

module.exports = router;
