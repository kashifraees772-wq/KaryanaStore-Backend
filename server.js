require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const itemsRouter = require('./routes/items');
const salesRouter = require('./routes/sales');
const reportsRouter = require('./routes/reports');
const settingsRouter = require('./routes/settings');
const authRouter = require('./routes/auth');

const auth = require('./middleware/auth');

const app = express();

//testing
// Middleware
const corsOptions = {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use(express.json());

// Connect DB middleware for Vercel Serverless
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error('Database connection failed:', err);
        res.status(500).json({ success: false, message: 'Database connection failed' });
    }
});

// Seed admin async after app starts (not await to unblock requests)
connectDB().then(() => {
    if (typeof authRouter.ensureAdminExists === 'function') {
        authRouter.ensureAdminExists();
    }
}).catch(console.error);

// Health check
app.get('/', (req, res) => {
    res.json({ message: '🛒 KaryanaStore API is running!', version: '1.0.0' });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/items', auth, itemsRouter);
app.use('/api/sales', auth, salesRouter);
app.use('/api/reports', auth, reportsRouter);
app.use('/api/settings', auth, settingsRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 KaryanaStore Backend running on http://localhost:${PORT}`);
});

module.exports = app;
