const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Item = require('../models/Item');
const crypto = require('crypto');

// GET next bill number (peek without creating)
router.get('/next-bill-number', async (req, res) => {
    try {
        const lastSale = await Sale.findOne({ billNumber: { $ne: null } })
            .sort({ createdAt: -1 }).select('billNumber');
        let nextNum = 1;
        if (lastSale?.billNumber) {
            const match = lastSale.billNumber.match(/BL-(\d+)/);
            if (match) nextNum = parseInt(match[1]) + 1;
        }
        res.json({ billNumber: `BL-${String(nextNum).padStart(4, '0')}` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET all sales (item-wise, flat list)
router.get('/', async (req, res) => {
    try {
        const sales = await Sale.find().sort({ date: -1 }).limit(200);
        res.json({ success: true, data: sales });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET bill-wise grouped sales
router.get('/bills', async (req, res) => {
    try {
        const sales = await Sale.find().sort({ date: -1 }).limit(500);

        // Group by billId (or by _id for single-item sales without billId)
        const billMap = {};
        sales.forEach(s => {
            const key = s.billId || s._id.toString();
            if (!billMap[key]) {
                billMap[key] = {
                    billId: key,
                    billNumber: s.billNumber || null,
                    date: s.date,
                    note: s.note,
                    items: [],
                    totalAmount: 0,
                    totalUnits: 0,
                };
            }
            billMap[key].items.push({
                _id: s._id,
                itemName: s.itemName,
                quantitySold: s.quantitySold,
                salePrice: s.salePrice,
                totalAmount: s.totalAmount,
            });
            billMap[key].totalAmount += s.totalAmount;
            billMap[key].totalUnits += s.quantitySold;
        });

        const bills = Object.values(billMap).sort((a, b) => new Date(b.date) - new Date(a.date));
        res.json({ success: true, data: bills });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /bulk — sell multiple items at once (all tagged with same billId)
router.post('/bulk', async (req, res) => {
    try {
        const { items: saleItems, date, note } = req.body;
        if (!saleItems || saleItems.length === 0)
            return res.status(400).json({ success: false, message: 'No items provided' });

        // Step 1: Fetch all DB items & validate stock
        const dbItems = await Promise.all(saleItems.map(s => Item.findById(s.itemId)));
        for (let i = 0; i < dbItems.length; i++) {
            const dbItem = dbItems[i];
            const { quantitySold } = saleItems[i];
            if (!dbItem) return res.status(404).json({ success: false, message: 'Item not found' });
            if (dbItem.stock < quantitySold) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for "${dbItem.name}". Available: ${dbItem.stock} ${dbItem.unit}`,
                });
            }
        }

        // Step 2: Generate unique billId and sequential billNumber
        const billId = crypto.randomBytes(8).toString('hex');
        // Find last bill number and increment
        const lastSale = await Sale.findOne({ billNumber: { $ne: null } })
            .sort({ createdAt: -1 }).select('billNumber');
        let nextNum = 1;
        if (lastSale?.billNumber) {
            const match = lastSale.billNumber.match(/BL-(\d+)/);
            if (match) nextNum = parseInt(match[1]) + 1;
        }
        const billNumber = `BL-${String(nextNum).padStart(4, '0')}`;
        const saleDate = date ? new Date(date) : new Date();

        // Step 3: Record all sales & deduct stock
        const insertedSales = [];
        for (let i = 0; i < dbItems.length; i++) {
            const dbItem = dbItems[i];
            const { quantitySold, salePrice } = saleItems[i];
            const sale = await Sale.create({
                item: dbItem._id,
                itemName: dbItem.name,
                quantitySold,
                salePrice,
                totalAmount: salePrice * quantitySold,
                note: note || '',
                billId,
                billNumber,
                date: saleDate,
            });
            dbItem.stock -= quantitySold;
            await dbItem.save();
            insertedSales.push(sale);
        }

        res.status(201).json({ success: true, data: insertedSales, billId, billNumber, count: insertedSales.length });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// POST / — single sale (kept for compatibility)
router.post('/', async (req, res) => {
    try {
        const { item: itemId, quantitySold, salePrice, note, date } = req.body;
        const item = await Item.findById(itemId);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        if (item.stock < quantitySold) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Available: ${item.stock} ${item.unit}`,
            });
        }
        const sale = new Sale({
            item: itemId, itemName: item.name, quantitySold, salePrice,
            totalAmount: salePrice * quantitySold, note, date: date || Date.now(),
        });
        await sale.save();
        item.stock -= quantitySold;
        await item.save();
        res.status(201).json({ success: true, data: sale, updatedStock: item.stock });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// DELETE a sale (restore stock)
router.delete('/:id', async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
        const item = await Item.findById(sale.item);
        if (item) { item.stock += sale.quantitySold; await item.save(); }
        await sale.deleteOne();
        res.json({ success: true, message: 'Sale deleted and stock restored' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
