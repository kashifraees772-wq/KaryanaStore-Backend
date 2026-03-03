const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
    {
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            required: [true, 'Item reference is required'],
        },
        itemName: {
            type: String,
            required: true,
        },
        quantitySold: {
            type: Number,
            required: [true, 'Quantity sold is required'],
            min: [1, 'Quantity must be at least 1'],
        },
        salePrice: {
            type: Number,
            required: [true, 'Sale price is required'],
            min: 0,
        },
        totalAmount: {
            type: Number,
        },
        note: {
            type: String,
            trim: true,
        },
        billId: {
            type: String,
            default: null,
        },
        billNumber: {
            type: String,
            default: null,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Auto-calculate totalAmount before saving
saleSchema.pre('save', function (next) {
    this.totalAmount = this.salePrice * this.quantitySold;
    next();
});

module.exports = mongoose.model('Sale', saleSchema);
