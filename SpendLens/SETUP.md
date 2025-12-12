# SpendLens Setup Guide

## Prerequisites

Before running SpendLens, ensure you have:
- **Node.js 18+** ([Install from nodejs.org](https://nodejs.org))
- **PostgreSQL 12+** ([Install from postgresql.org](https://www.postgresql.org/download/macosx/) or via Homebrew)
- **npm** (comes with Node.js)

### Quick Setup on macOS with Homebrew

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js and npm
brew install node

# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15
```

## Installation Steps

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql postgres

# Inside psql:
CREATE DATABASE spendlens;
CREATE USER spendlens_user WITH PASSWORD 'your_password_here';
ALTER ROLE spendlens_user SET client_encoding TO 'utf8';
ALTER ROLE spendlens_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE spendlens_user SET default_transaction_deferrable TO on;
ALTER ROLE spendlens_user SET default_time_zone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE spendlens TO spendlens_user;
\q
```

### 2. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:
```
DATABASE_URL=postgresql://spendlens_user:your_password_here@localhost:5432/spendlens
NODE_ENV=development
PORT=3000
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

### 4. Initialize Database Schema

```bash
# The database tables are automatically created when the backend starts
# But you can manually initialize if needed by running:
npm run build
npm start
# Then stop the server (Ctrl+C)
```

### 5. Install Frontend Dependencies

```bash
cd frontend
npm install
```

## Running the Application

### Terminal 1: Start Backend API Server

```bash
cd backend
npm run dev
# Server will run on http://localhost:3000
```

### Terminal 2: Start Frontend Dev Server

```bash
cd frontend
npm run dev
# Frontend will run on http://localhost:5173
```

### Access the Application

Open your browser and navigate to **http://localhost:5173**

## Project Structure

```
SpendLens/
├── backend/
│   ├── src/
│   │   ├── index.ts           (Express server & database config)
│   │   ├── models/index.ts    (Database schema & types)
│   │   ├── routes/            (API endpoints)
│   │   │   ├── budgets.ts
│   │   │   ├── transactions.ts
│   │   │   └── categories.ts
│   │   ├── services/
│   │   │   └── categorization.ts (Smart merchant matching)
│   │   └── middleware/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PlanPhase.tsx       (Phase 1: Create budget)
│   │   │   ├── ReviewPhase.tsx     (Phase 2: Import & review)
│   │   │   └── DashboardPhase.tsx  (Phase 3: Analytics)
│   │   ├── services/
│   │   │   └── api.ts             (API client)
│   │   ├── App.tsx                (Main app with tabs)
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

## API Endpoints

### Budgets
- `POST /api/budgets` - Create monthly budget
- `GET /api/budgets/:user_id/:month` - Get budget

### Transactions
- `POST /api/transactions/upload` - Upload CSV
- `GET /api/transactions/:user_id/:month` - Get transactions
- `PATCH /api/transactions/:id` - Update transaction

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category

## Example CSV Format

For uploading bank statements in the Review phase, use this format:

```csv
Date,Merchant,Amount
2024-12-01,Whole Foods Market,45.99
2024-12-02,Uber,28.50
2024-12-03,Spotify,14.99
2024-12-05,Shell Gas Station,52.00
2024-12-10,Rent Payment,2000.00
```

## Default Categories

SpendLens comes with 7 pre-defined categories:
1. **Food & Dining** - Restaurants, groceries, cafes
2. **Travel** - Uber, Lyft, gas, airlines
3. **Utilities** - Electric, internet, water
4. **Entertainment** - Movies, streaming, concerts
5. **Shopping** - Amazon, stores, retail
6. **Health & Fitness** - Gyms, doctor, pharmacy
7. **Subscriptions** - Recurring services

## Troubleshooting

### "Cannot connect to PostgreSQL"
- Verify PostgreSQL is running: `brew services list`
- Check DATABASE_URL in .env is correct
- Ensure database exists: `psql postgres -l`

### "Port 3000/5173 already in use"
- Backend: Change PORT in .env
- Frontend: Vite will auto-increment port if 5173 is taken

### "Module not found" errors
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear TypeScript cache: `rm -rf dist`

## Next Features to Build

- [ ] User authentication (sign up/login)
- [ ] Budget rollover automation
- [ ] Historical comparison across months
- [ ] Advanced anomaly detection
- [ ] Export reports as PDF
- [ ] Mobile-responsive improvements
- [ ] Dark mode
- [ ] Email notifications

## Development

### Build backend
```bash
cd backend
npm run build
```

### Build frontend
```bash
cd frontend
npm run build
```

### Production deployment
See [Vercel](https://vercel.com) (frontend) and [Render](https://render.com) (backend) for hosting options.
