const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Item name is required'],
            trim: true,
        },
        category: {
            type: String,
            trim: true,
            default: 'General',
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: 0,
        },
        stock: {
            type: Number,
            required: [true, 'Stock is required'],
            min: 0,
            default: 0,
        },
        unit: {
            type: String,
            default: 'piece',
            trim: true,
        },
        store: {
            type: String,
            trim: true,
            default: 'Main Store',
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Item', itemSchema);
