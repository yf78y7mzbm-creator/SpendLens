#!/usr/bin/env node

/**
 * Quick start script for SpendLens
 * Run this to get started without manual setup
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'

const execPromise = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function checkCommand(cmd) {
  try {
    await execPromise(`command -v ${cmd}`)
    return true
  } catch {
    return false
  }
}

async function main() {
  console.log('🚀 SpendLens Quick Start\n')

  // Check Node.js
  const hasNode = await checkCommand('node')
  if (!hasNode) {
    console.error('❌ Node.js not found. Please install it first: https://nodejs.org')
    process.exit(1)
  }
  console.log('✅ Node.js detected\n')

  // Check for Docker or PostgreSQL
  const hasDocker = await checkCommand('docker')
  const hasPostgres = await checkCommand('psql')

  if (!hasDocker && !hasPostgres) {
    console.error('⚠️  Neither Docker nor PostgreSQL found.')
    console.error('Choose one:')
    console.error('  1. Install Docker: https://docker.com/products/docker-desktop')
    console.error('  2. Install PostgreSQL: https://www.postgresql.org/download/')
    process.exit(1)
  }

  if (hasDocker) {
    console.log('✅ Docker detected - will use Docker for database\n')
  } else {
    console.log('✅ PostgreSQL detected\n')
  }

  // Install dependencies
  console.log('📦 Installing dependencies...')
  try {
    await execPromise('cd backend && npm install')
    await execPromise('cd frontend && npm install')
    console.log('✅ Dependencies installed\n')
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error)
    process.exit(1)
  }

  // Create .env if it doesn't exist
  const envPath = path.join(__dirname, 'backend', '.env')
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, `DATABASE_URL=postgresql://spendlens_user:password123@localhost:5432/spendlens
NODE_ENV=development
PORT=3000
`)
    console.log('✅ Created .env file\n')
  }

  console.log('🎉 Setup complete!\n')
  console.log('Next steps:')
  console.log('1. Start backend:  cd backend && npm run dev')
  console.log('2. Start frontend: cd frontend && npm run dev')
  console.log('3. Open: http://localhost:5173\n')

  if (hasDocker) {
    console.log('💡 Or use Docker: docker-compose up\n')
  }
}

main().catch(console.error)
