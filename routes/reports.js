const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Item = require('../models/Item');

// Helper: get date range
const getDateRange = (type) => {
    const now = new Date();
    let start;
    if (type === 'weekly') {
        start = new Date(now);
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
    } else if (type === 'monthly') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (type === 'yearly') {
        start = new Date(now.getFullYear(), 0, 1); // Jan 1st of current year
    } else if (type === 'daily') {
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
    }
    return { start, end: now };
};

// GET daily report
router.get('/daily', async (req, res) => {
    try {
        const { start, end } = getDateRange('daily');
        const sales = await Sale.find({ date: { $gte: start, $lte: end } }).sort({ billNumber: -1, date: -1 });

        // Group by hour
        const grouped = {};
        sales.forEach((s) => {
            const hour = new Date(s.date).toLocaleTimeString('en-PK', { hour: '2-digit', hour12: true });
            if (!grouped[hour]) grouped[hour] = { day: hour, sales: 0, revenue: 0 };
            grouped[hour].sales += s.quantitySold;
            grouped[hour].revenue += s.totalAmount;
        });

        // Per-item breakdown
        const itemMap = {};
        sales.forEach((s) => {
            if (!itemMap[s.itemName]) itemMap[s.itemName] = { name: s.itemName, sold: 0, revenue: 0 };
            itemMap[s.itemName].sold += s.quantitySold;
            itemMap[s.itemName].revenue += s.totalAmount;
        });
        const topItems = Object.values(itemMap).sort((a, b) => b.sold - a.sold);

        const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
        const totalSales = sales.reduce((acc, s) => acc + s.quantitySold, 0);

        res.json({
            success: true,
            period: 'daily',
            date: new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
            totalRevenue,
            totalSales,
            chartData: Object.values(grouped),
            topItems,
            sales,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET weekly report
router.get('/weekly', async (req, res) => {
    try {
        const { start, end } = getDateRange('weekly');
        const sales = await Sale.find({ date: { $gte: start, $lte: end } }).sort({ billNumber: -1, date: -1 });

        // Group by day
        const grouped = {};
        sales.forEach((s) => {
            const day = new Date(s.date).toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' });
            if (!grouped[day]) grouped[day] = { day, sales: 0, revenue: 0 };
            grouped[day].sales += s.quantitySold;
            grouped[day].revenue += s.totalAmount;
        });

        const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
        const totalSales = sales.reduce((acc, s) => acc + s.quantitySold, 0);

        res.json({
            success: true,
            period: 'weekly',
            totalRevenue,
            totalSales,
            chartData: Object.values(grouped),
            sales,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET monthly report
router.get('/monthly', async (req, res) => {
    try {
        const { start, end } = getDateRange('monthly');
        const sales = await Sale.find({ date: { $gte: start, $lte: end } }).sort({ billNumber: -1, date: -1 });

        // Group by date
        const grouped = {};
        sales.forEach((s) => {
            const day = new Date(s.date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
            if (!grouped[day]) grouped[day] = { day, sales: 0, revenue: 0 };
            grouped[day].sales += s.quantitySold;
            grouped[day].revenue += s.totalAmount;
        });

        const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
        const totalSales = sales.reduce((acc, s) => acc + s.quantitySold, 0);

        // Top selling items this month
        const itemMap = {};
        sales.forEach((s) => {
            if (!itemMap[s.itemName]) itemMap[s.itemName] = { name: s.itemName, sold: 0, revenue: 0 };
            itemMap[s.itemName].sold += s.quantitySold;
            itemMap[s.itemName].revenue += s.totalAmount;
        });
        const topItems = Object.values(itemMap).sort((a, b) => b.sold - a.sold).slice(0, 5);

        res.json({
            success: true,
            period: 'monthly',
            totalRevenue,
            totalSales,
            chartData: Object.values(grouped),
            topItems,
            sales,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET yearly report
router.get('/yearly', async (req, res) => {
    try {
        const { start, end } = getDateRange('yearly');
        const sales = await Sale.find({ date: { $gte: start, $lte: end } }).sort({ billNumber: -1, date: -1 });

        // Initialize 12 months (Jan - Dec)
        const grouped = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        months.forEach(m => { grouped[m] = { day: m, sales: 0, revenue: 0 }; });

        // Group by month
        sales.forEach((s) => {
            const m = new Date(s.date).toLocaleString('en-US', { month: 'short' });
            if (grouped[m]) {
                grouped[m].sales += s.quantitySold;
                grouped[m].revenue += s.totalAmount;
            }
        });

        // Per-item breakdown
        const itemMap = {};
        sales.forEach((s) => {
            if (!itemMap[s.itemName]) itemMap[s.itemName] = { name: s.itemName, sold: 0, revenue: 0 };
            itemMap[s.itemName].sold += s.quantitySold;
            itemMap[s.itemName].revenue += s.totalAmount;
        });
        const topItems = Object.values(itemMap).sort((a, b) => b.sold - a.sold).slice(0, 5);

        const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
        const totalSales = sales.reduce((acc, s) => acc + s.quantitySold, 0);

        res.json({
            success: true,
            period: 'yearly',
            date: new Date().getFullYear().toString(),
            totalRevenue,
            totalSales,
            chartData: Object.values(grouped),
            topItems,
            sales,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET dashboard summary
router.get('/summary', async (req, res) => {
    try {
        const totalItems = await Item.countDocuments();
        const lowStockItems = await Item.find({ stock: { $gt: 0, $lte: 5 } }).select('name stock unit category').limit(20);
        const outOfStockItems = await Item.find({ stock: { $lte: 0 } }).select('name stock unit category').limit(20);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySales = await Sale.find({ date: { $gte: today } });
        const todayRevenue = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);

        const recentSales = await Sale.find().sort({ date: -1 }).limit(5);

        res.json({
            success: true,
            totalItems,
            lowStockItems,
            outOfStockItems,
            todaySalesCount: todaySales.length,
            todayRevenue,
            recentSales,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
