# SpendLens - Monthly Budgeting Application

A precision monthly budgeting web app designed for tracking financial surplus without real-time manual entry. It uses a retrospective "Plan vs. Actuals" workflow.

## 🎯 Product Vision

SpendLens replaces complex spreadsheets with a streamlined budgeting tool. Unlike daily-tracking apps, SpendLens is retrospective: users plan at month-start, live their life, and review actuals at month-end to optimize future budgets.

### Core Workflow

1. **Phase 1: Plan** (Start of Month)
   - Define expected income
   - Set fixed expenses (rent, bills)
   - Allocate budget caps to 5-7 spending categories
   - System calculates planned surplus target

2. **Phase 2: Review** (End of Month)
   - Upload bank statement CSV
   - System auto-categorizes transactions
   - User confirms uncertain categories
   - Flag transactions as one-off or recurring

3. **Phase 3: Insights** (Analysis)
   - Compare planned vs actual spending
   - See category-level variances
   - Identify anomalies (one-off expenses)
   - View normalized burn rate

4. **Phase 4: Rollover** (Next Month)
   - System pre-fills next month's plan from previous month's budget
   - User only adjusts for known changes
   - Creates stable baseline for continuous improvement

## ✨ Key Features

- ✅ **Bank CSV Import** - Drag-and-drop or paste CSV transactions
- ✅ **Smart Categorization** - Heuristic merchant-to-category matching
- ✅ **One-Off Tagging** - Separate exceptional expenses from regular spending
- ✅ **7-Category Simplicity** - Prevents analysis paralysis
- ✅ **Plan vs Actuals Dashboard** - High-level income/spend/surplus visualization
- ✅ **Category Variance Analysis** - Identify spending leaks by category
- ✅ **Anomaly Detection** - Filter one-offs to show normalized spending trends

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **PostgreSQL 12+** (or use Docker)

### Setup Option 1: Manual (macOS)

```bash
# Install Node.js
brew install node

# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Create database
psql postgres
# In psql:
CREATE DATABASE spendlens;
CREATE USER spendlens_user WITH PASSWORD 'password123';
GRANT ALL PRIVILEGES ON DATABASE spendlens TO spendlens_user;
\q

# Clone/navigate to SpendLens
cd /Users/rr/Documents/SpendLens

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start backend (Terminal 1)
cd backend && npm run dev

# Start frontend (Terminal 2)
cd frontend && npm run dev

# Open browser: http://localhost:5173
```

### Setup Option 2: Docker (Easiest)

```bash
# Start everything with Docker Compose
docker-compose up

# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# Database: localhost:5432
```

### Setup Option 3: Interactive Script

```bash
# Run the setup script (coming soon)
chmod +x setup.sh
./setup.sh
```

## 📁 Project Structure

```
SpendLens/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── index.ts           # Server entry, database init
│   │   ├── models/index.ts    # Database schemas & types
│   │   ├── routes/
│   │   │   ├── budgets.ts     # Budget CRUD
│   │   │   ├── transactions.ts # CSV import & transaction management
│   │   │   └── categories.ts  # Category management
│   │   ├── services/
│   │   │   └── categorization.ts # Smart merchant matching
│   │   └── middleware/
│   ├── migrations/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                   # Database credentials (create from .env.example)
│   └── Dockerfile
│
├── frontend/                   # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── PlanPhase.tsx       # 📋 Plan: Budget setup
│   │   │   ├── ReviewPhase.tsx     # 📊 Review: CSV import & categorize
│   │   │   └── DashboardPhase.tsx  # 📈 Insights: Analytics
│   │   ├── services/
│   │   │   └── api.ts             # API client (axios wrapper)
│   │   ├── App.tsx                # Main app, tab navigation
│   │   ├── main.tsx
│   │   └── index.css              # Tailwind CSS
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── docker-compose.yml         # PostgreSQL + Backend orchestration
├── .gitignore
├── SETUP.md                   # Detailed setup instructions
├── README.md                  # This file
└── package.json               # Root (if needed for monorepo)
```

## 🔌 API Endpoints

### Budgets
- `POST /api/budgets` - Create monthly budget
  ```json
  {
    "user_id": "uuid",
    "month": "2024-12",
    "planned_income": 5000,
    "planned_fixed_expenses": 2000,
    "categories": [
      {"category_id": "uuid", "planned_amount": 400}
    ]
  }
  ```

- `GET /api/budgets/:user_id/:month` - Get budget with categories

### Transactions
- `POST /api/transactions/upload` - Import CSV
  ```json
  {
    "user_id": "uuid",
    "csv_data": "Date,Merchant,Amount\n2024-12-01,Whole Foods,45.99"
  }
  ```

- `GET /api/transactions/:user_id/:month` - List transactions

- `PATCH /api/transactions/:id` - Update transaction
  ```json
  {
    "category_id": "uuid",
    "is_one_off": true,
    "is_recurring": false
  }
  ```

### Categories
- `GET /api/categories` - List all categories (auto-initializes defaults)
- `POST /api/categories` - Create custom category

## 📊 Database Schema

**users**
- `id` (UUID)
- `email` (VARCHAR)
- `created_at` (TIMESTAMP)

**budgets**
- `id` (UUID)
- `user_id` (FK to users)
- `month` (VARCHAR, format: YYYY-MM)
- `planned_income` (DECIMAL)
- `planned_fixed_expenses` (DECIMAL)
- `planned_surplus` (DECIMAL)
- `created_at`, `updated_at` (TIMESTAMP)

**budget_categories**
- Joins budgets to categories with planned amounts

**transactions**
- `id` (UUID)
- `user_id` (FK to users)
- `date` (DATE)
- `amount` (DECIMAL)
- `merchant` (VARCHAR)
- `category_id` (FK to categories, nullable)
- `is_one_off` (BOOLEAN)
- `is_recurring` (BOOLEAN)
- `notes` (TEXT)

**categories**
- `id` (UUID)
- `name` (VARCHAR)
- `keywords` (TEXT[], for merchant matching)
- `color` (VARCHAR)

## 📝 CSV Format

For bank statement imports, use this format:

```csv
Date,Merchant,Amount
2024-12-01,Whole Foods Market,45.99
2024-12-02,Uber,28.50
2024-12-03,Spotify Subscription,14.99
2024-12-05,Shell Gas Station,52.00
2024-12-10,Salary Deposit,5000.00
```

**Notes:**
- Expenses are positive or negative (both supported)
- Merchant names are matched against category keywords for auto-categorization
- Dates should be in YYYY-MM-DD format

## 📚 Default Categories

1. **Food & Dining** - Restaurants, groceries, cafes (keywords: restaurant, cafe, grocery, whole foods, etc.)
2. **Travel** - Transportation (keywords: uber, lyft, taxi, gas, airlines, hotel, etc.)
3. **Utilities** - Essential services (keywords: electric, gas, water, internet, phone, etc.)
4. **Entertainment** - Leisure & media (keywords: movie, spotify, netflix, concert, etc.)
5. **Shopping** - Retail purchases (keywords: amazon, walmart, target, mall, etc.)
6. **Health & Fitness** - Wellness (keywords: gym, doctor, pharmacy, yoga, etc.)
7. **Subscriptions** - Recurring services (keywords: subscription, membership, etc.)

## 🛠️ Development

### Start Backend Dev Server
```bash
cd backend
npm run dev
# Runs on http://localhost:3000
# Auto-restarts with code changes (tsx watch)
```

### Start Frontend Dev Server
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
# Hot reload enabled
```

### Build for Production
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm preview
```

## 🐛 Troubleshooting

### "Cannot connect to PostgreSQL"
```bash
# Check if PostgreSQL is running
brew services list

# Start PostgreSQL if needed
brew services start postgresql@15

# Verify connection
psql -U spendlens_user -d spendlens
```

### "Port 3000/5173 already in use"
- Backend: Change `PORT` in `.env`
- Frontend: Vite will auto-increment to 5174, 5175, etc.

### "Module not found" errors
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database schema not created
- Backend auto-initializes on startup
- Check database connection in `.env`
- Check server logs for SQL errors

## 🚢 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Push to GitHub and connect to Vercel
```

### Backend (Render/Railway)
```bash
# Ensure Dockerfile and docker-compose.yml are configured
# Connect repository to hosting platform
# Set DATABASE_URL environment variable
```

## 🎯 Roadmap

### Phase 2 Features
- [ ] User authentication (sign up/login)
- [ ] Email verification
- [ ] Budget rollover automation
- [ ] Historical month comparison
- [ ] Category customization per user
- [ ] Advanced anomaly detection (statistical outliers)
- [ ] Export reports (PDF/CSV)
- [ ] Mobile-responsive improvements
- [ ] Dark mode

### Phase 3 Features
- [ ] Recurring expense detection (ML)
- [ ] Budget forecasting
- [ ] Multi-currency support
- [ ] Collaborative budgeting (shared accounts)
- [ ] Mobile app (React Native)
- [ ] Plaid integration (real bank connections)
- [ ] Automated alerts & notifications

## 💡 Usage Examples

### Example 1: Create a Monthly Budget
1. Click "Plan" tab
2. Enter income: $5000
3. Enter fixed expenses: $2000
4. Allocate by category: Food ($400), Travel ($300), etc.
5. Click "Save Plan"
6. System shows: Planned Surplus = $1300

### Example 2: Import and Review Transactions
1. Click "Review" tab
2. Copy/paste CSV or upload file
3. System auto-categorizes based on merchant names
4. Review transactions and confirm/change categories
5. Mark one-time expenses (car repair) as "One-Off"
6. Click submit

### Example 3: Analyze Performance
1. Click "Insights" tab
2. See Planned vs Actual Surplus
3. Identify which categories exceeded budget
4. Check "Normalized Expenses" (excluding one-offs)
5. Plan adjustments for next month

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request with description

## 📧 Support

For issues or questions, open a GitHub issue or contact support.

---

**Built with ❤️ for better financial planning**
