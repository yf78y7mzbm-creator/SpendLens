#!/bin/bash

# SpendLens Setup Script
# Run this script to automatically set up PostgreSQL and the application

set -e

echo "🚀 SpendLens Setup Script"
echo "========================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed."
    echo "Please install PostgreSQL first:"
    echo "  macOS: brew install postgresql@15"
    echo "  Or download from https://www.postgresql.org/download/"
    exit 1
fi

echo "✅ PostgreSQL found"

# Check if PostgreSQL is running
if ! psql -U postgres -d postgres -c "SELECT 1;" &> /dev/null; then
    echo "⚠️  PostgreSQL is not running. Starting..."
    if command -v brew &> /dev/null; then
        brew services start postgresql@15 || brew services start postgresql
    else
        echo "Please start PostgreSQL manually and run this script again."
        exit 1
    fi
fi

echo "✅ PostgreSQL is running"
echo ""

# Create database and user
echo "📦 Creating database and user..."
psql -U postgres -d postgres << EOF
CREATE DATABASE spendlens;
CREATE USER spendlens_user WITH PASSWORD 'password123';
ALTER ROLE spendlens_user SET client_encoding TO 'utf8';
ALTER ROLE spendlens_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE spendlens_user SET default_transaction_deferrable TO on;
ALTER ROLE spendlens_user SET default_time_zone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE spendlens TO spendlens_user;
EOF

echo "✅ Database created"
echo ""

# Install dependencies
echo "📥 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"
echo ""

echo "📥 Installing frontend dependencies..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"
echo ""

echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Terminal 1: cd backend && npm run dev"
echo "2. Terminal 2: cd frontend && npm run dev"
echo "3. Open http://localhost:5173 in your browser"
echo ""
echo "Database credentials:"
echo "  URL: postgresql://spendlens_user:password123@localhost:5432/spendlens"
echo "  (Can be changed in backend/.env)"
