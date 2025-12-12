import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createPool } from 'pg';
import budgetRoutes from './routes/budgets.js';
import transactionRoutes from './routes/transactions.js';
import categoryRoutes from './routes/categories.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
export const pool = createPool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Export for seeding
export async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        keywords TEXT[] DEFAULT '{}',
        color VARCHAR(7) DEFAULT '#808080',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        month VARCHAR(7) NOT NULL,
        planned_income DECIMAL(12, 2) NOT NULL,
        planned_fixed_expenses DECIMAL(12, 2) NOT NULL,
        planned_surplus DECIMAL(12, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, month)
      );

      CREATE TABLE IF NOT EXISTS budget_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        budget_id UUID NOT NULL REFERENCES budgets(id),
        category_id UUID NOT NULL REFERENCES categories(id),
        planned_amount DECIMAL(12, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(budget_id, category_id)
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        date DATE NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        merchant VARCHAR(255) NOT NULL,
        category_id UUID REFERENCES categories(id),
        is_one_off BOOLEAN DEFAULT FALSE,
        is_recurring BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
      CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
      CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Initialize on startup
initializeDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Routes
app.use('/api/budgets', budgetRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`SpendLens API running on port ${PORT}`);
});
