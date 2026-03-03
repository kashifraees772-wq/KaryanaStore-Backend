require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const Item = require('./models/Item');
const Sale = require('./models/Sale');

// ─── Karyana Store Items ───────────────────────────────────────────────────────
const ITEMS_DATA = [
    { name: 'Basmati Rice (1kg)', category: 'Rice & Grains', price: 320, stock: 150, unit: 'kg', store: 'Main Store' },
    { name: 'Super Kernel Rice', category: 'Rice & Grains', price: 280, stock: 120, unit: 'kg', store: 'Main Store' },
    { name: 'Brown Rice', category: 'Rice & Grains', price: 260, stock: 60, unit: 'kg', store: 'Main Store' },
    { name: 'Maize (Makki)', category: 'Rice & Grains', price: 120, stock: 80, unit: 'kg', store: 'Main Store' },
    { name: 'Oats', category: 'Rice & Grains', price: 180, stock: 40, unit: 'pack', store: 'Main Store' },
    { name: 'Wheat Flour (Aata 10kg)', category: 'Flour & Dough', price: 950, stock: 80, unit: 'bag', store: 'Main Store' },
    { name: 'Maida (Fine Flour)', category: 'Flour & Dough', price: 130, stock: 100, unit: 'kg', store: 'Main Store' },
    { name: 'Semolina (Sooji)', category: 'Flour & Dough', price: 140, stock: 70, unit: 'kg', store: 'Main Store' },
    { name: 'Gram Flour (Besan)', category: 'Flour & Dough', price: 200, stock: 60, unit: 'kg', store: 'Main Store' },
    { name: 'Cooking Oil (1 Liter)', category: 'Oil & Ghee', price: 490, stock: 100, unit: 'liter', store: 'Main Store' },
    { name: 'Dalda Ghee (1kg)', category: 'Oil & Ghee', price: 780, stock: 50, unit: 'kg', store: 'Main Store' },
    { name: 'Olive Oil (500ml)', category: 'Oil & Ghee', price: 1200, stock: 20, unit: 'bottle', store: 'Main Store' },
    { name: 'Sunflower Oil (5L)', category: 'Oil & Ghee', price: 2100, stock: 30, unit: 'bottle', store: 'Main Store' },
    { name: 'Red Chilli Powder', category: 'Spices', price: 95, stock: 80, unit: 'pack', store: 'Main Store' },
    { name: 'Turmeric (Haldi)', category: 'Spices', price: 75, stock: 90, unit: 'pack', store: 'Main Store' },
    { name: 'Coriander Powder', category: 'Spices', price: 80, stock: 70, unit: 'pack', store: 'Main Store' },
    { name: 'Garam Masala', category: 'Spices', price: 120, stock: 60, unit: 'pack', store: 'Main Store' },
    { name: 'Cumin Seeds (Zeera)', category: 'Spices', price: 200, stock: 50, unit: 'pack', store: 'Main Store' },
    { name: 'Black Pepper', category: 'Spices', price: 350, stock: 30, unit: 'pack', store: 'Main Store' },
    { name: 'Biryani Masala', category: 'Spices', price: 150, stock: 55, unit: 'pack', store: 'Main Store' },
    { name: 'Moong Dal', category: 'Pulses', price: 230, stock: 70, unit: 'kg', store: 'Main Store' },
    { name: 'Masoor Dal (Red)', category: 'Pulses', price: 200, stock: 80, unit: 'kg', store: 'Main Store' },
    { name: 'Chana Dal', category: 'Pulses', price: 190, stock: 90, unit: 'kg', store: 'Main Store' },
    { name: 'Black Lentils (Mash)', category: 'Pulses', price: 280, stock: 50, unit: 'kg', store: 'Main Store' },
    { name: 'Chickpeas (Kabuli)', category: 'Pulses', price: 250, stock: 60, unit: 'kg', store: 'Main Store' },
    { name: 'Sugar (1kg)', category: 'Sugar & Salt', price: 140, stock: 200, unit: 'kg', store: 'Main Store' },
    { name: 'Brown Sugar', category: 'Sugar & Salt', price: 180, stock: 60, unit: 'kg', store: 'Main Store' },
    { name: 'Salt (Iodized)', category: 'Sugar & Salt', price: 50, stock: 150, unit: 'pack', store: 'Main Store' },
    { name: 'Rock Salt (Sendha)', category: 'Sugar & Salt', price: 80, stock: 40, unit: 'pack', store: 'Main Store' },
    { name: 'Milk Powder (Nestle)', category: 'Dairy', price: 1400, stock: 25, unit: 'pack', store: 'Main Store' },
    { name: 'Butter (Nirala 200g)', category: 'Dairy', price: 350, stock: 30, unit: 'piece', store: 'Main Store' },
    { name: 'Cream (Dalda)', category: 'Dairy', price: 280, stock: 20, unit: 'pack', store: 'Main Store' },
    { name: 'Tea (Lipton 200g)', category: 'Beverages', price: 480, stock: 50, unit: 'pack', store: 'Main Store' },
    { name: 'Tapal Danedar', category: 'Beverages', price: 450, stock: 55, unit: 'pack', store: 'Main Store' },
    { name: 'Nescafe Classic', category: 'Beverages', price: 950, stock: 20, unit: 'bottle', store: 'Main Store' },
    { name: 'Rooh Afza (400ml)', category: 'Beverages', price: 290, stock: 30, unit: 'bottle', store: 'Main Store' },
    { name: 'Drinking Water (19L)', category: 'Beverages', price: 200, stock: 15, unit: 'bottle', store: 'Main Store' },
    { name: 'Lays Chips (Family)', category: 'Snacks', price: 160, stock: 60, unit: 'pack', store: 'Main Store' },
    { name: 'Biscuits (Sooper)', category: 'Snacks', price: 80, stock: 80, unit: 'pack', store: 'Main Store' },
    { name: 'Chocolates (Kit Kat)', category: 'Snacks', price: 60, stock: 100, unit: 'piece', store: 'Main Store' },
    { name: 'Cashews (100g)', category: 'Snacks', price: 400, stock: 30, unit: 'pack', store: 'Main Store' },
    { name: 'Peanuts (Mungphali)', category: 'Snacks', price: 100, stock: 50, unit: 'pack', store: 'Main Store' },
    { name: 'Surf Excel (1kg)', category: 'Cleaning', price: 620, stock: 40, unit: 'pack', store: 'Main Store' },
    { name: 'Ariel Detergent', category: 'Cleaning', price: 680, stock: 35, unit: 'pack', store: 'Main Store' },
    { name: 'Safeguard Soap', category: 'Cleaning', price: 130, stock: 80, unit: 'piece', store: 'Main Store' },
    { name: 'Vim Dishwash Bar', category: 'Cleaning', price: 90, stock: 60, unit: 'piece', store: 'Main Store' },
    { name: 'Colin Glass Cleaner', category: 'Cleaning', price: 280, stock: 20, unit: 'bottle', store: 'Main Store' },
    { name: 'Matches (Maachis)', category: 'General', price: 20, stock: 200, unit: 'pack', store: 'Main Store' },
    { name: 'Candles (Pack of 10)', category: 'General', price: 60, stock: 50, unit: 'pack', store: 'Main Store' },
    { name: 'Toothpaste (Colgate)', category: 'General', price: 180, stock: 40, unit: 'piece', store: 'Main Store' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function randomBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomDate(start, end) { return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())); }
function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

// ─── Main Seed ─────────────────────────────────────────────────────────────────
async function seed() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected!\n');

        console.log('🧹 Clearing existing data...');
        await Item.deleteMany({});
        await Sale.deleteMany({});
        console.log('✅ Cleared.\n');

        // ── Insert Items ──────────────────────────────────────────────────────
        console.log('📦 Inserting items...');
        const startDate = new Date('2025-09-01');
        const today = new Date('2026-03-03');

        const insertedItems = await Item.insertMany(
            ITEMS_DATA.map(item => ({ ...item, date: randomDate(startDate, today) }))
        );
        console.log(`✅ ${insertedItems.length} items inserted.\n`);

        // ── Generate Bill-wise Sales ──────────────────────────────────────────
        console.log('🧾 Generating bill-wise sales...');
        const notes = ['', '', '', 'Regular customer', 'Cash payment', 'Bulk order', 'Walk-in'];
        const salesDocs = [];
        let billCount = 0;

        // 45 bills with 1–4 items each → ~100–130 total sale lines
        for (let b = 0; b < 45; b++) {
            billCount++;
            const billId = crypto.randomBytes(8).toString('hex');
            const billNumber = `BL-${String(billCount).padStart(4, '0')}`;
            const billDate = randomDate(startDate, today);
            const note = randomFrom(notes);
            const itemsInBill = shuffle(insertedItems).slice(0, randomBetween(1, 4));

            for (const item of itemsInBill) {
                const qty = randomBetween(1, 8);
                const salePrice = item.price + randomBetween(0, Math.floor(item.price * 0.1));
                salesDocs.push({
                    item: item._id,
                    itemName: item.name,
                    quantitySold: qty,
                    salePrice,
                    totalAmount: qty * salePrice,
                    billId,
                    billNumber,
                    note,
                    date: billDate,
                });
            }
        }

        salesDocs.sort((a, b) => a.date - b.date);
        const insertedSales = await Sale.insertMany(salesDocs);

        console.log(`✅ ${insertedSales.length} sale lines inserted.\n`);
        console.log('🎉 Seeding complete!');
        console.log(`   Items  : ${insertedItems.length}`);
        console.log(`   Bills  : ${billCount}  (BL-0001 → BL-${String(billCount).padStart(4, '0')})`);
        console.log(`   Sales  : ${insertedSales.length} line items`);
        console.log(`   Period : Sep 2025 → Mar 2026`);

    } catch (err) {
        console.error('❌ Seed error:', err.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Connection closed.');
        process.exit(0);
    }
}

seed();
