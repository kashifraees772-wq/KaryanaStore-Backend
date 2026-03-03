const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// Helper to seed default admin
async function ensureAdminExists() {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        await Admin.create({
            email: 'admin@karyana.com',
            password: hashedPassword
        });
        console.log('✅ Default Admin created: admin@karyana.com / admin123');
    }
}

// Removed immediate execution. It is now called after DB connect.
router.ensureAdminExists = ensureAdminExists;

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const payload = {
            admin: { id: admin.id, email: admin.email }
        };

        jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ success: true, token });
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id).select('-password');
        res.json({ success: true, admin });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/auth/update
router.put('/update', auth, async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;

        const admin = await Admin.findById(req.admin.id);

        // Verify current password to allow update
        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Incorrect current password' });
        }

        if (email) admin.email = email;

        if (newPassword) {
            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash(newPassword, salt);
        }

        await admin.save();
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
