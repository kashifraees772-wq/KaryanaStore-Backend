const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

// GET all items for settings view
router.get('/items', async (req, res) => {
    try {
        const items = await Item.find().sort({ name: 1 });
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT update item settings (name, price, stock, category, unit)
router.put('/items/:id', async (req, res) => {
    try {
        const { name, price, stock, category, unit, store } = req.body;
        const updated = await Item.findByIdAndUpdate(
            req.params.id,
            { name, price, stock, category, unit, store },
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: 'Item not found' });
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

module.exports = router;
