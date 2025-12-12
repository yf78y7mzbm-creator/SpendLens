# SpendLens - Complete Project Documentation

## Overview

SpendLens is a full-stack monthly budgeting application built with:
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with automatic schema initialization
- **Deployment**: Docker support, cloud-ready

## Quick Reference

| Task | Command | Location |
|------|---------|----------|
| Start Backend | `npm run dev` | `./backend` |
| Start Frontend | `npm run dev` | `./frontend` |
| Start with Docker | `docker-compose up` | Root |
| Build for Prod | `npm run build` | Backend or Frontend |
| Run Tests | `npm test` | Coming Soon |

## Complete Setup Walkthrough

### Step 1: Install Node.js

**macOS with Homebrew:**
```bash
brew install node
node --version  # Should be 18+
npm --version   # Should be 8+
```

**Or download from:** https://nodejs.org/

### Step 2: Install PostgreSQL

**Option A: Homebrew (Recommended)**
```bash
brew install postgresql@15
brew services start postgresql@15
brew services list  # Verify it's running
```

**Option B: Docker**
```bash
docker run --name spendlens-postgres \
  -e POSTGRES_USER=spendlens_user \
  -e POSTGRES_PASSWORD=password123 \
  -e POSTGRES_DB=spendlens \
  -p 5432:5432 \
  -d postgres:15-alpine
```

**Option C: Download**
- macOS: https://www.postgresql.org/download/macosx/
- Windows/Linux: https://www.postgresql.org/download/

### Step 3: Create Database

```bash
# Open PostgreSQL interactive shell
psql postgres

# Inside psql (postgres=#):
CREATE DATABASE spendlens;
CREATE USER spendlens_user WITH PASSWORD 'password123';
GRANT ALL PRIVILEGES ON DATABASE spendlens TO spendlens_user;

# Verify
\l        # List databases
\du       # List users
\q        # Exit
```

### Step 4: Configure Backend

```bash
cd /Users/rr/Documents/SpendLens/backend

# Copy example env
cp .env.example .env

# Edit .env (already configured with defaults):
# DATABASE_URL=postgresql://spendlens_user:password123@localhost:5432/spendlens
# NODE_ENV=development
# PORT=3000
```

### Step 5: Install Dependencies

```bash
# Backend
cd /Users/rr/Documents/SpendLens/backend
npm install

# Frontend
cd /Users/rr/Documents/SpendLens/frontend
npm install
```

**Wait time:** ~2-3 minutes per folder depending on internet speed.

### Step 6: Start Application

**Terminal 1 - Backend API:**
```bash
cd /Users/rr/Documents/SpendLens/backend
npm run dev

# Expected output:
# SpendLens API running on port 3000
# Database initialized successfully
```

**Terminal 2 - Frontend:**
```bash
cd /Users/rr/Documents/SpendLens/frontend
npm run dev

# Expected output:
# VITE v5.0.8 ready in X ms
# ➜  Local: http://localhost:5173/
```

**Open Browser:** http://localhost:5173

## Docker Setup (Alternative)

If you prefer Docker, it handles everything automatically:

```bash
cd /Users/rr/Documents/SpendLens

# Start all services
docker-compose up

# In another terminal, check if healthy:
docker ps

# Stop everything:
docker-compose down
```

**Ports:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432

## Using SpendLens

### Phase 1: Create a Budget Plan

1. Open http://localhost:5173
2. Click **"📋 Plan"** tab
3. Enter:
   - Expected Monthly Income: `5000`
   - Fixed Monthly Expenses: `2000`
   - Category budgets: Food (`400`), Travel (`300`), etc.
4. Click **"Save Plan"**
5. System calculates: Planned Surplus = Income - Fixed - Categories

### Phase 2: Import Bank Statement

1. Click **"📊 Review"** tab
2. Paste or upload CSV data:
   ```csv
   Date,Merchant,Amount
   2024-12-01,Whole Foods Market,45.99
   2024-12-02,Uber,28.50
   2024-12-03,Spotify,14.99
   2024-12-05,Shell Gas Station,52.00
   ```
3. Click **"Upload Transactions"**
4. Review auto-categorized transactions:
   - Whole Foods → "Food & Dining"
   - Uber → "Travel"
   - Spotify → "Entertainment"
   - Gas → "Travel"
5. Change categories if needed
6. Mark one-time expenses as "One-Off" (e.g., car repair)

### Phase 3: View Analytics Dashboard

1. Click **"📈 Insights"** tab
2. See metrics:
   - **Planned Surplus**: Your target ($1300 in example)
   - **Actual Surplus**: Calculated from imported transactions
   - **Variance**: Difference between planned and actual
   - **Normalized Expenses**: Total minus one-off items
3. Review **Spending by Category**:
   - Green variance = under budget ✅
   - Red variance = over budget ⚠️
4. See **Expense Breakdown**:
   - Total Expenses
   - Recurring vs One-Off split

## API Reference

### Authentication
Currently: No authentication (single demo user)
Future: JWT tokens for multi-user

### Budgets

**Create Budget**
```bash
POST /api/budgets
Content-Type: application/json

{
  "user_id": "demo-user",
  "month": "2024-12",
  "planned_income": 5000,
  "planned_fixed_expenses": 2000,
  "categories": [
    { "name": "Food & Dining", "planned_amount": 400 },
    { "name": "Travel", "planned_amount": 300 }
  ]
}
```

**Get Budget**
```bash
GET /api/budgets/demo-user/2024-12
```

### Transactions

**Upload CSV**
```bash
POST /api/transactions/upload
Content-Type: application/json

{
  "user_id": "demo-user",
  "csv_data": "Date,Merchant,Amount\n2024-12-01,Whole Foods,45.99"
}
```

**List Transactions**
```bash
GET /api/transactions/demo-user/2024-12
```

**Update Transaction** (categorize or flag)
```bash
PATCH /api/transactions/{transaction_id}
Content-Type: application/json

{
  "category_id": "food-category-uuid",
  "is_one_off": true,
  "is_recurring": false
}
```

### Categories

**List Categories**
```bash
GET /api/categories
```

**Create Custom Category**
```bash
POST /api/categories
Content-Type: application/json

{
  "name": "Pet Expenses",
  "keywords": ["petco", "vet", "dog", "cat"],
  "color": "#FF69B4"
}
```

## Database Schema

```sql
-- Users (single for demo, extensible for multi-user)
users:
  id (UUID, PK)
  email (VARCHAR)
  created_at (TIMESTAMP)

-- Spending categories
categories:
  id (UUID, PK)
  name (VARCHAR) - "Food & Dining", "Travel", etc.
  keywords (TEXT[]) - ["whole foods", "restaurant", "grocery"]
  color (VARCHAR) - "#FF6B6B"
  created_at (TIMESTAMP)

-- Monthly budget plans
budgets:
  id (UUID, PK)
  user_id (FK)
  month (VARCHAR) - "2024-12"
  planned_income (DECIMAL)
  planned_fixed_expenses (DECIMAL)
  planned_surplus (DECIMAL)
  created_at, updated_at (TIMESTAMP)

-- Budget allocations by category
budget_categories:
  id (UUID, PK)
  budget_id (FK)
  category_id (FK)
  planned_amount (DECIMAL)

-- Actual transactions from bank statements
transactions:
  id (UUID, PK)
  user_id (FK)
  date (DATE)
  amount (DECIMAL)
  merchant (VARCHAR) - "Whole Foods Market"
  category_id (FK, nullable)
  is_one_off (BOOLEAN)
  is_recurring (BOOLEAN)
  notes (TEXT)
  created_at (TIMESTAMP)
```

## Smart Categorization Algorithm

1. **Keyword Matching**: Splits merchant name into words
2. **Database Lookup**: Searches category keywords array
3. **Substring Matching**: Falls back to partial word matches
4. **Manual Override**: User can change any category in Review phase

**Example:**
- Merchant: "Whole Foods Market"
- Words: ["whole", "foods", "market"]
- Matches category with keyword "whole foods"
- Auto-categorizes to: "Food & Dining" ✅

## File Structure Deep Dive

### Backend (`/backend`)

```
src/
├── index.ts
│   ├── Express server setup
│   ├── CORS middleware
│   ├── Database pool configuration
│   ├── Auto database initialization
│   └── Route registration
│
├── models/index.ts
│   ├── TypeScript interfaces (User, Budget, Transaction, etc.)
│   └── (Database schema init removed - now in index.ts)
│
├── routes/
│   ├── budgets.ts
│   │   ├── POST / - Create budget
│   │   └── GET /:user_id/:month - Fetch budget
│   │
│   ├── transactions.ts
│   │   ├── POST /upload - CSV import with auto-categorization
│   │   ├── GET /:user_id/:month - List transactions
│   │   └── PATCH /:id - Update transaction
│   │
│   └── categories.ts
│       ├── GET / - List categories (init defaults on first call)
│       └── POST / - Create custom category
│
├── services/
│   └── categorization.ts
│       └── categorizeTransaction(merchant: string) - Smart matching
│
└── middleware/
    └── (Error handling, auth coming later)
```

### Frontend (`/frontend`)

```
src/
├── main.tsx
│   └── React entry point, mounts App to #root
│
├── index.css
│   └── Tailwind imports + global styles
│
├── App.tsx
│   ├── Tab navigation (Plan | Review | Insights)
│   ├── Phase state management
│   └── Renders active phase component
│
├── components/
│   ├── PlanPhase.tsx
│   │   ├── Income input
│   │   ├── Fixed expenses input
│   │   ├── 7-category budget allocation
│   │   ├── Real-time surplus calculation
│   │   └── Form submission to API
│   │
│   ├── ReviewPhase.tsx
│   │   ├── CSV paste/upload
│   │   ├── Transaction table
│   │   ├── Category dropdown per row
│   │   ├── One-off/recurring toggle
│   │   └── Bulk update support
│   │
│   └── DashboardPhase.tsx
│       ├── Summary cards (Planned, Actual, Variance)
│       ├── Category spending breakdown
│       ├── Progress bars per category
│       ├── Expense breakdown (Recurring vs One-Off)
│       └── Normalized burn rate
│
├── services/
│   └── api.ts
│       └── Axios wrapper for all API calls
│
├── vite.config.ts
│   └── Vite configuration with API proxy
│
├── tailwind.config.js
│   └── Tailwind theme config
│
└── tsconfig.json
    └── TypeScript compiler options
```

## Troubleshooting

### Backend won't start

**Error: Cannot connect to PostgreSQL**
```bash
# Check if PostgreSQL is running
brew services list | grep postgres

# Start if needed
brew services start postgresql@15

# Verify connection manually
psql postgres
```

**Error: Port 3000 already in use**
```bash
# Change port in backend/.env
# Or kill the process:
lsof -i :3000
kill -9 <PID>
```

### Frontend won't start

**Error: VITE config error**
```bash
# Clear cache
rm -rf node_modules .vite
npm install
npm run dev
```

**Error: Cannot reach backend API**
```bash
# Check that backend is running on port 3000
curl http://localhost:3000/api/health
# Should respond with: {"status":"ok"}

# If not, restart backend
cd backend && npm run dev
```

### Database issues

**Error: Database does not exist**
```bash
# Create it manually
psql postgres -c "CREATE DATABASE spendlens;"
psql postgres -c "CREATE USER spendlens_user WITH PASSWORD 'password123';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE spendlens TO spendlens_user;"
```

**Error: Permission denied**
```bash
# Make sure user exists and has permissions
psql postgres
GRANT ALL PRIVILEGES ON DATABASE spendlens TO spendlens_user;
ALTER DATABASE spendlens OWNER TO spendlens_user;
\q
```

### CSV import not working

**Transactions not uploading:**
```bash
# Check CSV format:
# 1. No quotes around fields
# 2. Comma-delimited
# 3. First row has headers: Date,Merchant,Amount
# 4. Dates in YYYY-MM-DD format

# Example valid CSV:
# 2024-12-01,Whole Foods,45.99
# 2024-12-02,Uber,28.50
```

## Performance Tips

1. **Build Frontend for Production**
   ```bash
   cd frontend
   npm run build
   # Creates optimized dist/ folder
   ```

2. **Database Indexing**
   - Already indexed: user_id, date, category_id
   - Consider adding more if querying 100k+ transactions

3. **Pagination** (Future enhancement)
   - Add `LIMIT 50 OFFSET x` to transaction queries
   - Implement pagination in ReviewPhase component

## Security Considerations

**Current (Demo)**
- No authentication
- No HTTPS
- No CSRF protection

**Production TODO**
- [ ] JWT authentication
- [ ] HTTPS enforcement
- [ ] Rate limiting
- [ ] Input validation/sanitization
- [ ] SQL injection prevention (already using parameterized queries)
- [ ] CORS restrictions
- [ ] Password hashing (bcrypt)
- [ ] Sensitive data encryption

## Deployment Guides

### Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel

# Follow prompts, choose framework: Vite
```

### Render (Backend)

1. Push code to GitHub
2. Connect repository to Render
3. Create web service:
   - Build command: `npm run build`
   - Start command: `npm start`
4. Add environment variables:
   - `DATABASE_URL`: Your hosted PostgreSQL URL
   - `NODE_ENV`: `production`

### Heroku (Backend - Legacy but works)

```bash
# Install Heroku CLI
brew install heroku

# Login
heroku login

# Create app
heroku create spendlens-api

# Set environment
heroku config:set DATABASE_URL=<your-db-url>

# Deploy
git push heroku main
```

## Next Development Phases

### Phase 2: User System
- [ ] User registration/login
- [ ] JWT tokens
- [ ] Email verification
- [ ] Password reset
- [ ] User dashboard with multiple budgets

### Phase 3: Advanced Features
- [ ] Budget rollover automation
- [ ] Historical comparison (YoY, MoM)
- [ ] Machine learning category prediction
- [ ] Anomaly detection (outlier transactions)
- [ ] Recurring expense auto-detection
- [ ] Budget goals & alerts
- [ ] Export to PDF/CSV

### Phase 4: Integration & Mobile
- [ ] Plaid API integration (real bank connections)
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Collaborative budgeting
- [ ] Dark mode
- [ ] Multi-currency support

## Resources

- [React Docs](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [PostgreSQL Manual](https://www.postgresql.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## Support & Contributing

Report issues or suggest features via GitHub issues.

Contributions welcome! Please fork, create a branch, and submit a PR.

---

**Last Updated:** December 2025  
**Version:** 1.0.0-beta
