const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initializeDatabase() {
  const db = getDb();

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'cashier' CHECK(role IN ('admin','manager','cashier')),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      last_login TEXT
    );
  `);

  // Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#3B82F6',
      icon TEXT DEFAULT '📦',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `);

  // Suppliers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `);

  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      name_si TEXT,
      description TEXT,
      category_id INTEGER REFERENCES categories(id),
      supplier_id INTEGER REFERENCES suppliers(id),
      unit TEXT NOT NULL DEFAULT 'pcs',
      cost_price REAL NOT NULL DEFAULT 0,
      selling_price REAL NOT NULL DEFAULT 0,
      stock_qty REAL NOT NULL DEFAULT 0,
      min_stock REAL NOT NULL DEFAULT 5,
      max_stock REAL DEFAULT 1000,
      tax_rate REAL DEFAULT 0,
      discount_pct REAL DEFAULT 0,
      image_url TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `);

  // Sales table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_number TEXT UNIQUE NOT NULL,
      cashier_id INTEGER REFERENCES users(id),
      customer_name TEXT,
      subtotal REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      amount_paid REAL NOT NULL DEFAULT 0,
      change_amount REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'cash' CHECK(payment_method IN ('cash','card','qr','mixed')),
      status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed','refunded','void')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `);

  // Sale items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      barcode TEXT,
      quantity REAL NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0,
      discount_pct REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      line_total REAL NOT NULL DEFAULT 0
    );
  `);

  // Stock movements table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id),
      type TEXT NOT NULL CHECK(type IN ('in','out','adjustment','sale','return')),
      quantity REAL NOT NULL,
      quantity_before REAL,
      quantity_after REAL,
      reference TEXT,
      note TEXT,
      user_id INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `);

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `);

  // Seed default settings
  const settingsData = [
    ['store_name', 'Super Lanka Mart'],
    ['store_address', 'No. 123, Main Street, Colombo 03, Sri Lanka'],
    ['store_phone', '+94 11 234 5678'],
    ['store_email', 'info@superlankamart.lk'],
    ['store_registration', 'BR-2024-001234'],
    ['currency', 'LKR'],
    ['tax_rate', '18'],
    ['receipt_header', 'Thank you for shopping at Super Lanka Mart!'],
    ['receipt_footer', 'Visit us again! Hotline: +94 11 234 5678'],
    ['low_stock_threshold', '5'],
    ['pos_tax_inclusive', 'false'],
  ];
  const settingsInsert = db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`);
  settingsData.forEach(([key, value]) => settingsInsert.run(key, value));

  // Seed default admin user
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@supermarket.lk');
  if (!existingAdmin) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(`INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`).run(
      'System Admin', 'admin@supermarket.lk', hash, 'admin'
    );
    console.log('✅ Default admin created: admin@supermarket.lk / admin123');
  }

  // Seed categories
  const categories = [
    ['Beverages', '#3B82F6', '🥤'],
    ['Dairy & Eggs', '#F59E0B', '🥛'],
    ['Snacks & Confectionery', '#EC4899', '🍫'],
    ['Bakery & Bread', '#D97706', '🍞'],
    ['Fruits & Vegetables', '#10B981', '🥦'],
    ['Meat & Seafood', '#EF4444', '🥩'],
    ['Rice & Grains', '#8B5CF6', '🌾'],
    ['Cleaning & Household', '#06B6D4', '🧹'],
    ['Personal Care', '#F97316', '🧴'],
    ['Frozen Foods', '#6366F1', '❄️'],
    ['Canned & Preserved', '#84CC16', '🥫'],
    ['Spices & Condiments', '#A78BFA', '🌶️'],
  ];
  const catInsert = db.prepare(`INSERT OR IGNORE INTO categories (name, color, icon) VALUES (?, ?, ?)`);
  categories.forEach(([name, color, icon]) => catInsert.run(name, color, icon));

  // Seed sample supplier
  const supplierExists = db.prepare('SELECT id FROM suppliers WHERE name = ?').get('Lanka Distributors Pvt Ltd');
  if (!supplierExists) {
    db.prepare(`INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)`)
      .run('Lanka Distributors Pvt Ltd', 'Kamal Perera', '+94 77 123 4567', 'kamal@lankadistr.lk', 'Colombo 10');
    db.prepare(`INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)`)
      .run('Ceylon Food Suppliers', 'Nimal Silva', '+94 71 987 6543', 'nimal@ceylonfood.lk', 'Kandy');
  }

  // Seed sample products
  const bevCat = db.prepare('SELECT id FROM categories WHERE name = ?').get('Beverages');
  const dairyCat = db.prepare('SELECT id FROM categories WHERE name = ?').get('Dairy & Eggs');
  const snackCat = db.prepare('SELECT id FROM categories WHERE name = ?').get('Snacks & Confectionery');
  const riceCat = db.prepare('SELECT id FROM categories WHERE name = ?').get('Rice & Grains');
  const vegCat = db.prepare('SELECT id FROM categories WHERE name = ?').get('Fruits & Vegetables');
  const cleanCat = db.prepare('SELECT id FROM categories WHERE name = ?').get('Cleaning & Household');
  const personalCat = db.prepare('SELECT id FROM categories WHERE name = ?').get('Personal Care');
  const spiceCat = db.prepare('SELECT id FROM categories WHERE name = ?').get('Spices & Condiments');

  const products = [
    // Beverages
    ['8901063152830', 'Coca-Cola 330ml Can', null, bevCat?.id, 'pcs', 85, 120, 100, 10],
    ['8901063001947', 'Coca-Cola 1.5L Bottle', null, bevCat?.id, 'pcs', 195, 270, 60, 10],
    ['8718100887370', 'Pepsi 330ml Can', null, bevCat?.id, 'pcs', 80, 115, 80, 10],
    ['5449000131805', 'Sprite 330ml Can', null, bevCat?.id, 'pcs', 80, 115, 75, 10],
    ['4710088001115', 'Elephant House Ginger Beer 400ml', null, bevCat?.id, 'pcs', 60, 95, 120, 15],
    ['4710088001122', 'Portello 400ml', null, bevCat?.id, 'pcs', 60, 95, 100, 15],
    ['4710088002853', 'Necto 400ml', null, bevCat?.id, 'pcs', 55, 85, 90, 15],
    ['8901719101237', 'Milo 200ml Tetra', null, bevCat?.id, 'pcs', 60, 90, 150, 20],
    ['5000112548167', 'Lipton Ice Tea 500ml', null, bevCat?.id, 'pcs', 130, 180, 50, 10],
    ['4053800037056', 'Red Bull 250ml', null, bevCat?.id, 'pcs', 280, 370, 40, 5],
    // Dairy
    ['4003267030042', 'Anchor Full Cream Milk 1L', null, dairyCat?.id, 'pcs', 320, 440, 80, 10],
    ['8901030826221', 'Kotmale Curd 200g', null, dairyCat?.id, 'pcs', 80, 110, 60, 10],
    ['8901030826238', 'Kotmale Curd 500g', null, dairyCat?.id, 'pcs', 180, 245, 50, 8],
    ['4003267018866', 'Anchor Butter 250g', null, dairyCat?.id, 'pcs', 310, 425, 40, 5],
    ['8901044037323', 'Ambewela Cheese 200g', null, dairyCat?.id, 'pcs', 280, 385, 30, 5],
    // Snacks
    ['4803024020031', 'Tiara Biscuits 100g', null, snackCat?.id, 'pcs', 35, 50, 200, 20],
    ['8901063960045', 'Lay\'s Chips 26g', null, snackCat?.id, 'pcs', 55, 75, 150, 20],
    ['8718452601085', 'KitKat 2 Finger 17g', null, snackCat?.id, 'pcs', 80, 110, 100, 15],
    ['5000159556019', 'Oreo Original 154g', null, snackCat?.id, 'pcs', 280, 380, 60, 10],
    ['8901063960083', 'Kurkure 50g', null, snackCat?.id, 'pcs', 70, 100, 120, 15],
    // Rice & Grains
    ['4719825001001', 'Sunrice Samba 5kg', null, riceCat?.id, 'kg', 850, 1150, 50, 5],
    ['4719825002001', 'Sunrice Basmathi 1kg', null, riceCat?.id, 'kg', 290, 395, 80, 10],
    ['8901063990012', 'Araliya White Rice 5kg', null, riceCat?.id, 'pcs', 880, 1195, 45, 5],
    // Fruits & Vegetables
    ['LK-BAN-001', 'Banana (per kg)', null, vegCat?.id, 'kg', 80, 130, 100, 10],
    ['LK-TOM-001', 'Tomato (per kg)', null, vegCat?.id, 'kg', 120, 190, 80, 10],
    ['LK-POT-001', 'Potato (per kg)', null, vegCat?.id, 'kg', 160, 230, 120, 15],
    ['LK-ONI-001', 'Big Onion (per kg)', null, vegCat?.id, 'kg', 180, 250, 100, 10],
    // Cleaning
    ['8718114343969', 'Dettol Antiseptic 200ml', null, cleanCat?.id, 'pcs', 350, 480, 50, 5],
    ['8718114960157', 'Surf Excel 1kg', null, cleanCat?.id, 'pcs', 380, 520, 60, 5],
    ['4710088020055', 'Sunlight Dishwash 800ml', null, cleanCat?.id, 'pcs', 280, 385, 70, 8],
    // Personal Care
    ['8901384749994', 'Colgate Toothpaste 175g', null, personalCat?.id, 'pcs', 210, 290, 100, 10],
    ['8901214000007', 'Lifebuoy Soap 100g', null, personalCat?.id, 'pcs', 80, 115, 200, 20],
    ['8901384000115', 'Dove Shampoo 180ml', null, personalCat?.id, 'pcs', 520, 715, 40, 5],
    // Spices
    ['4793018001001', 'Maldive Fish 100g', null, spiceCat?.id, 'pcs', 180, 250, 80, 10],
    ['4793018002001', 'Ceylon Cinnamon 50g', null, spiceCat?.id, 'pcs', 95, 140, 100, 15],
    ['4793018003001', 'Curry Powder 200g', null, spiceCat?.id, 'pcs', 140, 200, 90, 10],
  ];

  const productInsert = db.prepare(`
    INSERT OR IGNORE INTO products (barcode, name, category_id, unit, cost_price, selling_price, stock_qty, min_stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  products.forEach(([barcode, name, _, cat_id, unit, cost, price, stock, min_stock]) => {
    productInsert.run(barcode, name, cat_id || null, unit, cost, price, stock, min_stock);
  });

  console.log('✅ Database initialized successfully');
}

module.exports = { getDb, initializeDatabase };
