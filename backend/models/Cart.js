const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Calculate total cart value helper
cartSchema.methods.calculateTotal = async function () {
    await this.populate('items.product', 'price');
    return this.items.reduce((total, item) => {
        return total + (item.product.price.current * item.quantity);
    }, 0);
};

module.exports = mongoose.model('Cart', cartSchema);
