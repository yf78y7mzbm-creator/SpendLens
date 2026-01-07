import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Mock data storage
let users: any[] = [
  { id: 'demo-user', email: 'demo@example.com', password_hash: 'demo123', name: 'Demo User' }
];

let categories = [
  { id: 'c1', name: 'Food & Dining', keywords: ['restaurant', 'food', 'grocery'], color: '#FF5733' },
  { id: 'c2', name: 'Travel', keywords: ['uber', 'lyft', 'airline'], color: '#33FF57' },
  { id: 'c3', name: 'Entertainment', keywords: ['netflix', 'spotify', 'movie'], color: '#3357FF' },
  { id: 'c4', name: 'Shopping', keywords: ['amazon', 'target', 'walmart'], color: '#F333FF' },
  { id: 'c5', name: 'Utilities', keywords: ['electric', 'water', 'gas'], color: '#33FFF3' },
  { id: 'c6', name: 'Health & Fitness', keywords: ['gym', 'pharmacy'], color: '#FF33A1' },
  { id: 'c7', name: 'Subscriptions', keywords: ['subscription', 'membership'], color: '#A1FF33' },
];

let budgets: any[] = [];
let transactions: any[] = [];
let debts: any[] = [];
let debtPlans: any[] = [];

// Simple token generation (not secure, just for demo)
const generateToken = (userId: string) => `mock-token-${userId}--${Date.now()}`;
const getUserFromToken = (token: string) => {
  if (!token) return null;
  const withoutPrefix = token.replace('mock-token-', '');
  const userId = withoutPrefix.split('--')[0];
  return users.find(u => u.id === userId);
};

// Auth middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const user = getUserFromToken(token);
  if (!user) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  req.user = { id: user.id, email: user.email };
  next();
};

// Auth Routes
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (users.find(u => u.email === email.toLowerCase())) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const newUser = {
    id: `user-${Date.now()}`,
    email: email.toLowerCase(),
    password_hash: password, // Not hashing for mock
    name: name || null
  };

  users.push(newUser);
  const token = generateToken(newUser.id);

  res.status(201).json({
    user: { id: newUser.id, email: newUser.email, name: newUser.name },
    token
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = users.find(u => u.email === email.toLowerCase());

  if (!user || user.password_hash !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(user.id);

  res.json({
    user: { id: user.id, email: user.email, name: user.name },
    token
  });
});

app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

// Categories
app.get('/api/categories', (req, res) => {
  res.json(categories);
});

app.post('/api/categories', (req, res) => {
  const newCategory = { id: `c${categories.length + 1}`, ...req.body };
  categories.push(newCategory);
  res.json(newCategory);
});

// Budgets (now with auth)
app.get('/api/budgets/:month', authenticateToken, (req: any, res) => {
  const budget = budgets.find(b => b.user_id === req.user.id && b.month === req.params.month);
  res.json(budget || null);
});

app.post('/api/budgets', authenticateToken, (req: any, res) => {
  const { month, planned_income, planned_fixed_expenses, categories: budgetCategories } = req.body;

  // Calculate planned surplus
  const categoryTotal = budgetCategories?.reduce((sum: number, c: any) => sum + (c.planned_amount || 0), 0) || 0;
  const planned_surplus = planned_income - planned_fixed_expenses - categoryTotal;

  const newBudget = {
    id: `b${budgets.length + 1}`,
    user_id: req.user.id,
    month,
    planned_income,
    planned_fixed_expenses,
    planned_surplus,
    categories: budgetCategories,
    created_at: new Date(),
    updated_at: new Date()
  };

  // Remove existing budget for same month/user
  budgets = budgets.filter(b => !(b.user_id === req.user.id && b.month === month));
  budgets.push(newBudget);

  res.json(newBudget);
});

// Transactions (now with auth)
app.get('/api/transactions/:month', authenticateToken, (req: any, res) => {
  const month = req.params.month;
  const userTransactions = transactions.filter(
    t => t.user_id === req.user.id && t.date.startsWith(month)
  );
  res.json(userTransactions);
});

app.post('/api/transactions/upload', authenticateToken, (req: any, res) => {
  const { csv_data } = req.body;

  if (!csv_data) {
    return res.status(400).json({ error: 'CSV data required' });
  }

  const rows = csv_data.split('\n');
  let uploaded = 0;

  for (const row of rows) {
    if (!row.trim()) continue;

    const [date, merchant, amount] = row.split(',').map((s: string) => s.trim());
    if (!date || !merchant || !amount) continue;

    // Auto-categorize based on keywords
    let category_id = null;
    const merchantLower = merchant.toLowerCase();
    for (const cat of categories) {
      if (cat.keywords.some(k => merchantLower.includes(k))) {
        category_id = cat.id;
        break;
      }
    }

    transactions.push({
      id: `t${Date.now()}-${uploaded}`,
      user_id: req.user.id,
      date,
      amount: parseFloat(amount),
      merchant,
      category_id,
      is_one_off: false,
      is_recurring: false,
      created_at: new Date()
    });

    uploaded++;
  }

  res.json({ uploaded });
});

app.patch('/api/transactions/:id', authenticateToken, (req: any, res) => {
  const txIndex = transactions.findIndex(t => t.id === req.params.id && t.user_id === req.user.id);

  if (txIndex === -1) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  transactions[txIndex] = { ...transactions[txIndex], ...req.body };
  res.json(transactions[txIndex]);
});

app.delete('/api/transactions/:id', authenticateToken, (req: any, res) => {
  const txIndex = transactions.findIndex(t => t.id === req.params.id && t.user_id === req.user.id);

  if (txIndex === -1) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  transactions.splice(txIndex, 1);
  res.json({ deleted: true });
});

// Debts
app.get('/api/debts', authenticateToken, (req: any, res) => {
  const userDebts = debts.filter(d => d.user_id === req.user.id);
  res.json(userDebts);
});

app.post('/api/debts', authenticateToken, (req: any, res) => {
  const { name, balance, interest_rate, min_payment } = req.body;

  if (!name || balance === undefined || min_payment === undefined) {
    return res.status(400).json({ error: 'Name, balance, and minimum payment are required' });
  }

  const newDebt = {
    id: `d${Date.now()}`,
    user_id: req.user.id,
    name,
    balance: parseFloat(balance),
    interest_rate: parseFloat(interest_rate) || 0,
    min_payment: parseFloat(min_payment),
    created_at: new Date(),
    updated_at: new Date()
  };

  debts.push(newDebt);
  res.status(201).json(newDebt);
});

app.patch('/api/debts/:id', authenticateToken, (req: any, res) => {
  const debtIndex = debts.findIndex(d => d.id === req.params.id && d.user_id === req.user.id);

  if (debtIndex === -1) {
    return res.status(404).json({ error: 'Debt not found' });
  }

  debts[debtIndex] = {
    ...debts[debtIndex],
    ...req.body,
    updated_at: new Date()
  };
  res.json(debts[debtIndex]);
});

app.delete('/api/debts/:id', authenticateToken, (req: any, res) => {
  const debtIndex = debts.findIndex(d => d.id === req.params.id && d.user_id === req.user.id);

  if (debtIndex === -1) {
    return res.status(404).json({ error: 'Debt not found' });
  }

  debts.splice(debtIndex, 1);
  res.json({ deleted: true });
});

app.get('/api/debts/plan', authenticateToken, (req: any, res) => {
  const plan = debtPlans.find(p => p.user_id === req.user.id);
  res.json(plan || null);
});

app.post('/api/debts/plan', authenticateToken, (req: any, res) => {
  const { strategy, monthly_payment } = req.body;

  if (!strategy || monthly_payment === undefined) {
    return res.status(400).json({ error: 'Strategy and monthly payment are required' });
  }

  if (!['avalanche', 'snowball'].includes(strategy)) {
    return res.status(400).json({ error: 'Strategy must be avalanche or snowball' });
  }

  // Remove existing plan for user
  debtPlans = debtPlans.filter(p => p.user_id !== req.user.id);

  const newPlan = {
    id: `dp${Date.now()}`,
    user_id: req.user.id,
    strategy,
    monthly_payment: parseFloat(monthly_payment),
    created_at: new Date(),
    updated_at: new Date()
  };

  debtPlans.push(newPlan);
  res.json(newPlan);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'mock' });
});

app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
  console.log('Demo login: demo@example.com / demo123');
});
