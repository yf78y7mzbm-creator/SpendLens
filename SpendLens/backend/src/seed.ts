import { pool, initializeDatabase } from './index.js'

async function seedData() {
  try {
    console.log('Seeding database with sample data...')

    // Create a demo user
    const userRes = await pool.query(
      `INSERT INTO users (email) VALUES ($1) RETURNING id`,
      ['demo@spendlens.app']
    )
    const userId = userRes.rows[0].id
    console.log('✓ Demo user created:', userId)

    // Get categories
    const catRes = await pool.query(`SELECT id FROM categories`)
    const categories = catRes.rows

    // Create a sample budget for current month
    const currentMonth = new Date().toISOString().slice(0, 7)
    const budgetRes = await pool.query(
      `INSERT INTO budgets (user_id, month, planned_income, planned_fixed_expenses, planned_surplus)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, currentMonth, 5000, 2000, 800]
    )
    const budgetId = budgetRes.rows[0].id
    console.log('✓ Sample budget created for', currentMonth)

    // Add category allocations
    if (categories.length >= 5) {
      await pool.query(
        `INSERT INTO budget_categories (budget_id, category_id, planned_amount)
         VALUES ($1, $2, $3), ($1, $4, $5), ($1, $6, $7), ($1, $8, $9), ($1, $10, $11)`,
        [
          budgetId, categories[0].id, 400,
          budgetId, categories[1].id, 300,
          budgetId, categories[2].id, 150,
          budgetId, categories[3].id, 200,
          budgetId, categories[4].id, 500,
        ]
      )
      console.log('✓ Budget category allocations created')
    }

    // Add sample transactions
    const sampleTransactions = [
      { date: new Date().toISOString().split('T')[0], merchant: 'Whole Foods Market', amount: -45.99, catIdx: 0 },
      { date: new Date().toISOString().split('T')[0], merchant: 'Uber', amount: -28.50, catIdx: 1 },
      { date: new Date().toISOString().split('T')[0], merchant: 'Spotify', amount: -14.99, catIdx: 3 },
      { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], merchant: 'Shell Gas Station', amount: -52.00, catIdx: 1 },
      { date: new Date(Date.now() - 172800000).toISOString().split('T')[0], merchant: 'Amazon', amount: -67.45, catIdx: 4 },
    ]

    for (const txn of sampleTransactions) {
      if (categories[txn.catIdx]) {
        await pool.query(
          `INSERT INTO transactions (user_id, date, amount, merchant, category_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, txn.date, txn.amount, txn.merchant, categories[txn.catIdx].id]
        )
      }
    }
    console.log('✓ Sample transactions created')

    console.log('')
    console.log('Seed complete! Demo user ID:', userId)
  } catch (error) {
    console.error('Seed error:', error)
  } finally {
    await pool.end()
  }
}

// Initialize database first, then seed
initializeDatabase().then(() => seedData())
