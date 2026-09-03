require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB } = require('./mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Setting = require('../models/Setting');

async function seed() {
  await connectDB();
  console.log('🌱 Starting database seed...\n');

  // ── Settings ──────────────────────────────────────────────────────────
  const settingsData = [
    { key: 'store_name',          value: 'Super Lanka Mart' },
    { key: 'store_address',       value: 'No. 123, Main Street, Colombo 03, Sri Lanka' },
    { key: 'store_phone',         value: '+94 11 234 5678' },
    { key: 'store_email',         value: 'info@superlankamart.lk' },
    { key: 'store_registration',  value: 'BR-2024-001234' },
    { key: 'currency',            value: 'LKR' },
    { key: 'tax_rate',            value: '18' },
    { key: 'receipt_header',      value: 'Thank you for shopping at Super Lanka Mart!' },
    { key: 'receipt_footer',      value: 'Visit us again! Hotline: +94 11 234 5678' },
    { key: 'low_stock_threshold', value: '5' },
    { key: 'pos_tax_inclusive',   value: 'false' },
  ];
  for (const s of settingsData) {
    await Setting.findOneAndUpdate({ key: s.key }, s, { upsert: true });
  }
  console.log('✅ Settings seeded');

  // ── Admin User ─────────────────────────────────────────────────────────
  const adminExists = await User.findOne({ email: 'admin@supermarket.lk' });
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    await User.create({ name: 'System Admin', email: 'admin@supermarket.lk', password_hash: hash, role: 'admin' });
    console.log('✅ Admin user created: admin@supermarket.lk / admin123');
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // ── Categories ─────────────────────────────────────────────────────────
  const categories = [
    { name: 'Beverages',              color: '#3B82F6', icon: '🥤' },
    { name: 'Dairy & Eggs',           color: '#F59E0B', icon: '🥛' },
    { name: 'Snacks & Confectionery', color: '#EC4899', icon: '🍫' },
    { name: 'Bakery & Bread',         color: '#D97706', icon: '🍞' },
    { name: 'Fruits & Vegetables',    color: '#10B981', icon: '🥦' },
    { name: 'Meat & Seafood',         color: '#EF4444', icon: '🥩' },
    { name: 'Rice & Grains',          color: '#8B5CF6', icon: '🌾' },
    { name: 'Cleaning & Household',   color: '#06B6D4', icon: '🧹' },
    { name: 'Personal Care',          color: '#F97316', icon: '🧴' },
    { name: 'Frozen Foods',           color: '#6366F1', icon: '❄️'  },
    { name: 'Canned & Preserved',     color: '#84CC16', icon: '🥫' },
    { name: 'Spices & Condiments',    color: '#A78BFA', icon: '🌶️' },
  ];
  for (const c of categories) {
    await Category.findOneAndUpdate({ name: c.name }, c, { upsert: true, new: true });
  }
  console.log('✅ Categories seeded (12)');

  // ── Suppliers ──────────────────────────────────────────────────────────
  await Supplier.findOneAndUpdate(
    { name: 'Lanka Distributors Pvt Ltd' },
    { name: 'Lanka Distributors Pvt Ltd', contact_person: 'Kamal Perera', phone: '+94 77 123 4567', email: 'kamal@lankadistr.lk', address: 'Colombo 10' },
    { upsert: true }
  );
  await Supplier.findOneAndUpdate(
    { name: 'Ceylon Food Suppliers' },
    { name: 'Ceylon Food Suppliers', contact_person: 'Nimal Silva', phone: '+94 71 987 6543', email: 'nimal@ceylonfood.lk', address: 'Kandy' },
    { upsert: true }
  );
  console.log('✅ Suppliers seeded (2)');

  // ── Products ───────────────────────────────────────────────────────────
  const bev  = await Category.findOne({ name: 'Beverages' });
  const dairy = await Category.findOne({ name: 'Dairy & Eggs' });
  const snack = await Category.findOne({ name: 'Snacks & Confectionery' });
  const rice  = await Category.findOne({ name: 'Rice & Grains' });
  const veg   = await Category.findOne({ name: 'Fruits & Vegetables' });
  const clean = await Category.findOne({ name: 'Cleaning & Household' });
  const pers  = await Category.findOne({ name: 'Personal Care' });
  const spice = await Category.findOne({ name: 'Spices & Condiments' });

  const products = [
    // Beverages
    { barcode:'8901063152830', name:'Coca-Cola 330ml Can',        category_id: bev?._id,   unit:'pcs', cost_price:85,  selling_price:120, stock_qty:100, min_stock:10 },
    { barcode:'8901063001947', name:'Coca-Cola 1.5L Bottle',      category_id: bev?._id,   unit:'pcs', cost_price:195, selling_price:270, stock_qty:60,  min_stock:10 },
    { barcode:'8718100887370', name:'Pepsi 330ml Can',            category_id: bev?._id,   unit:'pcs', cost_price:80,  selling_price:115, stock_qty:80,  min_stock:10 },
    { barcode:'5449000131805', name:'Sprite 330ml Can',           category_id: bev?._id,   unit:'pcs', cost_price:80,  selling_price:115, stock_qty:75,  min_stock:10 },
    { barcode:'4710088001115', name:'Elephant House Ginger Beer', category_id: bev?._id,   unit:'pcs', cost_price:60,  selling_price:95,  stock_qty:120, min_stock:15 },
    { barcode:'4710088001122', name:'Portello 400ml',             category_id: bev?._id,   unit:'pcs', cost_price:60,  selling_price:95,  stock_qty:100, min_stock:15 },
    { barcode:'4710088002853', name:'Necto 400ml',                category_id: bev?._id,   unit:'pcs', cost_price:55,  selling_price:85,  stock_qty:90,  min_stock:15 },
    { barcode:'8901719101237', name:'Milo 200ml Tetra',           category_id: bev?._id,   unit:'pcs', cost_price:60,  selling_price:90,  stock_qty:150, min_stock:20 },
    { barcode:'5000112548167', name:'Lipton Ice Tea 500ml',       category_id: bev?._id,   unit:'pcs', cost_price:130, selling_price:180, stock_qty:50,  min_stock:10 },
    { barcode:'4053800037056', name:'Red Bull 250ml',             category_id: bev?._id,   unit:'pcs', cost_price:280, selling_price:370, stock_qty:40,  min_stock:5  },
    // Dairy
    { barcode:'4003267030042', name:'Anchor Full Cream Milk 1L',  category_id: dairy?._id, unit:'pcs', cost_price:320, selling_price:440, stock_qty:80,  min_stock:10 },
    { barcode:'8901030826221', name:'Kotmale Curd 200g',          category_id: dairy?._id, unit:'pcs', cost_price:80,  selling_price:110, stock_qty:60,  min_stock:10 },
    { barcode:'8901030826238', name:'Kotmale Curd 500g',          category_id: dairy?._id, unit:'pcs', cost_price:180, selling_price:245, stock_qty:50,  min_stock:8  },
    { barcode:'4003267018866', name:'Anchor Butter 250g',         category_id: dairy?._id, unit:'pcs', cost_price:310, selling_price:425, stock_qty:40,  min_stock:5  },
    { barcode:'8901044037323', name:'Ambewela Cheese 200g',       category_id: dairy?._id, unit:'pcs', cost_price:280, selling_price:385, stock_qty:30,  min_stock:5  },
    // Snacks
    { barcode:'4803024020031', name:'Tiara Biscuits 100g',        category_id: snack?._id, unit:'pcs', cost_price:35,  selling_price:50,  stock_qty:200, min_stock:20 },
    { barcode:'8901063960045', name:"Lay's Chips 26g",            category_id: snack?._id, unit:'pcs', cost_price:55,  selling_price:75,  stock_qty:150, min_stock:20 },
    { barcode:'8718452601085', name:'KitKat 2 Finger 17g',        category_id: snack?._id, unit:'pcs', cost_price:80,  selling_price:110, stock_qty:100, min_stock:15 },
    { barcode:'5000159556019', name:'Oreo Original 154g',         category_id: snack?._id, unit:'pcs', cost_price:280, selling_price:380, stock_qty:60,  min_stock:10 },
    { barcode:'8901063960083', name:'Kurkure 50g',                category_id: snack?._id, unit:'pcs', cost_price:70,  selling_price:100, stock_qty:120, min_stock:15 },
    // Rice
    { barcode:'4719825001001', name:'Sunrice Samba 5kg',          category_id: rice?._id,  unit:'pcs', cost_price:850, selling_price:1150,stock_qty:50,  min_stock:5  },
    { barcode:'4719825002001', name:'Sunrice Basmathi 1kg',       category_id: rice?._id,  unit:'kg',  cost_price:290, selling_price:395, stock_qty:80,  min_stock:10 },
    { barcode:'8901063990012', name:'Araliya White Rice 5kg',     category_id: rice?._id,  unit:'pcs', cost_price:880, selling_price:1195,stock_qty:45,  min_stock:5  },
    // Fruits & Veg
    { barcode:'LK-BAN-001',   name:'Banana (per kg)',             category_id: veg?._id,   unit:'kg',  cost_price:80,  selling_price:130, stock_qty:100, min_stock:10 },
    { barcode:'LK-TOM-001',   name:'Tomato (per kg)',             category_id: veg?._id,   unit:'kg',  cost_price:120, selling_price:190, stock_qty:80,  min_stock:10 },
    { barcode:'LK-POT-001',   name:'Potato (per kg)',             category_id: veg?._id,   unit:'kg',  cost_price:160, selling_price:230, stock_qty:120, min_stock:15 },
    { barcode:'LK-ONI-001',   name:'Big Onion (per kg)',          category_id: veg?._id,   unit:'kg',  cost_price:180, selling_price:250, stock_qty:100, min_stock:10 },
    // Cleaning
    { barcode:'8718114343969', name:'Dettol Antiseptic 200ml',    category_id: clean?._id, unit:'pcs', cost_price:350, selling_price:480, stock_qty:50,  min_stock:5  },
    { barcode:'8718114960157', name:'Surf Excel 1kg',             category_id: clean?._id, unit:'pcs', cost_price:380, selling_price:520, stock_qty:60,  min_stock:5  },
    { barcode:'4710088020055', name:'Sunlight Dishwash 800ml',    category_id: clean?._id, unit:'pcs', cost_price:280, selling_price:385, stock_qty:70,  min_stock:8  },
    // Personal Care
    { barcode:'8901384749994', name:'Colgate Toothpaste 175g',    category_id: pers?._id,  unit:'pcs', cost_price:210, selling_price:290, stock_qty:100, min_stock:10 },
    { barcode:'8901214000007', name:'Lifebuoy Soap 100g',         category_id: pers?._id,  unit:'pcs', cost_price:80,  selling_price:115, stock_qty:200, min_stock:20 },
    { barcode:'8901384000115', name:'Dove Shampoo 180ml',         category_id: pers?._id,  unit:'pcs', cost_price:520, selling_price:715, stock_qty:40,  min_stock:5  },
    // Spices
    { barcode:'4793018001001', name:'Maldive Fish 100g',          category_id: spice?._id, unit:'pcs', cost_price:180, selling_price:250, stock_qty:80,  min_stock:10 },
    { barcode:'4793018002001', name:'Ceylon Cinnamon 50g',        category_id: spice?._id, unit:'pcs', cost_price:95,  selling_price:140, stock_qty:100, min_stock:15 },
    { barcode:'4793018003001', name:'Curry Powder 200g',          category_id: spice?._id, unit:'pcs', cost_price:140, selling_price:200, stock_qty:90,  min_stock:10 },
  ];

  let created = 0, skipped = 0;
  for (const p of products) {
    const exists = await Product.findOne({ barcode: p.barcode });
    if (!exists) { await Product.create(p); created++; }
    else skipped++;
  }
  console.log(`✅ Products seeded: ${created} created, ${skipped} already existed`);

  console.log('\n🎉 Database seeded successfully!');
  process.exit(0);
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
